import { circuitStore } from '../stores/circuit-store.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
    require: {
      config: (cfg: object) => void;
      (deps: string[], cb: () => void): void;
    };
  }
}

/**
 * 코드 에디터
 * 선택된 보드의 코드를 표시/편집한다.
 * 1) textarea를 즉시 표시 (항상 동작)
 * 2) Monaco CDN 로드 완료 시 textarea → Monaco 교체
 */
export class CodeEditor {
  private _container: HTMLElement;
  private _textarea: HTMLTextAreaElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _monacoEditor: any = null;

  constructor(container: HTMLElement) {
    this._container = container;
    this._textarea = this._buildTextarea();
    this._tryLoadMonaco();

    circuitStore.subscribe(() => this._syncFromStore());
  }

  // ─── textarea 기본 에디터 ───────────────────────────────────

  private _buildTextarea(): HTMLTextAreaElement {
    this._container.innerHTML = '';
    const ta = document.createElement('textarea');
    ta.style.cssText = `
      width: 100%; height: 100%; border: none; outline: none; resize: none;
      background: #1e1e1e; color: #d4d4d4; font-family: 'Consolas','Fira Code',monospace;
      font-size: 13px; padding: 10px; line-height: 1.5; tab-size: 2;
    `;
    ta.value = circuitStore.activeBoardCode;
    ta.addEventListener('input', () => this._onEditorChange(ta.value));
    ta.spellcheck = false;
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(end);
        ta.selectionStart = ta.selectionEnd = s + 2;
        this._onEditorChange(ta.value);
      }
    });
    this._container.appendChild(ta);
    return ta;
  }

  private _onEditorChange(code: string) {
    const boardId = circuitStore.selectedBoardId;
    if (boardId) circuitStore.setCodeForBoard(boardId, code);
  }

  private _syncFromStore() {
    const code = circuitStore.activeBoardCode;
    const hasBoard = !!circuitStore.selectedBoardId;

    if (this._monacoEditor) {
      if (this._monacoEditor.getValue() !== code) {
        this._monacoEditor.setValue(code);
      }
      this._monacoEditor.updateOptions({ readOnly: !hasBoard });
    } else {
      if (this._textarea.value !== code) {
        this._textarea.value = code;
      }
      this._textarea.readOnly = !hasBoard;
      this._textarea.style.opacity = hasBoard ? '1' : '0.4';
      this._textarea.placeholder = hasBoard
        ? ''
        : '// 캔버스에서 보드를 클릭하면 코드를 편집할 수 있습니다';
    }
  }

  // ─── Monaco CDN 비동기 로드 ────────────────────────────────

  private _tryLoadMonaco() {
    if (window.monaco) { this._mountMonaco(); return; }
    if (document.querySelector('script[data-monaco]')) return;

    const script = document.createElement('script');
    script.dataset.monaco = '1';
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/loader.js';
    script.onload = () => {
      window.require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' },
      });
      window.require(['vs/editor/editor.main'], () => this._mountMonaco());
    };
    script.onerror = () => {
      this._textarea.placeholder = '// Monaco 로드 실패 — textarea 모드로 동작 중\n// 코드를 여기에 직접 입력하세요';
    };
    document.head.appendChild(script);
  }

  private _mountMonaco() {
    if (!window.monaco || this._monacoEditor) return;

    // Arduino C++ 언어 등록
    if (!window.monaco.languages.getLanguages().find((l: { id: string }) => l.id === 'arduino')) {
      window.monaco.languages.register({ id: 'arduino' });
      window.monaco.languages.setMonarchTokensProvider('arduino', {
        keywords: [
          'void','int','long','short','byte','char','float','double','boolean','bool',
          'unsigned','return','if','else','for','while','do','switch','case','break',
          'continue','const','static','volatile','new','delete','class','struct','enum',
          'HIGH','LOW','INPUT','OUTPUT','INPUT_PULLUP','LED_BUILTIN','true','false','NULL',
          'String','Serial','Wire','delay','millis','micros',
          'analogRead','analogWrite','digitalRead','digitalWrite','pinMode',
          'map','constrain','random','abs','min','max','sqrt','pow',
        ],
        tokenizer: {
          root: [
            [/#\w+/, 'keyword'],
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@blockComment'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/'([^'\\]|\\.)*'/, 'string'],
            [/\b\d+(\.\d+)?([uUlLfF])?\b/, 'number'],
            [/\b(void|int|long|short|byte|char|float|double|boolean|bool|String)\b/, 'keyword'],
            [/\b(HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN|true|false|NULL)\b/, 'constant'],
            [/\b(Serial|Wire|delay|millis|micros|digitalWrite|digitalRead|pinMode|analogRead|analogWrite)\b/, 'type.identifier'],
          ],
          blockComment: [
            [/[^*/]+/, 'comment'], [/\*\//, 'comment', '@pop'], [/[*/]/, 'comment'],
          ],
        },
      });
    }

    // 자동완성 제공자 등록
    window.monaco.languages.registerCompletionItemProvider('arduino', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model: unknown, position: unknown) => {
        const monaco = window.monaco;
        const mk = monaco.languages.CompletionItemKind;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const word = (model as any).getWordUntilPosition(position);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const range = { startLineNumber: (position as any).lineNumber, endLineNumber: (position as any).lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const suggestions = [
          { label: 'setup', kind: mk.Function, insertText: 'void setup() {\n  ${1}\n}', insertTextRules: 4, documentation: 'Arduino setup() 함수', range },
          { label: 'loop',  kind: mk.Function, insertText: 'void loop() {\n  ${1}\n}',  insertTextRules: 4, documentation: 'Arduino loop() 함수', range },
          { label: 'pinMode',       kind: mk.Function, insertText: 'pinMode(${1:pin}, ${2:OUTPUT});', insertTextRules: 4, documentation: 'pinMode(pin, mode)', range },
          { label: 'digitalWrite',  kind: mk.Function, insertText: 'digitalWrite(${1:pin}, ${2:HIGH});', insertTextRules: 4, documentation: 'GPIO 디지털 출력', range },
          { label: 'digitalRead',   kind: mk.Function, insertText: 'digitalRead(${1:pin})', insertTextRules: 4, documentation: 'GPIO 디지털 읽기', range },
          { label: 'analogRead',    kind: mk.Function, insertText: 'analogRead(${1:pin})', insertTextRules: 4, documentation: 'ADC 아날로그 읽기 (0~1023)', range },
          { label: 'analogWrite',   kind: mk.Function, insertText: 'analogWrite(${1:pin}, ${2:value});', insertTextRules: 4, documentation: 'PWM 출력 (0~255)', range },
          { label: 'delay',           kind: mk.Function, insertText: 'delay(${1:ms});', insertTextRules: 4, documentation: '밀리초 지연', range },
          { label: 'delayMicroseconds', kind: mk.Function, insertText: 'delayMicroseconds(${1:us});', insertTextRules: 4, documentation: '마이크로초 지연', range },
          { label: 'millis',  kind: mk.Function, insertText: 'millis()', insertTextRules: 4, documentation: '경과 밀리초', range },
          { label: 'micros',  kind: mk.Function, insertText: 'micros()', insertTextRules: 4, documentation: '경과 마이크로초', range },
          { label: 'Serial.begin',   kind: mk.Method, insertText: 'Serial.begin(${1:9600});', insertTextRules: 4, documentation: '시리얼 통신 시작', range },
          { label: 'Serial.print',   kind: mk.Method, insertText: 'Serial.print(${1:value});', insertTextRules: 4, documentation: '시리얼 출력', range },
          { label: 'Serial.println', kind: mk.Method, insertText: 'Serial.println(${1:value});', insertTextRules: 4, documentation: '시리얼 줄바꿈 출력', range },
          { label: 'Serial.available', kind: mk.Method, insertText: 'Serial.available()', insertTextRules: 4, documentation: '수신 버퍼 바이트 수', range },
          { label: 'Serial.read',    kind: mk.Method, insertText: 'Serial.read()', insertTextRules: 4, documentation: '시리얼 1바이트 읽기', range },
          { label: 'map',       kind: mk.Function, insertText: 'map(${1:value}, ${2:fromLow}, ${3:fromHigh}, ${4:toLow}, ${5:toHigh})', insertTextRules: 4, documentation: '값 범위 변환', range },
          { label: 'constrain', kind: mk.Function, insertText: 'constrain(${1:x}, ${2:lo}, ${3:hi})', insertTextRules: 4, documentation: '값 범위 제한', range },
          { label: 'abs',       kind: mk.Function, insertText: 'abs(${1:x})', insertTextRules: 4, documentation: '절대값', range },
          { label: 'min',       kind: mk.Function, insertText: 'min(${1:a}, ${2:b})', insertTextRules: 4, documentation: '최솟값', range },
          { label: 'max',       kind: mk.Function, insertText: 'max(${1:a}, ${2:b})', insertTextRules: 4, documentation: '최댓값', range },
          { label: 'sqrt',      kind: mk.Function, insertText: 'sqrt(${1:x})', insertTextRules: 4, documentation: '제곱근', range },
          { label: 'random',    kind: mk.Function, insertText: 'random(${1:max})', insertTextRules: 4, documentation: '난수 생성', range },
          { label: 'HIGH', kind: mk.Constant, insertText: 'HIGH', documentation: 'GPIO HIGH (1)', range },
          { label: 'LOW',  kind: mk.Constant, insertText: 'LOW',  documentation: 'GPIO LOW (0)', range },
          { label: 'INPUT',        kind: mk.Constant, insertText: 'INPUT',        documentation: '핀 입력 모드', range },
          { label: 'OUTPUT',       kind: mk.Constant, insertText: 'OUTPUT',       documentation: '핀 출력 모드', range },
          { label: 'INPUT_PULLUP', kind: mk.Constant, insertText: 'INPUT_PULLUP', documentation: '내부 풀업 입력', range },
          { label: 'LED_BUILTIN',  kind: mk.Constant, insertText: 'LED_BUILTIN',  documentation: '내장 LED 핀', range },
          { label: 'int',    kind: mk.Keyword, insertText: 'int ', range },
          { label: 'long',   kind: mk.Keyword, insertText: 'long ', range },
          { label: 'float',  kind: mk.Keyword, insertText: 'float ', range },
          { label: 'double', kind: mk.Keyword, insertText: 'double ', range },
          { label: 'bool',   kind: mk.Keyword, insertText: 'bool ', range },
          { label: 'byte',   kind: mk.Keyword, insertText: 'byte ', range },
          { label: 'char',   kind: mk.Keyword, insertText: 'char ', range },
          { label: 'void',   kind: mk.Keyword, insertText: 'void ', range },
          { label: 'String', kind: mk.Keyword, insertText: 'String ', range },
        ];
        return { suggestions };
      },
    });

    this._container.innerHTML = '';
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    this._monacoEditor = window.monaco.editor.create(this._container, {
      value:               circuitStore.activeBoardCode,
      language:            'arduino',
      theme:               isDark ? 'vs-dark' : 'vs',
      fontSize:            13,
      fontFamily:          '"JetBrains Mono","Fira Code","Cascadia Code","Consolas",monospace',
      minimap:             { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout:     true,
      lineNumbers:         'on',
      tabSize:             2,
      insertSpaces:        true,
      wordWrap:            'off',
      padding:             { top: 8, bottom: 8 },
      readOnly:            !circuitStore.selectedBoardId,
    });

    this._monacoEditor.onDidChangeModelContent(() => {
      this._onEditorChange(this._monacoEditor.getValue());
    });
  }

  getValue(): string {
    return this._monacoEditor?.getValue() ?? this._textarea.value;
  }

  focus() {
    this._monacoEditor?.focus() ?? this._textarea.focus();
  }

  relayout() {
    if (this._monacoEditor) {
      requestAnimationFrame(() => this._monacoEditor.layout());
    }
  }
}
