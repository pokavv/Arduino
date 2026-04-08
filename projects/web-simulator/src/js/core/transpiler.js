/**
 * @file transpiler.js
 * @brief Arduino C++ 코드를 실행 가능한 JavaScript로 변환하는 트랜스파일러
 *
 * 지원 변환:
 * - 전처리기 지시자 (#include, #define, #pragma)
 * - C++ 타입 선언 → let/const
 * - 함수 반환 타입 제거
 * - 타입캐스트 → JS 동등 표현
 * - delay/millis → async/await 기반
 * - Serial API → _Serial 객체
 * - 구조체 → JS 객체/배열
 *
 * 사용 예:
 *   const t = new Transpiler();
 *   const jsCode = t.transpile(cppSource);
 */

/**
 * Arduino C++ → JavaScript 트랜스파일러
 */
class Transpiler {
    constructor() {
        /**
         * 변환 과정에서 발생한 경고/에러 목록
         * @type {string[]}
         */
        this.warnings = [];
    }

    // ─────────────────────────────────────────────
    // 공개 API
    // ─────────────────────────────────────────────

    /**
     * C++ 코드를 JavaScript 코드로 변환합니다.
     * @param {string} cppCode - 변환할 Arduino C++ 소스 코드
     * @returns {string} 실행 가능한 JavaScript 코드
     */
    transpile(cppCode) {
        this.warnings = [];

        try {
            let code = cppCode;

            // 1단계: 주석 보호 (변환 중 오염 방지용 임시 치환)
            const strings  = [];
            const comments = [];
            code = this._protectStrings(code, strings);
            code = this._protectComments(code, comments);

            // 2단계: 전처리기
            code = this._transformPreprocessor(code);

            // 3단계: 구조체 정의 변환
            code = this._transformStructDefs(code);

            // 4단계: 타입 제거 (변수 선언)
            code = this._transformVariableDeclarations(code);

            // 5단계: 함수 선언 변환
            code = this._transformFunctionDeclarations(code);

            // 6단계: 타입캐스트 변환
            code = this._transformTypeCasts(code);

            // 7단계: Arduino API 변환
            code = this._transformArduinoAPI(code);

            // 8단계: 기타 패턴
            code = this._transformMisc(code);

            // 9단계: 보호 해제
            code = this._restoreComments(code, comments);
            code = this._restoreStrings(code, strings);

            return code;
        } catch (err) {
            const msg = `/* [트랜스파일러 오류] ${err.message} */\n`;
            this.warnings.push(err.message);
            return msg + cppCode;
        }
    }

    /**
     * 변환된 JS 코드에서 setup / loop / 기타 함수를 추출합니다.
     * @param {string} code - transpile()이 반환한 JS 코드
     * @returns {{ setup: string|null, loop: string|null, others: string }}
     */
    extractFunctions(code) {
        const result = { setup: null, loop: null, others: '' };

        // async function setup() { ... } 추출
        result.setup  = this._extractNamedFunction(code, 'setup');
        result.loop   = this._extractNamedFunction(code, 'loop');

        // setup/loop를 제거한 나머지
        let others = code;
        if (result.setup) {
            others = others.replace(result.setup, '');
        }
        if (result.loop) {
            others = others.replace(result.loop, '');
        }
        result.others = others.trim();

        return result;
    }

    // ─────────────────────────────────────────────
    // 내부: 문자열/주석 보호
    // ─────────────────────────────────────────────

