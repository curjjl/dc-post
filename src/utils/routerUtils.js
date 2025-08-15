// routerUtils.js - 路由参数更新工具类
import { useRoute, useRouter } from "vue-router";

/**
 * 路由参数更新工具类
 * 提供性能优化和兼容性处理的路由参数操作方法
 */
export class RouterParamsManager {
  constructor() {
    this.route = useRoute();
    this.router = useRouter();

    // 防抖配置 - 避免快速连续点击导致的性能问题
    this.debounceTimers = new Map();
    this.defaultDebounceDelay = 300;
  }

  /**
   * 防抖更新路由参数
   * @param {Object} updates - 要更新的参数对象
   * @param {number} delay - 防抖延迟时间(ms)
   * @param {string} key - 防抖标识key
   */
  debounceUpdateQuery(
    updates,
    delay = this.defaultDebounceDelay,
    key = "default"
  ) {
    // 清除之前的定时器
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      this.updateQuery(updates);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * 更新查询参数 - 基础方法
   * @param {Object} updates - 要更新的参数
   * @param {Object} options - 配置选项
   */
  updateQuery(updates, options = {}) {
    const {
      replace = false, // 是否使用 replace 而不是 push
      encode = true, // 是否编码参数值
      removeEmpty = false, // 是否移除空值参数
      preserveHash = true, // 是否保留 hash
    } = options;

    try {
      // 构建新的查询参数
      let newQuery = { ...this.route.query };

      // 应用更新
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          delete newQuery[key];
        } else if (removeEmpty && (value === "" || value === 0)) {
          delete newQuery[key];
        } else {
          newQuery[key] = encode ? this.safeEncode(value) : value;
        }
      });

      // 构建路由对象
      const routeObj = {
        path: this.route.path,
        query: newQuery,
      };

      // 保留 hash
      if (preserveHash && this.route.hash) {
        routeObj.hash = this.route.hash;
      }

      // 执行路由更新
      if (replace) {
        this.router.replace(routeObj);
      } else {
        this.router.push(routeObj);
      }

      return true;
    } catch (error) {
      console.error("更新路由参数失败:", error);
      return false;
    }
  }

  /**
   * 安全编码参数值
   * @param {any} value - 要编码的值
   */
  safeEncode(value) {
    if (typeof value !== "string") {
      value = String(value);
    }

    try {
      // 避免重复编码
      const decoded = decodeURIComponent(value);
      return encodeURIComponent(decoded);
    } catch {
      // 如果解码失败，直接编码原值
      return encodeURIComponent(value);
    }
  }

  /**
   * 添加单个参数
   * @param {string} key - 参数名
   * @param {any} value - 参数值
   * @param {Object} options - 配置选项
   */
  addParam(key, value, options = {}) {
    return this.updateQuery({ [key]: value }, options);
  }

  /**
   * 移除参数
   * @param {string|Array} keys - 要移除的参数名(数组或字符串)
   * @param {Object} options - 配置选项
   */
  removeParam(keys, options = {}) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const updates = keysArray.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});

    return this.updateQuery(updates, options);
  }

  /**
   * 批量设置参数(会清除现有参数)
   * @param {Object} params - 新的参数对象
   * @param {Object} options - 配置选项
   */
  setParams(params, options = {}) {
    return this.updateQuery(params, { ...options, replace: true });
  }

  /**
   * 重置到指定参数(清除其他所有参数)
   * @param {Object} params - 要保留的参数
   * @param {Object} options - 配置选项
   */
  resetToParams(params, options = {}) {
    try {
      const routeObj = {
        path: this.route.path,
        query: params,
      };

      if (options.preserveHash && this.route.hash) {
        routeObj.hash = this.route.hash;
      }

      this.router.replace(routeObj);
      return true;
    } catch (error) {
      console.error("重置路由参数失败:", error);
      return false;
    }
  }

  /**
   * 切换布尔参数
   * @param {string} key - 参数名
   * @param {Object} options - 配置选项
   */
  toggleBooleanParam(key, options = {}) {
    const currentValue = this.route.query[key];
    const newValue = currentValue === "true" ? "false" : "true";
    return this.addParam(key, newValue, options);
  }

  /**
   * 获取当前查询参数的副本
   * @param {boolean} decode - 是否解码参数值
   */
  getCurrentQuery(decode = false) {
    const query = { ...this.route.query };

    if (decode) {
      Object.keys(query).forEach((key) => {
        if (typeof query[key] === "string") {
          try {
            query[key] = decodeURIComponent(query[key]);
          } catch {
            // 解码失败保持原值
          }
        }
      });
    }

    return query;
  }

  /**
   * 检查参数是否存在
   * @param {string} key - 参数名
   */
  hasParam(key) {
    return (
      key in this.route.query &&
      this.route.query[key] !== null &&
      this.route.query[key] !== undefined
    );
  }

  /**
   * 获取参数值
   * @param {string} key - 参数名
   * @param {any} defaultValue - 默认值
   * @param {boolean} decode - 是否解码
   */
  getParam(key, defaultValue = null, decode = true) {
    const value = this.route.query[key];

    if (value === null || value === undefined) {
      return defaultValue;
    }

    if (decode && typeof value === "string") {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }

    return value;
  }

  /**
   * 构建完整URL
   * @param {Object} query - 查询参数
   * @param {string} path - 路径(可选)
   */
  buildFullUrl(query, path = this.route.path) {
    const url = new URL(window.location.origin + path);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  /**
   * 清理资源
   */
  destroy() {
    // 清除所有防抖定时器
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// 创建组合式函数
export function useRouterParams() {
  return new RouterParamsManager();
}

// 使用示例和最佳实践
export const RouterParamsExamples = {
  // r1 → r2: 添加 id 参数
  addIdParam(routerParams) {
    return routerParams.addParam("id", "testfileid001");
  },

  // r1 → r3: 修改 pname 参数
  updatePnameParam(routerParams) {
    return routerParams.addParam("pname", "JJLtestfor002");
  },

  // 批量更新参数
  batchUpdate(routerParams) {
    return routerParams.updateQuery({
      pname: "JJLtestfor002",
      id: "testfileid001",
      timestamp: Date.now(),
    });
  },

  // 防抖更新(适合搜索框等场景)
  debounceUpdate(routerParams, searchTerm) {
    routerParams.debounceUpdateQuery(
      {
        search: searchTerm,
        page: 1, // 搜索时重置页码
      },
      500,
      "search"
    );
  },

  // 移除空值参数
  cleanUpdate(routerParams, updates) {
    return routerParams.updateQuery(updates, {
      removeEmpty: true,
      encode: true,
    });
  },
};

// Vue 组件中的使用示例
export const componentExample = `
<script setup>
import { useRouterParams } from '@/utils/routerUtils'

const routerParams = useRouterParams()

// 基本更新
const updateParams = () => {
  routerParams.addParam('id', 'testfileid001')
}

// 批量更新
const batchUpdate = () => {
  routerParams.updateQuery({
    pname: 'JJLtestfor002',
    id: 'testfileid001'
  })
}

// 防抖更新(搜索场景)
const onSearch = (value) => {
  routerParams.debounceUpdateQuery({
    q: value,
    page: 1
  }, 300, 'search')
}

// 组件卸载时清理
onUnmounted(() => {
  routerParams.destroy()
})
</script>
`;
