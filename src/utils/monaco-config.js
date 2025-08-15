
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import monacoEditorManager from './monaco-editor-manager';

let isInitialized = false;

// Monaco Editor配置
export function setupMonacoEnvironment() {
  if (isInitialized) {
    return;
  }

  // 优先使用Worker模式，回退到主线程模式
  const getWorkerFunction = (_, label) => {
    try {
      switch (label) {
        case 'json':
          return new jsonWorker();
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker();
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker();
        case 'typescript':
        case 'javascript':
          return new tsWorker();
        default:
          return new EditorWorker();
      }
    } catch (error) {
      console.warn(`Failed to create worker for ${label}, falling back to main thread:`, error);
      return null; // 回退到主线程模式
    }
  };

  // 设置Monaco Environment
  if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
      getWorker: getWorkerFunction
    };
  }

  if (typeof self !== 'undefined') {
    self.MonacoEnvironment = {
      getWorker: getWorkerFunction
    };
  }

  isInitialized = true;
}

// 获取编辑器默认配置
export function getDefaultEditorOptions() {
  return {
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto'
    },
    wordWrap: 'on',
    formatOnPaste: true,
    formatOnType: true,
    // 性能优化选项
    quickSuggestions: false,
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    wordBasedSuggestions: false,
    // 语法检查
    validate: false,
    lint: { enable: false },
    // 无障碍支持
    ariaLabel: 'Code Editor'
  };
}

// 获取只读编辑器配置
export function getReadonlyEditorOptions() {
  return {
    ...getDefaultEditorOptions(),
    readOnly: true,
    fontSize: 12,
    contextmenu: false,
    selectOnLineNumbers: false,
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none'
  };
}

// 检测语言类型
export function detectLanguage(content) {
  if (!content || typeof content !== 'string') return 'text';
  
  const trimmed = content.trim();
  if (!trimmed) return 'text';
  
  try {
    JSON.parse(trimmed);
    return 'json';
  } catch {
    // 继续其他检测
  }
  
  if (trimmed.startsWith('<?xml') || 
      (trimmed.includes('<') && trimmed.includes('>'))) {
    if (trimmed.toLowerCase().includes('<html')) return 'html';
    return 'xml';
  }
  
  return 'text';
}

// 主题适配
export function getThemeForMode(isDark = false) {
  return isDark ? 'vs-dark' : 'vs';
}

// 初始化Monaco Editor配置
export function initializeMonaco() {
  try {
    setupMonacoEnvironment();
    console.log('Monaco Editor environment configured successfully');
  } catch (error) {
    console.error('Failed to configure Monaco Editor environment:', error);
  }
}

// 创建托管的Monaco编辑器
export function createManagedEditor(container, options = {}, editorId = null) {
  return new Promise((resolve, reject) => {
    try {
      // 确保Monaco环境已初始化
      initializeMonaco();
      
      // 生成编辑器ID
      const finalEditorId = editorId || monacoEditorManager.generateId();
      
      // 检查是否已有相同ID的编辑器
      if (monacoEditorManager.has(finalEditorId)) {
        const existingEditor = monacoEditorManager.getEditor(finalEditorId);
        resolve({ editor: existingEditor, editorId: finalEditorId, isNew: false });
        return;
      }
      
      // 动态导入Monaco Editor
      import('monaco-editor').then(monaco => {
        const editor = monaco.editor.create(container, options);
        
        // 注册到资源管理器
        if (monacoEditorManager.register(finalEditorId, editor)) {
          resolve({ editor, editorId: finalEditorId, isNew: true });
        } else {
          // 注册失败，销毁编辑器
          editor.dispose();
          reject(new Error('Failed to register editor with manager'));
        }
      }).catch(reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

// 安全销毁托管的编辑器
export function disposeManagedEditor(editorId) {
  return monacoEditorManager.dispose(editorId);
}

// 获取托管的编辑器
export function getManagedEditor(editorId) {
  return monacoEditorManager.getEditor(editorId);
}

// 检查编辑器是否存在
export function hasManagedEditor(editorId) {
  return monacoEditorManager.has(editorId);
}

// 获取编辑器管理统计
export function getEditorManagerStats() {
  return monacoEditorManager.getStats();
}

// 清理和重置
export function resetMonacoEnvironment() {
  isInitialized = false;
  monacoEditorManager.disposeAll();
  
  if (typeof window !== 'undefined' && window.MonacoEnvironment) {
    delete window.MonacoEnvironment;
  }
  if (typeof self !== 'undefined' && self.MonacoEnvironment) {
    delete self.MonacoEnvironment;
  }
}
