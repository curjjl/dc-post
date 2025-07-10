
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Monaco Editor配置，禁用Web Worker以避免加载问题
export function setupMonacoEnvironment() {
  // 设置Monaco Environment，禁用Web Worker
  if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
      getWorker: function (workerId, label) {
        // 返回null会让Monaco Editor回退到主线程模式
        return null;
      }
    };
  }

  // 同时设置self.MonacoEnvironment以防万一
  if (typeof self !== 'undefined') {
    self.MonacoEnvironment = {
      getWorker: function (workerId, label) {
        return null;
      }
    };

    self.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === 'json') {
          return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new htmlWorker();
        }
        if (['typescript', 'javascript'].includes(label)) {
          return new tsWorker();
        }
        return new EditorWorker();
      },
    };
  }
}

// 初始化Monaco Editor配置
export function initializeMonaco() {
  try {
    setupMonacoEnvironment()
    console.log('Monaco Editor environment configured (main thread mode)')
  } catch (error) {
    console.error('Failed to configure Monaco Editor environment:', error)
  }
}
