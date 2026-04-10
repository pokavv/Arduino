/**
 * Arduino C++ → JavaScript 트랜스파일러
 * 패턴 기반 변환으로 실제 Arduino 코드를 실행 가능한 JS로 변환
 */
export class ArduinoTranspiler {
  transpile(code: string): string {
    let result = code;

    result = this._stripComments(result);
    result = this._transformPreprocessor(result);
    result = this._transformStructs(result);
    result = this._transformStaticVars(result);
    result = this._transformArrayDecls(result);
    result = this._transformTypes(result);
    result = this._transformForLoopDecls(result);
    result = this._transformEnums(result);
    result = this._transformMultiVarDecls(result);
    result = this._transformArduinoAPI(result);
    result = this._transformStringClass(result);
    result = this._transformMisc(result);
    result = this._wrapFunctions(result);

    return result;
  }

  private _stripComments(code: string): string {
    // 블록 주석 제거
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    // 라인 주석 제거
    code = code.replace(/\/\/[^\n]*/g, '');
    return code;
  }

  private _transformPreprocessor(code: string): string {
    // #include 제거
    code = code.replace(/#include\s*[<"][^>"]*[>"]\s*/g, '');

    // 함수형 매크로: #define MACRO(a, b) body → const MACRO = (a, b) => body;
    // 단순 한 줄 본문만 처리 (멀티라인 매크로는 skip)
    code = code.replace(/#define\s+(\w+)\s*\(([^)]*)\)\s*(.+)/g, (_, name, params, body) => {
      const trimmedBody = body.trim();
      // 백슬래시 라인 연속이면 멀티라인 매크로 → skip
      if (trimmedBody.endsWith('\\')) return '';
      const paramList = params.split(',').map((p: string) => p.trim()).filter(Boolean).join(', ');
      return `const ${name} = (${paramList}) => ${trimmedBody};`;
    });

    // 일반 상수 매크로: #define NAME value
    code = code.replace(/#define\s+(\w+)\s+(.+)/g, (_, name, value) => {
      return `const ${name} = ${value.trim()};`;
    });

    // #pragma 등 나머지 전처리기 지시자 제거
    code = code.replace(/#\w+[^\n]*/g, '');
    return code;
  }

  private _transformStructs(code: string): string {
    // struct 정의: struct Point { int x; int y; }; → function Point() { this.x = 0; this.y = 0; }
    code = code.replace(/struct\s+(\w+)\s*\{([^}]+)\}\s*;?/g, (_, structName: string, body: string) => {
      const fields = body.split(';').map((s: string) => s.trim()).filter(Boolean);
      const assignments = fields.map((field: string) => {
        // 타입 키워드 + 변수명 파싱
        const match = field.match(/(?:unsigned\s+)?(?:int|long|short|byte|char|float|double|bool|boolean|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)/);
        if (!match) return null;
        const [fullMatch, varName] = match;
        // 타입에 따른 기본값 결정
        const defaultVal = /float|double/.test(fullMatch) ? '0.0'
          : /bool/.test(fullMatch) ? 'false'
          : /char/.test(fullMatch) ? "''"
          : /String/.test(fullMatch) ? '""'
          : '0';
        return `  this.${varName} = ${defaultVal};`;
      }).filter(Boolean);
      return `function ${structName}() {\n${assignments.join('\n')}\n}`;
    });

    // struct 변수 선언 with initializer: struct Point p = {1, 2};
    code = code.replace(
      /struct\s+(\w+)\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g,
      (_, typeName: string, varName: string, initValues: string) => {
        const vals = initValues.split(',').map((v: string) => v.trim());
        // 생성자 호출 후 순서대로 필드 할당 (필드 이름 불명이므로 Object.values 방식 사용)
        const assigns = vals.map((v: string, i: number) => `Object.values(${varName})[${i}] !== undefined && (Object.keys(${varName})[${i}] in ${varName}) && (${varName}[Object.keys(${varName})[${i}]] = ${v});`);
        return `let ${varName} = new ${typeName}();\n${assigns.join('\n')}`;
      }
    );

    // struct 변수 선언 without initializer: struct Point p;
    code = code.replace(/struct\s+(\w+)\s+(\w+)\s*;/g, (_, typeName: string, varName: string) => {
      return `let ${varName} = new ${typeName}();`;
    });

