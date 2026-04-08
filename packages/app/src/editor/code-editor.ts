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
 * 1) textarea 를 즉시 표시 (항상 동작)
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
    ta.value = circuitStore.code;
    ta.addEventListener('input', () => circuitStore.setCode(ta.value));
    ta.spellcheck = false;
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(end);
        ta.selectionStart = ta.selectionEnd = s + 2;
        circuitStore.setCode(ta.value);
      }
    });
    this._container.appendChild(ta);
    return ta;
  }

  private _syncFromStore() {
    const code = circuitStore.code;
    if (this._monacoEditor) {
      if (this._monacoEditor.getValue() !== code) {
        this._monacoEditor.setValue(code);
      }
    } else {
      if (this._textarea.value !== code) {
        this._textarea.value = code;
      }
    }
  }

  // ─── Monaco CDN 비동기 로드 ────────────────────────────────

  private _tryLoadMonaco() {
    if (window.monaco) { this._mountMonaco(); return; }
    if (document.querySelector('script[data-monaco]')) return; // 이미 로드 중

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
      // CDN 실패 — textarea 유지, 표시 개선
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

    this._container.innerHTML = '';
    this._monacoEditor = window.monaco.editor.create(this._container, {
      value: circuitStore.code,
      language: 'arduino',
      theme: 'vs-dark',
      fontSize: 13,
      fontFamily: '"Fira Code","Cascadia Code","Consolas",monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: 'on',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'off',
      padding: { top: 8, bottom: 8 },
    });

    this._monacoEditor.onDidChangeModelContent(() => {
      circuitStore.setCode(this._monacoEditor.getValue());
    });
  }

  getValue(): string {
    return this._monacoEditor?.getValue() ?? this._textarea.value;
  }

  focus() {
    this._monacoEditor?.focus() ?? this._textarea.focus();
  }
}
