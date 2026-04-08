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
 * Monaco Editor 기반 코드 에디터
 * Arduino C++ 신택스 하이라이트
 */
export class CodeEditor {
  private _container: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _editor: any = null;
  private _ready = false;

  constructor(container: HTMLElement) {
    this._container = container;
    this._init();
  }

  private async _init() {
    // Monaco CDN 로드
    if (!window.monaco) {
      await this._loadMonaco();
    }
    this._createEditor();

    circuitStore.subscribe(() => {
      if (this._editor && this._ready) {
        const current = this._editor.getValue();
        if (current !== circuitStore.code) {
          this._editor.setValue(circuitStore.code);
        }
      }
    });
  }

  private _loadMonaco(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/loader.js';
      script.onload = () => {
        window.require.config({
          paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' },
        });
        window.require(['vs/editor/editor.main'], () => resolve());
      };
      document.head.appendChild(script);
    });
  }

  private _createEditor() {
    if (!window.monaco) return;

    // Arduino C++ 언어 정의
    window.monaco.languages.register({ id: 'arduino' });
    window.monaco.languages.setMonarchTokensProvider('arduino', {
      keywords: [
        'void','int','long','short','byte','char','float','double','boolean','bool',
        'String','unsigned','return','if','else','for','while','do','switch','case',
        'break','continue','const','static','volatile','new','delete','class','struct',
        'enum','include','define','HIGH','LOW','INPUT','OUTPUT','INPUT_PULLUP',
        'LED_BUILTIN','true','false','NULL','Serial','Wire','delay','millis','micros',
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
          [/\b(Serial|Wire|delay|millis|micros|digitalWrite|digitalRead|pinMode|analogRead|analogWrite)\b/, 'type'],
        ],
        blockComment: [
          [/[^*/]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[*/]/, 'comment'],
        ],
      },
    });

    this._editor = window.monaco.editor.create(this._container, {
      value: circuitStore.code,
      language: 'arduino',
      theme: 'vs-dark',
      fontSize: 13,
      fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'off',
      padding: { top: 8, bottom: 8 },
    });

    this._editor.onDidChangeModelContent(() => {
      if (this._ready) {
        circuitStore.setCode(this._editor.getValue());
      }
    });

    this._ready = true;
  }

  focus() { this._editor?.focus(); }

  getValue(): string {
    return this._editor?.getValue() ?? circuitStore.code;
  }
}