    return code;
  }

  private _transformStaticVars(code: string): string {
    // static 변수를 모듈 스코프로 끌어올리기
    // 수집된 static 선언을 코드 최상단에 추가하고, 원래 위치는 제거
    const staticDecls: string[] = [];
    const staticPattern = /^(\s*)static\s+(?:unsigned\s+)?(?:int|long|short|byte|char|float|double|bool|boolean|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*=\s*([^;]+);/gm;

    // 먼저 모든 static 변수를 수집
    let match: RegExpExecArray | null;
    const statics: Array<{ varName: string; initVal: string }> = [];
    while ((match = staticPattern.exec(code)) !== null) {
      const varName = match[2];
      const initVal = match[3].trim();
      // 중복 방지
      if (!statics.some(s => s.varName === varName)) {
        statics.push({ varName, initVal });
        staticDecls.push(`let __static_${varName} = ${initVal};`);
      }
    }

    if (statics.length === 0) return code;

    // 원래 위치의 static 선언 제거 (제거 후 해당 줄은 빈 줄)
    code = code.replace(
      /^(\s*)static\s+(?:unsigned\s+)?(?:int|long|short|byte|char|float|double|bool|boolean|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*=\s*([^;]+);/gm,
      ''
    );

    // 함수 내부에서 해당 변수명 참조를 __static_ 접두사로 교체
    for (const { varName } of statics) {
      // 변수명만 단독으로 사용된 경우 교체 (선언부는 이미 제거됨)
      code = code.replace(new RegExp(`\\b${varName}\\b`, 'g'), `__static_${varName}`);
    }

    // 코드 최상단에 static 변수 선언 추가
    code = staticDecls.join('\n') + '\n' + code;

    return code;
  }

  private _transformArrayDecls(code: string): string {
    // C++ 배열 선언: type name[] = {...} → const name = [...]
    // 예) int arr[] = {1,2,3}; → const arr = [1,2,3];
    // 예) const int lut[4] = {0,1,2,3}; → const lut = [0,1,2,3];
    // 예) byte buf[8] = {0x00, 0xFF}; → let buf = [0x00, 0xFF];
    code = code.replace(
      /^(\s*)(static\s+|volatile\s+)?(const\s+)?(unsigned\s+)?(int|long|short|byte|char|float|double|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|word)\s+(\w+)\s*\[\s*\d*\s*\]\s*=\s*\{([^}]*)\}\s*;/gm,
      (_, indent, _static, isConst, _unsigned, _type, name, body) => {
        const keyword = isConst ? 'const' : 'let';
        // 중괄호 내용을 배열 리터럴로 변환
        return `${indent}${keyword} ${name} = [${body}];`;
      }
    );

    // 초기화 없는 배열 선언: type name[N]; → let name = new Array(N).fill(0);
    // 예) int buf[8]; → let buf = new Array(8).fill(0);
    code = code.replace(
      /^(\s*)(static\s+|volatile\s+)?(const\s+)?(unsigned\s+)?(int|long|short|byte|char|float|double|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|word)\s+(\w+)\s*\[\s*(\d+)\s*\]\s*;/gm,
      (_, indent, _static, _isConst, _unsigned, _type, name, size) => {
        return `${indent}let ${name} = new Array(${size}).fill(0);`;
      }
    );

    return code;
  }

  private _transformTypes(code: string): string {
    // String 타입도 포함 — Arduino String class를 JS string으로 취급
    const typePattern = /\b(unsigned\s+)?(int|long|short|byte|char|float|double|boolean|bool|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|word|String)\b/g;

    // 변수 선언: type name = ... → let name = ...
    // 함수 반환 타입 포함
    code = code.replace(
      /^(\s*)(static\s+|const\s+|volatile\s+)*(unsigned\s+)?(int|long|short|byte|char|float|double|boolean|bool|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|word|void|String)\s+(\*?\w+\s*(?:\[\s*\d*\s*\])*\s*(?:=|;|\())/gm,
      (match, indent, mods, unsigned, type, rest) => {
        if (rest.trim().endsWith('(')) {
          // 함수 선언 — void/int 반환값을 function으로
          return `${indent}function ${rest.trim().slice(0, -1)}(`;
        }
        const modifier = (mods ?? '').includes('const') ? 'const' : 'let';
        return `${indent}${modifier} ${rest}`;
      }
    );

    // 남은 타입 키워드 제거
    code = code.replace(typePattern, '');
    code = code.replace(/\bvoid\b/g, '');

    return code;
  }

  private _transformForLoopDecls(code: string): string {
    // for (int i = ...) → for (let i = ...)
    return code.replace(
      /for\s*\(\s*(unsigned\s+)?(int|long|byte|short|size_t)\s+/g,
      'for (let '
    );
  }

  private _transformEnums(code: string): string {
    return code.replace(
      /enum\s+\w*\s*\{([^}]+)\}/g,
      (_, body: string) => {
        const members = body.split(',').map(s => s.trim()).filter(Boolean);
        return members.map((m, i) => {
          const [name, val] = m.split('=').map(s => s.trim());
          return `const ${name} = ${val ?? i};`;
        }).join('\n');
      }
    );
  }

  private _transformMultiVarDecls(code: string): string {
    // let x = 0, y = 0; → let x = 0;\nlet y = 0;
    return code.replace(
      /\b(let|const)\s+(\w+\s*=\s*[^,;]+(?:,\s*\w+\s*=\s*[^,;]+)+);/g,
      (_, kw, rest) => {
        return rest.split(',')
          .map((part: string) => `${kw} ${part.trim()};`)
          .join('\n');
      }
    );
  }

  private _transformArduinoAPI(code: string): string {
    // Serial.print/println
    code = code.replace(/Serial\.println\s*\(([^)]*)\)/g, '__serial_println($1)');
    code = code.replace(/Serial\.print\s*\(([^)]*)\)/g, '__serial_print($1)');
    code = code.replace(/Serial\.begin\s*\([^)]*\)/g, '__serial_begin()');
    code = code.replace(/Serial\.available\s*\(\)/g, '__serial_available()');
    code = code.replace(/Serial\.read\s*\(\)/g, '__serial_read()');
    code = code.replace(/Serial\.write\s*\(([^)]*)\)/g, '__serial_write($1)');
    code = code.replace(/Serial\.readStringUntil\s*\(([^)]*)\)/g, '__serial_readStringUntil($1)');
    code = code.replace(/Serial\.readString\s*\(\)/g, '__serial_readString()');
    code = code.replace(/Serial\.parseInt\s*\(\)/g, '__serial_parseInt()');
    code = code.replace(/Serial\.parseFloat\s*\(\)/g, '__serial_parseFloat()');
    code = code.replace(/Serial\.peek\s*\(\)/g, '__serial_peek()');
    code = code.replace(/Serial\.flush\s*\(\)/g, '__serial_flush()');
    code = code.replace(/Serial\.setTimeout\s*\([^)]*\)/g, '');

    // digitalRead/Write
    code = code.replace(/digitalWrite\s*\(([^,)]+),\s*([^)]+)\)/g, '__digitalWrite($1,$2)');
    code = code.replace(/digitalRead\s*\(([^)]+)\)/g, '__digitalRead($1)');
    code = code.replace(/pinMode\s*\(([^,)]+),\s*([^)]+)\)/g, '__pinMode($1,$2)');

    // analogRead/Write
    code = code.replace(/analogRead\s*\(([^)]+)\)/g, '__analogRead($1)');
    code = code.replace(/analogWrite\s*\(([^,)]+),\s*([^)]+)\)/g, '__analogWrite($1,$2)');
    code = code.replace(/analogReadResolution\s*\([^)]*\)/g, '');

    // PWM (ESP32)
    code = code.replace(/ledcSetup\s*\([^)]*\)/g, '');
    code = code.replace(/ledcAttachPin\s*\([^)]*\)/g, '');
    code = code.replace(/ledcWrite\s*\(([^,)]+),\s*([^)]+)\)/g, '__analogWrite(__ledcPinMap[$1]??$1,$2)');

    // millis/micros/delay/delayMicroseconds
    code = code.replace(/\bmillis\s*\(\)/g, '__millis()');
    code = code.replace(/\bmicros\s*\(\)/g, '__micros()');
    code = code.replace(/\bdelay\s*\(([^)]+)\)/g, 'await __delay($1)');
    code = code.replace(/\bdelayMicroseconds\s*\(([^)]+)\)/g, 'await __delayUs($1)');

    // Math
    code = code.replace(/\bmap\s*\(/g, '__map(');
    code = code.replace(/\bconstrain\s*\(/g, '__constrain(');
    code = code.replace(/\babs\s*\(/g, 'Math.abs(');
    code = code.replace(/\bmin\s*\(/g, 'Math.min(');
    code = code.replace(/\bmax\s*\(/g, 'Math.max(');
    code = code.replace(/\bsq\s*\(([^)]+)\)/g, '(($1)*($1))');
    code = code.replace(/\bsqrt\s*\(/g, 'Math.sqrt(');
    code = code.replace(/\bpow\s*\(/g, 'Math.pow(');
    code = code.replace(/\bsin\s*\(/g, 'Math.sin(');
    code = code.replace(/\bcos\s*\(/g, 'Math.cos(');
    code = code.replace(/\btan\s*\(/g, 'Math.tan(');
    code = code.replace(/\basin\s*\(/g, 'Math.asin(');
    code = code.replace(/\bacos\s*\(/g, 'Math.acos(');
    code = code.replace(/\batan2?\s*\(/g, 'Math.atan2(');
    code = code.replace(/\blog\s*\(/g, 'Math.log(');
    code = code.replace(/\bexp\s*\(/g, 'Math.exp(');
    code = code.replace(/\bfloor\s*\(/g, 'Math.floor(');
    code = code.replace(/\bceil\s*\(/g, 'Math.ceil(');
    code = code.replace(/\bround\s*\(/g, 'Math.round(');
    code = code.replace(/\bisnan\s*\(/g, 'isNaN(');
    code = code.replace(/\bisinf\s*\(/g, '(!isFinite(');
    code = code.replace(/\bPI\b/g, 'Math.PI');
    code = code.replace(/\bTWO_PI\b/g, '(Math.PI*2)');
    code = code.replace(/\bHALF_PI\b/g, '(Math.PI/2)');
    code = code.replace(/\bDEG_TO_RAD\b/g, '(Math.PI/180)');
    code = code.replace(/\bRAD_TO_DEG\b/g, '(180/Math.PI)');
    code = code.replace(/\brandom\s*\(/g, '__random(');
    code = code.replace(/\brandomSeed\s*\([^)]*\)/g, '');

    // bitwise
    code = code.replace(/\bbitRead\s*\(([^,)]+),\s*([^)]+)\)/g, '(($1>>$2)&1)');
    code = code.replace(/\bbitWrite\s*\(([^,)]+),\s*([^,)]+),\s*([^)]+)\)/g,
      '(($3)?($1)|=(1<<$2):($1)&=~(1<<$2))');
    code = code.replace(/\bbitSet\s*\(([^,)]+),\s*([^)]+)\)/g, '(($1)|=(1<<($2)))');
    code = code.replace(/\bbitClear\s*\(([^,)]+),\s*([^)]+)\)/g, '(($1)&=~(1<<($2)))');
    code = code.replace(/\bbit\s*\(([^)]+)\)/g, '(1<<($1))');
    code = code.replace(/\bhighByte\s*\(([^)]+)\)/g, '(($1)>>8)');
    code = code.replace(/\blowByte\s*\(([^)]+)\)/g, '(($1)&0xFF)');
    code = code.replace(/\bword\s*\(([^,)]+),\s*([^)]+)\)/g, '((($1)<<8)|($2))');

    // tone/pulseIn
    code = code.replace(/\btone\s*\(([^,)]+),\s*([^,)]+)(?:,\s*[^)]+)?\)/g, '__tone($1,$2)');
    code = code.replace(/\bnoTone\s*\(([^)]+)\)/g, '__noTone($1)');
    code = code.replace(/\bpulseIn\s*\(([^)]+)\)/g, 'await __pulseIn($1)');
    code = code.replace(/\bshiftOut\s*\(([^)]+)\)/g, '__shiftOut($1)');
    code = code.replace(/\bshiftIn\s*\(([^)]+)\)/g, '__shiftIn($1)');

    return code;
  }

  private _transformStringClass(code: string): string {
    // String() 생성자
    code = code.replace(/\bnew\s+String\s*\(([^)]*)\)/g, 'String($1)');
    // .length() → .length
    code = code.replace(/\.length\s*\(\)/g, '.length');
    // .toUpperCase() / .toLowerCase() — JS 기본 메서드라 변환 불필요
    // .substring() — 동일
    // .indexOf() — 동일
    // .charAt() — 동일
    // .toInt() — Arduino String.toInt()는 정수 파싱
    code = code.replace(/(\w+)\.toInt\s*\(\)/g, 'parseInt($1, 10)');
    // .toFloat()
    code = code.replace(/(\w+)\.toFloat\s*\(\)/g, 'parseFloat($1)');
    // String concatenation (+ already works in JS)
    return code;
  }

  private _transformMisc(code: string): string {
    // NULL → null
    code = code.replace(/\bNULL\b/g, 'null');
    code = code.replace(/\btrue\b/g, 'true');
    code = code.replace(/\bfalse\b/g, 'false');

    // HIGH/LOW/INPUT/OUTPUT/INPUT_PULLUP
    code = code.replace(/\bHIGH\b/g, '1');
    code = code.replace(/\bLOW\b/g, '0');
    code = code.replace(/\bINPUT_PULLUP\b/g, '2');
    code = code.replace(/\bINPUT\b/g, '0');
    code = code.replace(/\bOUTPUT\b/g, '1');
    code = code.replace(/\bLED_BUILTIN\b/g, '__LED_BUILTIN');

    // float 리터럴 접미사 (1.5f → 1.5)
    code = code.replace(/(\d+\.\d*)[fF]\b/g, '$1');
    code = code.replace(/(\d+)[uUlL]+\b/g, '$1');

    // cast: (int)x → Math.trunc(x), (float)x → (x)
    code = code.replace(/\(int\)\s*([^\s,;)]+)/g, 'Math.trunc($1)');
    code = code.replace(/\(float\)\s*([^\s,;)]+)/g, '($1)');
    code = code.replace(/\(byte\)\s*([^\s,;)]+)/g, '(($1)&0xFF)');
    code = code.replace(/\(long\)\s*([^\s,;)]+)/g, 'Math.trunc($1)');

    // isDigit/isAlpha/isSpace
    code = code.replace(/\bisDigit\s*\(([^)]+)\)/g, '/[0-9]/.test($1)');
    code = code.replace(/\bisAlpha\s*\(([^)]+)\)/g, '/[a-zA-Z]/.test($1)');
    code = code.replace(/\bisSpace\s*\(([^)]+)\)/g, '/\\s/.test($1)');
    code = code.replace(/\bisUpperCase\s*\(([^)]+)\)/g, '/[A-Z]/.test($1)');
    code = code.replace(/\bisLowerCase\s*\(([^)]+)\)/g, '/[a-z]/.test($1)');

    // :: namespace separator → _
    code = code.replace(/(\w+)::(\w+)/g, '$1_$2');

    // delete → (JS has GC, no-op)
    code = code.replace(/\bdelete\s+\w+;/g, '');

    // -> dereference → .
    code = code.replace(/->/g, '.');

    // 함수 파라미터 목록 내 & (참조 파라미터): void foo(int &x, float &y) → void foo(int x, float y)
    // 단순한 비트연산(&, &&, &=)은 건드리지 않도록 파라미터 목록 내부만 처리
    code = code.replace(/\(([^)]+)\)/g, (match: string, inner: string) => {
      // 파라미터 목록으로 보이는 경우 (타입+변수명 패턴)에만 & 제거
      // inner가 연산식일 경우를 최소화하기 위해 타입 키워드 앞뒤 & 만 처리
      const cleaned = inner.replace(
        /\b((?:unsigned\s+)?(?:int|long|short|byte|char|float|double|bool|boolean|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|word))\s*[&*]\s*(\w+)/g,
        '$1 $2'
      );
      return `(${cleaned})`;
    });

    // * pointer dereference: *ptr = val → ptr = val (포인터 역참조 단순화, 선언 외 사용)
    // 단항 * (피연산자 앞)만 제거하되 ** 이중 포인터, *= 복합대입은 건드리지 않음
    code = code.replace(/(?<![*=])\*(?![*=])(\w+)/g, '$1');

    return code;
  }

  private _wrapFunctions(code: string): string {
    // setup()과 loop()을 async 함수로 변환
    code = code.replace(/function\s+setup\s*\(/g, 'async function setup(');
    code = code.replace(/function\s+loop\s*\(/g, 'async function loop(');

    // 일반 함수 중 await가 포함된 것 async 처리
    code = code.replace(
      /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
      (match, name, params) => {
        if (name !== 'setup' && name !== 'loop') {
          return `async function ${name}(${params}) {`;
        }
        return match;
      }
    );

    return code;
  }
}
