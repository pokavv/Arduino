/**
 * Arduino C++ → JavaScript 트랜스파일러
 * 패턴 기반 변환으로 실제 Arduino 코드를 실행 가능한 JS로 변환
 */
export class ArduinoTranspiler {
  transpile(code: string): string {
    let result = code;

    result = this._stripComments(result);
    result = this._transformPreprocessor(result);
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
    // #define 상수
    code = code.replace(/#define\s+(\w+)\s+(.+)/g, (_, name, value) => {
      const trimmed = value.trim();
      // 함수형 매크로는 건너뜀
      if (trimmed.includes('(')) return '';
      return `const ${name} = ${trimmed};`;
    });
    // #pragma 등 제거
    code = code.replace(/#\w+[^\n]*/g, '');
    return code;
  }

  private _transformTypes(code: string): string {
    const typePattern = /\b(unsigned\s+)?(int|long|short|byte|char|float|double|boolean|bool|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|word)\b/g;

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
    code = code.replace(/\bPI\b/g, 'Math.PI');
    code = code.replace(/\brand\s*om\s*\(/g, '__random(');
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
    // .toInt()
    code = code.replace(/\.toInt\s*\(\)/g, '.charCodeAt(0)');
    // .toFloat()
    code = code.replace(/\.toFloat\s*\(\)/g, '__parseFloat(this)');
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

    // & address-of (단순화)
    code = code.replace(/&(\w+)/g, '$1');

    // * dereference (단순화)
    code = code.replace(/\*(\w+)/g, '$1');

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