    /**
     * 문자열 리터럴을 임시 토큰으로 대체합니다.
     * 변환 규칙이 문자열 내부를 잘못 수정하는 것을 방지합니다.
     * @private
     */
    _protectStrings(code, storage) {
        return code.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
            const idx = storage.length;
            storage.push(match);
            return `__STR_${idx}__`;
        });
    }

    /** @private */
    _restoreStrings(code, storage) {
        return code.replace(/__STR_(\d+)__/g, (_, i) => storage[parseInt(i, 10)]);
    }

    /**
     * 한 줄 주석(//)과 블록 주석(/* *\/)을 임시 토큰으로 대체합니다.
     * @private
     */
    _protectComments(code, storage) {
        // 블록 주석
        code = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
            const idx = storage.length;
            storage.push(match);
            return `__CMT_${idx}__`;
        });
        // 한 줄 주석
        code = code.replace(/\/\/[^\n]*/g, (match) => {
            const idx = storage.length;
            storage.push(match);
            return `__CMT_${idx}__`;
        });
        return code;
    }

    /** @private */
    _restoreComments(code, storage) {
        return code.replace(/__CMT_(\d+)__/g, (_, i) => storage[parseInt(i, 10)]);
    }

    // ─────────────────────────────────────────────
    // 내부: 전처리기 변환
    // ─────────────────────────────────────────────

    /**
     * #include, #pragma, #define 등 전처리기 지시자를 변환합니다.
     * @private
     */
    _transformPreprocessor(code) {
        const lines = code.split('\n');
        const result = [];

        for (let line of lines) {
            const trimmed = line.trim();

            // #include → 제거 (주석 처리)
            if (/^#include\s/.test(trimmed)) {
                result.push(`/* ${trimmed} */`);
                continue;
            }

            // #pragma once → 제거
            if (/^#pragma\s+once/.test(trimmed)) {
                result.push(`/* ${trimmed} */`);
                continue;
            }

            // #ifndef / #ifdef / #endif / #else → 제거
            if (/^#(ifndef|ifdef|endif|else|if)\b/.test(trimmed)) {
                result.push(`/* ${trimmed} */`);
                continue;
            }

            // #define NAME VALUE → const NAME = VALUE;
            // #define NAME       → const NAME = true;
            const defineMatch = trimmed.match(/^#define\s+(\w+)(?:\s+(.+))?$/);
            if (defineMatch) {
                const name  = defineMatch[1];
                const value = defineMatch[2] !== undefined
                    ? defineMatch[2].trim()
                    : 'true';

                // 함수형 매크로는 주석 처리
                if (/\(/.test(name)) {
                    result.push(`/* ${trimmed} — 함수형 매크로는 수동 변환 필요 */`);
                } else {
                    // Arduino 내장 상수는 시뮬레이터가 주입하므로 재정의 금지
                    const _RESERVED = new Set([
                        'OUTPUT','INPUT','INPUT_PULLUP','INPUT_PULLDOWN',
                        'HIGH','LOW','true','false','RISING','FALLING','CHANGE',
                        'LED_BUILTIN','BUILTIN_LED','PI','TWO_PI','HALF_PI',
                        'ADC_0db','ADC_2_5db','ADC_6db','ADC_11db',
                    ]);
                    if (_RESERVED.has(name)) {
                        result.push(`/* ${trimmed} — 내장 상수 재정의 무시 */`);
                    } else {
                        const jsVal = this._convertDefineValue(value);
                        result.push(`let ${name} = ${jsVal};`);
                    }
                }
                continue;
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * #define 값을 JS 표현으로 변환합니다.
     * @private
     */
    _convertDefineValue(value) {
        // 16진수 → 그대로 유지 (JS도 0x 지원)
        if (/^0[xX][0-9a-fA-F]+$/.test(value)) {
            return value;
        }
        // 2진수 → 그대로 유지 (JS는 0b 지원)
        if (/^0[bB][01]+$/.test(value)) {
            return value;
        }
        // float 리터럴 (끝에 f/F) → 숫자로
        if (/^-?\d+\.?\d*[fF]$/.test(value)) {
            return value.replace(/[fF]$/, '');
        }
        // UL/L/u 접미사 제거
        if (/^-?\d+[uUlL]+$/.test(value)) {
            return value.replace(/[uUlL]+$/, '');
        }
        // 문자 리터럴 → 그대로
        if (/^'.'$/.test(value)) {
            return `"${value[1]}"`;
        }
        return value;
    }

    // ─────────────────────────────────────────────
    // 내부: 구조체 변환
    // ─────────────────────────────────────────────

    /**
     * struct 정의를 JS 주석으로 변환하고,
     * 구조체 배열 초기화를 JS 배열 리터럴로 변환합니다.
     * @private
     */
    _transformStructDefs(code) {
        // struct TypeName { ... }; → 주석
        code = code.replace(
            /struct\s+(\w+)\s*\{([^}]*)\}\s*;/g,
            (match, name) => `/* struct ${name}는 JS 객체로 사용됩니다 */`
        );

        // typedef struct { ... } TypeName; → 주석
        code = code.replace(
            /typedef\s+struct\s*\{([^}]*)\}\s*(\w+)\s*;/g,
            (match, body, name) => `/* typedef struct ${name}는 JS 객체로 사용됩니다 */`
        );

        // const StructType arr[] = { {v1,v2,...}, ... };
        // → const arr = [ {}, ... ];  (필드명은 복원 불가, 위치 기반)
        code = code.replace(
            /(?:const\s+)?(\w+)\s+(\w+)\s*\[\s*\]\s*=\s*\{([\s\S]*?)\}\s*;/g,
            (match, typeName, varName, body) => {
                // 기본 타입이면 배열로 변환
                const primitives = new Set([
                    'int','float','double','bool','byte','char',
                    'uint8_t','uint16_t','uint32_t','int8_t','int16_t','int32_t',
                    'long','short','unsigned'
                ]);
                if (primitives.has(typeName)) {
                    return `const ${varName} = [${body}];`;
                }
                // 구조체 배열 — 중첩 중괄호를 JS 배열로 변환
                try {
                    const items = this._parseStructArray(body);
                    const jsItems = items.map(item => `{${item}}`).join(', ');
                    return `const ${varName} = [${jsItems}]; /* ${typeName}[] */`;
                } catch (e) {
                    this.warnings.push(`구조체 배열 변환 실패: ${varName} — ${e.message}`);
                    return `/* [변환 실패] ${match.substring(0, 80)}... */`;
                }
            }
        );

        return code;
    }

    /**
     * 구조체 배열 본문 { {v1,v2}, {v3,v4} } 을 파싱합니다.
     * @private
     * @returns {string[]} 각 요소의 내용 문자열 배열
     */
    _parseStructArray(body) {
        const items = [];
        let depth = 0;
        let current = '';
        let inItem = false;

        for (let i = 0; i < body.length; i++) {
            const ch = body[i];
            if (ch === '{') {
                depth++;
                if (depth === 1) {
                    inItem = true;
                    current = '';
                } else {
                    current += ch;
                }
            } else if (ch === '}') {
                depth--;
                if (depth === 0 && inItem) {
                    items.push(current.trim());
                    inItem = false;
                } else {
                    current += ch;
                }
            } else if (inItem) {
                current += ch;
            }
        }
        return items;
    }

    // ─────────────────────────────────────────────
    // 내부: 변수 선언 변환
    // ─────────────────────────────────────────────

    /**
     * C++ 타입이 있는 변수 선언을 let/const 로 변환합니다.
     * @private
     */
    _transformVariableDeclarations(code) {
        const lines = code.split('\n');
        const result = [];

        for (let line of lines) {
            result.push(this._transformVarLine(line));
        }

        return result.join('\n');
    }

    /**
     * 한 줄의 변수 선언을 변환합니다.
     * @private
     */
    _transformVarLine(line) {
        const trimmed = line.trim();

        // 이미 JS 키워드로 시작하면 스킵
        if (/^(let|const|var|function|async|class|if|for|while|return|\/[/*])/.test(trimmed)) {
            return line;
        }

        // 들여쓰기 추출
        const indent = line.match(/^(\s*)/)[1];

        // const TYPE NAME = VALUE;
        const constMatch = trimmed.match(
            /^const\s+(unsigned\s+)?(\w+)\s+(\w+)\s*(?:\[(\d*)\])?\s*=\s*(.+);$/
        );
        if (constMatch) {
            const varName  = constMatch[3];
            const arrSize  = constMatch[4];
            let   value    = constMatch[5].trim();
            if (arrSize !== undefined) {
                // const char buf[N] = "..." → const buf = "...";
                return `${indent}const ${varName} = ${value};`;
            }
            value = this._cleanInitializer(value, constMatch[2]);
            return `${indent}const ${varName} = ${value};`;
        }

        // static TYPE NAME = VALUE;
        const staticMatch = trimmed.match(
            /^static\s+(unsigned\s+)?(\w+)\s+(\w+)\s*(?:\[(\d*)\])?\s*=\s*(.+);$/
        );
        if (staticMatch) {
            const varName = staticMatch[3];
            let   value   = staticMatch[5].trim();
            value = this._cleanInitializer(value, staticMatch[2]);
            return `${indent}let ${varName} = ${value}; /* static */`;
        }

        // volatile TYPE NAME [= VALUE];
        const volatileMatch = trimmed.match(
            /^volatile\s+(unsigned\s+)?(\w+)\s+(\w+)\s*(?:=\s*(.+))?;$/
        );
        if (volatileMatch) {
            const varName  = volatileMatch[3];
            const rawVal   = volatileMatch[4];
            const typeName = volatileMatch[2];
            const value    = rawVal
                ? this._cleanInitializer(rawVal.trim(), typeName)
                : this._defaultValueForType(typeName);
            return `${indent}let ${varName} = ${value}; /* volatile */`;
        }

        // TYPE NAME[SIZE]; (배열 선언, 초기값 없음)
        const arrDeclMatch = trimmed.match(
            /^(unsigned\s+)?(\w+)\s+(\w+)\s*\[\s*(\d+)\s*\]\s*;$/
        );
        if (arrDeclMatch) {
            const typeName = arrDeclMatch[2];
            const varName  = arrDeclMatch[3];
            const size     = parseInt(arrDeclMatch[4], 10);
            if (this._isCppType(typeName)) {
                return `${indent}let ${varName} = new Array(${size}).fill(0);`;
            }
        }

        // TYPE NAME[] = { ... }; (배열 초기화 — 구조체 변환 후 남은 기본타입)
        const arrInitMatch = trimmed.match(
            /^(unsigned\s+)?(\w+)\s+(\w+)\s*\[\s*\]\s*=\s*(\{[^;]+\})\s*;$/
        );
        if (arrInitMatch) {
            const typeName = arrInitMatch[2];
            const varName  = arrInitMatch[3];
            const value    = arrInitMatch[4];
            if (this._isCppType(typeName)) {
                return `${indent}let ${varName} = ${value};`;
            }
        }

        // 일반 타입 선언: TYPE NAME = VALUE; 또는 TYPE NAME;
        const typeMatch = trimmed.match(
            /^(unsigned\s+long\s+long|unsigned\s+long|unsigned\s+short|unsigned\s+int|unsigned\s+char|signed\s+\w+|long\s+long|long\s+double|\w+)\s+(\w+)\s*(?:=\s*(.+))?;$/
        );
        if (typeMatch) {
            const typeName = typeMatch[1];
            const varName  = typeMatch[2];
            const rawVal   = typeMatch[3];

            if (!this._isCppType(typeName)) {
                return line; // 알 수 없는 타입 → 그대로
            }

            const value = rawVal
                ? this._cleanInitializer(rawVal.trim(), typeName)
                : this._defaultValueForType(typeName);

            return `${indent}let ${varName} = ${value};`;
        }

        return line;
    }

    /**
     * C++ 초기값을 JS 값으로 정리합니다.
     * float 리터럴의 f 접미사 제거, NULL → null 등.
     * @private
     */
    _cleanInitializer(value, typeName) {
        // float 리터럴 → f 제거
        value = value.replace(/(\d+\.?\d*)[fF]\b/g, '$1');
        // UL/L/u 접미사 제거
        value = value.replace(/\b(\d+)[uUlL]+\b/g, '$1');
        // NULL → null
        value = value.replace(/\bNULL\b/g, 'null');
        // true/false는 그대로
        // String("") → ""
        if (typeName === 'String') {
            value = value.replace(/^String\s*\(\s*(.*)\s*\)$/, '$1');
        }
        return value;
    }

    /**
     * C++ 타입의 기본값을 반환합니다.
     * @private
     */
    _defaultValueForType(typeName) {
        const boolTypes = new Set(['bool', 'boolean']);
        const strTypes  = new Set(['String', 'string']);
        if (boolTypes.has(typeName)) {
            return 'false';
        }
        if (strTypes.has(typeName)) {
            return '""';
        }
        return '0';
    }

    /**
     * 알려진 C++ 타입인지 확인합니다.
     * @private
     */
    _isCppType(name) {
        const types = new Set([
            'int', 'float', 'double', 'bool', 'boolean',
            'byte', 'char', 'short', 'long', 'void',
            'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
            'int8_t',  'int16_t',  'int32_t',  'int64_t',
            'size_t', 'unsigned', 'signed',
            'String', 'string',
        ]);
        return types.has(name);
    }

    // ─────────────────────────────────────────────
    // 내부: 함수 선언 변환
    // ─────────────────────────────────────────────

    /**
     * 함수 반환 타입을 제거하고 function 키워드를 추가합니다.
     * setup()과 loop()는 async function 으로 변환합니다.
     * @private
     */
    _transformFunctionDeclarations(code) {
        // IRAM_ATTR, ICACHE_RAM_ATTR 등 ESP32 속성 제거
        code = code.replace(/\b(IRAM_ATTR|ICACHE_RAM_ATTR|DRAM_ATTR)\s+/g, '');

        // 반환 타입 패턴 (void, int, float, String 등)
        const typePattern =
            '(?:unsigned\\s+long\\s+long|unsigned\\s+long|unsigned\\s+short|' +
            'unsigned\\s+int|unsigned\\s+char|signed\\s+\\w+|long\\s+long|' +
            'long\\s+double|void|int|float|double|bool|boolean|byte|char|short|' +
            'long|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|' +
            'size_t|String|string)';

        // 함수 선언 패턴: RETURNTYPE funcName(params) {
        const funcDeclRe = new RegExp(
            `^(\\s*)${typePattern}(?:\\s*\\*)?\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`,
            'gm'
        );

        code = code.replace(funcDeclRe, (match, indent, funcName, params) => {
            const cleanParams = this._cleanFunctionParams(params);
            const isAsync = (funcName === 'setup' || funcName === 'loop');
            const keyword = isAsync ? 'async function' : 'function';
            return `${indent}${keyword} ${funcName}(${cleanParams}) {`;
        });

        // 함수 프로토타입 선언 (중괄호 없음) → 제거
        const protoRe = new RegExp(
            `^\\s*${typePattern}(?:\\s*\\*)?\\s+\\w+\\s*\\([^)]*\\)\\s*;`,
            'gm'
        );
        code = code.replace(protoRe, (match) => `/* ${match.trim()} — 프로토타입 제거 */`);

        return code;
    }

    /**
     * 함수 파라미터에서 타입을 제거합니다.
     * "int x, float y" → "x, y"
     * @private
     */
    _cleanFunctionParams(params) {
        if (!params.trim()) {
            return '';
        }
        return params.split(',').map(param => {
            param = param.trim();
            if (!param || param === 'void') {
                return '';
            }
            // 포인터/참조 제거 후 마지막 토큰이 변수명
            param = param.replace(/\s*[*&]\s*/g, ' ');
            const tokens = param.split(/\s+/).filter(Boolean);
            if (tokens.length >= 2) {
                // 마지막 토큰이 변수명, 나머지는 타입
                return tokens[tokens.length - 1];
            }
            return tokens[0] || '';
        }).filter(Boolean).join(', ');
    }

    // ─────────────────────────────────────────────
    // 내부: 타입캐스트 변환
    // ─────────────────────────────────────────────

    /**
     * C 스타일 타입캐스트를 JS 동등 표현으로 변환합니다.
     * @private
     */
    _transformTypeCasts(code) {
        // (int)x → Math.trunc(x)
        code = code.replace(
            /\((?:int|long|short|int8_t|int16_t|int32_t|uint8_t|uint16_t|uint32_t)\)\s*(\w+|\([^)]+\))/g,
            (match, expr) => `Math.trunc(${expr})`
        );

        // (float)x 또는 (double)x → x (JS는 기본 float)
        code = code.replace(
            /\((?:float|double)\)\s*(\w+|\([^)]+\))/g,
            (match, expr) => expr
        );

        // (byte)x → (x & 0xFF)
        code = code.replace(
            /\(byte\)\s*(\w+|\([^)]+\))/g,
            (match, expr) => `(${expr} & 0xFF)`
        );

        // (char)x → String.fromCharCode(x)
        code = code.replace(
            /\(char\)\s*(\w+|\([^)]+\))/g,
            (match, expr) => `String.fromCharCode(${expr})`
        );

        // (bool)x → Boolean(x)
        code = code.replace(
            /\(bool\)\s*(\w+|\([^)]+\))/g,
            (match, expr) => `Boolean(${expr})`
        );

        // (String)x → String(x)
        code = code.replace(
            /\(String\)\s*(\w+|\([^)]+\))/g,
            (match, expr) => `String(${expr})`
        );

        return code;
    }

    // ─────────────────────────────────────────────
    // 내부: Arduino API 변환
    // ─────────────────────────────────────────────

    /**
     * Arduino/ESP32 고유 API 호출을 JS 런타임 호출로 변환합니다.
     * @private
     */
    _transformArduinoAPI(code) {
        // ── delay / delayMicroseconds ──────────────────────
        code = code.replace(/\bdelay\s*\(/g, 'await _delay(');
        code = code.replace(/\bdelayMicroseconds\s*\(/g, 'await _delayMicros(');

        // ── Serial ────────────────────────────────────────
        code = code.replace(/\bSerial\b/g, '_Serial');

        // ── millis / micros ───────────────────────────────
        // (런타임의 millis()/micros()를 그대로 사용)

        // ── analogWrite (ESP32에서 사용 불가) ─────────────
        code = code.replace(
            /\banalogWrite\s*\(([^,)]+),\s*([^)]+)\)/g,
            (m, pin, duty) => `ledcWrite(0, ${duty}) /* analogWrite → ledcWrite */`
        );

        // ── pgm_read 계열 (PROGMEM 접근) ─────────────────
        code = code.replace(
            /\bpgm_read_(?:byte|word|dword|float|ptr)_near\s*\(([^)]+)\)/g,
            '$1'
        );
        code = code.replace(
            /\bpgm_read_(?:byte|word|dword|float|ptr)\s*\(([^)]+)\)/g,
            '$1'
        );

        return code;
    }

    // ─────────────────────────────────────────────
    // 내부: 기타 패턴 변환
    // ─────────────────────────────────────────────

    /**
     * sizeof, PROGMEM, F(), 포인터, 참조 등 나머지 패턴을 변환합니다.
     * @private
     */
    _transformMisc(code) {
        // sizeof(arr)/sizeof(arr[0]) → arr.length
        code = code.replace(
            /sizeof\s*\(\s*(\w+)\s*\)\s*\/\s*sizeof\s*\(\s*\1\s*\[\s*0\s*\]\s*\)/g,
            '$1.length'
        );

        // sizeof(type) → 0 (의미 없음)
        code = code.replace(/\bsizeof\s*\([^)]+\)/g, '0 /* sizeof */');

        // PROGMEM → 주석
        code = code.replace(/\bPROGMEM\b/g, '/* PROGMEM */');

        // F("문자열") → "문자열"
        code = code.replace(/\bF\s*\(\s*(__STR_\d+__|"[^"]*")\s*\)/g, '$1');

        // NULL → null
        code = code.replace(/\bNULL\b/g, 'null');

        // true/false → 소문자 (C++에서도 소문자지만 TRUE/FALSE 매크로 대응)
        code = code.replace(/\bTRUE\b/g,  'true');
        code = code.replace(/\bFALSE\b/g, 'false');

        // -> (포인터 멤버 접근) → . (JS 객체)
        code = code.replace(/->/g, '.');

        // & (참조 연산자, 단항) → 제거 불가, 비트AND는 유지
        // :: (스코프 연산자) → . に 변환 (간단 처리)
        code = code.replace(/::/g, '.');

        // extern "C" → 제거
        code = code.replace(/\bextern\s+"C"\s*/g, '');

        // #ifndef / #ifdef 이미 처리됨

        return code;
    }

    // ─────────────────────────────────────────────
    // 내부: 런타임 전문(Preamble) 생성
    // ─────────────────────────────────────────────

    /**
     * 런타임이 제공하는 전역 상수/함수 바인딩 코드를 생성합니다.
     * 변환된 코드 맨 앞에 삽입됩니다.
     * @private
     * @returns {string}
     */
    _buildPreamble() {
        return [
            '/* ── Arduino 전역 상수 ────────────────────────────────── */',
            'const OUTPUT       = 1;',
            'const INPUT        = 0;',
            'const INPUT_PULLUP = 2;',
            'const HIGH         = 1;',
            'const LOW          = 0;',
            'const LED_BUILTIN  = 8;  /* ESP32-C3 Super Mini 내장 LED: G8 */',
            '',
            '/* ── 인터럽트 모드 ─────────────────────────────────────── */',
            'const RISING  = 1;',
            'const FALLING = 2;',
            'const CHANGE  = 3;',
            '',
            '/* ── ADC 감쇠 (ESP32) ──────────────────────────────────── */',
            'const ADC_0db   = 0;',
            'const ADC_2_5db = 1;',
            'const ADC_6db   = 2;',
            'const ADC_11db  = 3;',
            '',
            '/* ── 런타임 API 바인딩 (전역 노출) ─────────────────────── */',
            '/* _runtime 객체는 ArduinoRuntime 인스턴스 — 시뮬레이터가 주입 */',
            'function pinMode(pin, mode)            { return _runtime.pinMode(pin, mode); }',
            'function digitalWrite(pin, val)        { return _runtime.digitalWrite(pin, val); }',
            'function digitalRead(pin)              { return _runtime.digitalRead(pin); }',
            'function analogRead(pin)               { return _runtime.analogRead(pin); }',
            'function analogReadResolution(bits)    { return _runtime.analogReadResolution(bits); }',
            'function ledcSetup(ch, freq, res)      { return _runtime.ledcSetup(ch, freq, res); }',
            'function ledcAttachPin(pin, ch)        { return _runtime.ledcAttachPin(pin, ch); }',
            'function ledcWrite(ch, duty)           { return _runtime.ledcWrite(ch, duty); }',
            'function ledcWriteTone(ch, freq)       { return _runtime.ledcWriteTone(ch, freq); }',
            'function ledcDetachPin(pin)            { return _runtime.ledcDetachPin(pin); }',
            'function millis()                      { return _runtime.millis(); }',
            'function micros()                      { return _runtime.micros(); }',
            'async function _delay(ms)              { return _runtime._delay(ms); }',
            'async function _delayMicros(us)        { return _runtime._delayMicros(us); }',
            'function attachInterrupt(pin, fn, mode){ return _runtime.attachInterrupt(pin, fn, mode); }',
            'function detachInterrupt(pin)          { return _runtime.detachInterrupt(pin); }',
            'function map(v, fl, fh, tl, th)        { return _runtime.map(v, fl, fh, tl, th); }',
            'function constrain(v, mn, mx)          { return _runtime.constrain(v, mn, mx); }',
            'function random(min, max)              { return _runtime.random(min, max); }',
            'function randomSeed(seed)              { return _runtime.randomSeed(seed); }',
            'const _Serial = _runtime._Serial;',
            '',
            '/* ── Math 함수 ─────────────────────────────────────────── */',
            'const abs    = Math.abs;',
            'const min    = Math.min;',
            'const max    = Math.max;',
            'const sqrt   = Math.sqrt;',
            'const sin    = Math.sin;',
            'const cos    = Math.cos;',
            'const tan    = Math.tan;',
            'const pow    = Math.pow;',
            'const log    = Math.log;',
            'const floor  = Math.floor;',
            'const ceil   = Math.ceil;',
            'const round  = Math.round;',
            '',
            '/* ── 변환된 사용자 코드 시작 ────────────────────────────── */',
        ].join('\n');
    }

    // ─────────────────────────────────────────────
    // 내부: 함수 본문 추출 유틸리티
    // ─────────────────────────────────────────────

    /**
     * 코드에서 특정 이름의 함수 전체(중괄호 포함)를 추출합니다.
     * @private
     * @param {string} code
     * @param {string} name - 함수 이름
     * @returns {string|null}
     */
    _extractNamedFunction(code, name) {
        // async function setup() { 또는 function setup() { 패턴 찾기
        const startRe = new RegExp(
            `(?:async\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`
        );
        const startMatch = startRe.exec(code);
        if (!startMatch) {
            return null;
        }

        const startIdx = startMatch.index;
        const braceStart = code.indexOf('{', startIdx + startMatch[0].length - 1);

        let depth = 0;
        let i = braceStart;

        for (; i < code.length; i++) {
            if (code[i] === '{') {
                depth++;
            } else if (code[i] === '}') {
                depth--;
                if (depth === 0) {
                    break;
                }
            }
        }

        return code.substring(startIdx, i + 1);
    }
}

// 전역으로 노출 (script 태그 로드 호환)
if (typeof window !== 'undefined') {
    window.Transpiler = Transpiler;
}
