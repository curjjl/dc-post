/**
 * 主题配置管理系统
 * 基于 Ant Design Vue 4 的 Design Token 系统
 */

import { theme } from 'ant-design-vue'

// 预设主题配置
export const PRESET_THEMES = {
  // 默认浅色主题
  light: {
    name: '默认浅色',
    key: 'light',
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1677ff',
      colorBgBase: '#ffffff',
      colorTextBase: '#000000',
      borderRadius: 6,
      wireframe: false,
    },
    customCss: {
      '--app-bg-color': '#f5f5f5',
      '--app-sidebar-bg': '#ffffff',
      '--app-header-bg': '#ffffff',
      '--app-border-color': '#d9d9d9',
      '--app-text-primary': '#262626',
      '--app-text-secondary': '#8c8c8c',
      '--app-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)',
    }
  },

  // 默认深色主题
  dark: {
    name: '默认深色',
    key: 'dark',
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#177ddc',
      colorSuccess: '#49aa19',
      colorWarning: '#d89614',
      colorError: '#dc4446',
      colorInfo: '#177ddc',
      colorBgBase: '#000000',
      colorTextBase: '#ffffff',
      borderRadius: 6,
      wireframe: false,
    },
    customCss: {
      '--app-bg-color': '#000000',
      '--app-sidebar-bg': '#141414',
      '--app-header-bg': '#141414',
      '--app-border-color': '#434343',
      '--app-text-primary': '#ffffff',
      '--app-text-secondary': '#a6a6a6',
      '--app-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)',
    }
  },

  // // 紧凑主题
  // compact: {
  //   name: '紧凑模式',
  //   key: 'compact',
  //   algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm],
  //   token: {
  //     colorPrimary: '#1677ff',
  //     colorSuccess: '#52c41a',
  //     colorWarning: '#faad14',
  //     colorError: '#ff4d4f',
  //     colorInfo: '#1677ff',
  //     colorBgBase: '#ffffff',
  //     colorTextBase: '#000000',
  //     borderRadius: 4,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#f5f5f5',
  //     '--app-sidebar-bg': '#ffffff',
  //     '--app-header-bg': '#ffffff',
  //     '--app-border-color': '#d9d9d9',
  //     '--app-text-primary': '#262626',
  //     '--app-text-secondary': '#8c8c8c',
  //     '--app-shadow': '0 1px 4px rgba(0, 0, 0, 0.1)',
  //   }
  // },

  // // 蓝色主题
  // blue: {
  //   name: '蓝色科技',
  //   key: 'blue',
  //   algorithm: theme.defaultAlgorithm,
  //   token: {
  //     colorPrimary: '#2f54eb',
  //     colorSuccess: '#52c41a',
  //     colorWarning: '#faad14',
  //     colorError: '#ff4d4f',
  //     colorInfo: '#2f54eb',
  //     colorBgBase: '#f0f5ff',
  //     colorTextBase: '#001d66',
  //     borderRadius: 8,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#e6f4ff',
  //     '--app-sidebar-bg': '#f0f5ff',
  //     '--app-header-bg': '#f0f5ff',
  //     '--app-border-color': '#adc6ff',
  //     '--app-text-primary': '#001d66',
  //     '--app-text-secondary': '#597ef7',
  //     '--app-shadow': '0 2px 8px rgba(47, 84, 235, 0.1)',
  //   }
  // },

  // // 绿色主题
  // green: {
  //   name: '自然绿色',
  //   key: 'green',
  //   algorithm: theme.defaultAlgorithm,
  //   token: {
  //     colorPrimary: '#52c41a',
  //     colorSuccess: '#389e0d',
  //     colorWarning: '#faad14',
  //     colorError: '#ff4d4f',
  //     colorInfo: '#52c41a',
  //     colorBgBase: '#f6ffed',
  //     colorTextBase: '#092b00',
  //     borderRadius: 6,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#f6ffed',
  //     '--app-sidebar-bg': '#f6ffed',
  //     '--app-header-bg': '#f6ffed',
  //     '--app-border-color': '#b7eb8f',
  //     '--app-text-primary': '#092b00',
  //     '--app-text-secondary': '#52c41a',
  //     '--app-shadow': '0 2px 8px rgba(82, 196, 26, 0.1)',
  //   }
  // },

  // // 红色主题
  // red: {
  //   name: '热情红色',
  //   key: 'red',
  //   algorithm: theme.defaultAlgorithm,
  //   token: {
  //     colorPrimary: '#f5222d',
  //     colorSuccess: '#52c41a',
  //     colorWarning: '#faad14',
  //     colorError: '#cf1322',
  //     colorInfo: '#f5222d',
  //     colorBgBase: '#fff2f0',
  //     colorTextBase: '#5c0011',
  //     borderRadius: 6,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#fff1f0',
  //     '--app-sidebar-bg': '#fff2f0',
  //     '--app-header-bg': '#fff2f0',
  //     '--app-border-color': '#ffadd2',
  //     '--app-text-primary': '#5c0011',
  //     '--app-text-secondary': '#f5222d',
  //     '--app-shadow': '0 2px 8px rgba(245, 34, 45, 0.1)',
  //   }
  // },

  // // 紫色主题
  // purple: {
  //   name: '优雅紫色',
  //   key: 'purple',
  //   algorithm: theme.defaultAlgorithm,
  //   token: {
  //     colorPrimary: '#722ed1',
  //     colorSuccess: '#52c41a',
  //     colorWarning: '#faad14',
  //     colorError: '#ff4d4f',
  //     colorInfo: '#722ed1',
  //     colorBgBase: '#f9f0ff',
  //     colorTextBase: '#22075e',
  //     borderRadius: 6,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#f9f0ff',
  //     '--app-sidebar-bg': '#f9f0ff',
  //     '--app-header-bg': '#f9f0ff',
  //     '--app-border-color': '#d3adf7',
  //     '--app-text-primary': '#22075e',
  //     '--app-text-secondary': '#722ed1',
  //     '--app-shadow': '0 2px 8px rgba(114, 46, 209, 0.1)',
  //   }
  // },

  // // 橙色主题
  // orange: {
  //   name: '活力橙色',
  //   key: 'orange',
  //   algorithm: theme.defaultAlgorithm,
  //   token: {
  //     colorPrimary: '#fa8c16',
  //     colorSuccess: '#52c41a',
  //     colorWarning: '#d48806',
  //     colorError: '#ff4d4f',
  //     colorInfo: '#fa8c16',
  //     colorBgBase: '#fff7e6',
  //     colorTextBase: '#612500',
  //     borderRadius: 6,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#fff7e6',
  //     '--app-sidebar-bg': '#fff7e6',
  //     '--app-header-bg': '#fff7e6',
  //     '--app-border-color': '#ffcc02',
  //     '--app-text-primary': '#612500',
  //     '--app-text-secondary': '#fa8c16',
  //     '--app-shadow': '0 2px 8px rgba(250, 140, 22, 0.1)',
  //   }
  // },

  // // 深色紧凑主题
  // darkCompact: {
  //   name: '深色紧凑',
  //   key: 'darkCompact',
  //   algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
  //   token: {
  //     colorPrimary: '#177ddc',
  //     colorSuccess: '#49aa19',
  //     colorWarning: '#d89614',
  //     colorError: '#dc4446',
  //     colorInfo: '#177ddc',
  //     colorBgBase: '#000000',
  //     colorTextBase: '#ffffff',
  //     borderRadius: 4,
  //     wireframe: false,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#000000',
  //     '--app-sidebar-bg': '#141414',
  //     '--app-header-bg': '#141414',
  //     '--app-border-color': '#434343',
  //     '--app-text-primary': '#ffffff',
  //     '--app-text-secondary': '#a6a6a6',
  //     '--app-shadow': '0 1px 4px rgba(0, 0, 0, 0.3)',
  //   }
  // },

  // // 高对比度主题
  // highContrast: {
  //   name: '高对比度',
  //   key: 'highContrast',
  //   algorithm: theme.defaultAlgorithm,
  //   token: {
  //     colorPrimary: '#0050b3',
  //     colorSuccess: '#237804',
  //     colorWarning: '#ad4e00',
  //     colorError: '#a8071a',
  //     colorInfo: '#0050b3',
  //     colorBgBase: '#ffffff',
  //     colorTextBase: '#000000',
  //     borderRadius: 2,
  //     wireframe: true,
  //   },
  //   customCss: {
  //     '--app-bg-color': '#ffffff',
  //     '--app-sidebar-bg': '#ffffff',
  //     '--app-header-bg': '#ffffff',
  //     '--app-border-color': '#000000',
  //     '--app-text-primary': '#000000',
  //     '--app-text-secondary': '#434343',
  //     '--app-shadow': '0 2px 8px rgba(0, 0, 0, 0.2)',
  //   }
  // }
}

// 主题管理类
export class ThemeManager {
  constructor() {
    this.currentTheme = 'light'
    this.customThemes = new Map()
    this.subscribers = new Set()
    
    this.loadFromStorage()
  }

  // 获取当前主题配置
  getCurrentTheme() {
    return this.getTheme(this.currentTheme)
  }

  // 获取指定主题配置
  getTheme(themeKey) {
    return PRESET_THEMES[themeKey] || this.customThemes.get(themeKey) || PRESET_THEMES.light
  }

  // 切换主题
  setTheme(themeKey) {
    if (this.getTheme(themeKey)) {
      this.currentTheme = themeKey
      this.saveToStorage()
      this.notifySubscribers()
      this.applyCssVariables()
      return true
    }
    return false
  }

  // 应用CSS变量
  applyCssVariables() {
    const theme = this.getCurrentTheme()
    const root = document.documentElement
    
    // 应用自定义CSS变量
    Object.entries(theme.customCss).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // 设置body的data-theme属性
    document.body.setAttribute('data-theme', theme.key.includes('dark') ? 'dark' : 'light')
  }

  // 添加自定义主题
  addCustomTheme(themeKey, themeConfig) {
    this.customThemes.set(themeKey, {
      ...themeConfig,
      key: themeKey,
      custom: true
    })
    this.saveToStorage()
  }

  // 删除自定义主题
  removeCustomTheme(themeKey) {
    if (this.customThemes.has(themeKey)) {
      this.customThemes.delete(themeKey)
      if (this.currentTheme === themeKey) {
        this.setTheme('light')
      }
      this.saveToStorage()
      return true
    }
    return false
  }

  // 获取所有主题列表
  getAllThemes() {
    const themes = { ...PRESET_THEMES }
    this.customThemes.forEach((theme, key) => {
      themes[key] = theme
    })
    return themes
  }

  // 订阅主题变化
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // 通知订阅者
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.getCurrentTheme()))
  }

  // 保存到本地存储
  saveToStorage() {
    try {
      const data = {
        currentTheme: this.currentTheme,
        customThemes: Array.from(this.customThemes.entries())
      }
      localStorage.setItem('vue-api-tester-theme', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  // 从本地存储加载
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('vue-api-tester-theme')
      if (saved) {
        const data = JSON.parse(saved)
        this.currentTheme = data.currentTheme || 'light'
        if (data.customThemes) {
          this.customThemes = new Map(data.customThemes)
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
      this.currentTheme = 'light'
    }
  }

  // 导出主题配置
  exportTheme(themeKey) {
    const theme = this.getTheme(themeKey)
    if (theme) {
      return JSON.stringify(theme, null, 2)
    }
    return null
  }

  // 导入主题配置
  importTheme(themeConfig) {
    try {
      const theme = typeof themeConfig === 'string' ? JSON.parse(themeConfig) : themeConfig
      if (theme.key && theme.name) {
        this.addCustomTheme(theme.key, theme)
        return true
      }
    } catch (error) {
      console.error('Failed to import theme:', error)
    }
    return false
  }

  // 重置所有主题
  reset() {
    this.currentTheme = 'light'
    this.customThemes.clear()
    localStorage.removeItem('vue-api-tester-theme')
    this.notifySubscribers()
    this.applyCssVariables()
  }
}

// 创建全局主题管理器实例
export const themeManager = new ThemeManager()

// 主题工具函数
export const themeUtils = {
  // 获取主题颜色
  getThemeColor(colorKey, themeKey = null) {
    const theme = themeKey ? themeManager.getTheme(themeKey) : themeManager.getCurrentTheme()
    return theme.token[colorKey]
  },

  // 检查是否为深色主题
  isDarkTheme(themeKey = null) {
    const theme = themeKey ? themeManager.getTheme(themeKey) : themeManager.getCurrentTheme()
    return theme.key.includes('dark') || theme.algorithm === theme.darkAlgorithm || 
           (Array.isArray(theme.algorithm) && theme.algorithm.includes(theme.darkAlgorithm))
  },

  // 生成主题颜色调色板
  generateColorPalette(baseColor) {
    // 这里可以实现颜色生成算法
    // 暂时返回基础实现
    return {
      1: baseColor + '1a',
      2: baseColor + '33', 
      3: baseColor + '4d',
      4: baseColor + '66',
      5: baseColor + '80',
      6: baseColor,
      7: baseColor + 'b3',
      8: baseColor + 'cc',
      9: baseColor + 'e6',
      10: baseColor + 'f2'
    }
  }
}

export default themeManager