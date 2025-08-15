import { getUserId } from "@/utils/tools";
import dayjs from "dayjs";

// 数据转换工具类
class ApiDataConverter {
  // apiContent 转换为 connectorContent
  static apiToConnector(apiData) {
    if (!apiData || typeof apiData !== "object") {
      throw new Error("Invalid apiData: must be a non-null object");
    }

    const timestamp = Date.now();
    const connectorId = `${timestamp}CONNECTOR`;

    // 构建查询参数字符串数组
    const queryParamsArray = [];
    if (apiData.queryParams && Array.isArray(apiData.queryParams)) {
      for (const param of apiData.queryParams) {
        if (param.enabled && param.key && param.value !== undefined) {
          queryParamsArray.push(`${param.key}=${param.value}`);
        }
      }
    }

    // 构建请求头字符串数组
    const headersArray = [];
    if (apiData.headers && Array.isArray(apiData.headers)) {
      for (const header of apiData.headers) {
        if (header.enabled && header.key && header.value !== undefined) {
          headersArray.push(`${header.key}:${header.value}`);
        }
      }
    }

    // 构建请求体
    let bodyValue = "{}";
    if (apiData.body) {
      if (apiData.body.type === "raw" && apiData.body.raw) {
        bodyValue = apiData.body.raw;
      } else if (
        apiData.body.type === "formData" &&
        Array.isArray(apiData.body.formData)
      ) {
        const formObj = {};
        apiData.body.formData.forEach((item) => {
          if (item.enabled && item.key) {
            formObj[item.key] = item.value || "";
          }
        });
        bodyValue = JSON.stringify(formObj);
      } else if (
        apiData.body.type === "urlencoded" &&
        Array.isArray(apiData.body.urlencoded)
      ) {
        const urlObj = {};
        apiData.body.urlencoded.forEach((item) => {
          if (item.enabled && item.key) {
            urlObj[item.key] = item.value || "";
          }
        });
        bodyValue = JSON.stringify(urlObj);
      }
    }

    const name = apiData.name || apiData.fname || "未知的连接器";
    return {
      id: connectorId,
      name: name,
      desc: `${name}连接器，发起http请求`,
      code: "restClient",
      creator: getUserId(),
      createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      inParas: [
        {
          paraType: "IN",
          paraCode: "method",
          paraName: "方法",
          paraNameEn: "",
          paraValue: apiData.method || "GET",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 0,
          required: true,
          visible: true,
          valueType: "String",
          paraDesc: "",
          paraDescEn: "",
          placeholder: "[GET, POST, DELETE, PATCH...]",
        },
        {
          paraType: "IN",
          paraCode: "url",
          paraName: "请求URL地址",
          paraNameEn: "",
          paraValue: apiData.url || "",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 1,
          required: true,
          visible: true,
          valueType: "String",
          paraDesc: "接口地址，例如：http://127.0.0.1/api/user/2/detail",
          paraDescEn: "",
          placeholder: "",
        },
        {
          paraType: "IN",
          paraCode: "headers",
          paraName: "请求头",
          paraNameEn: "",
          paraValue: JSON.stringify(headersArray),
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 2,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "键值对数组传递，key:value的方式传递,可以有多个header",
          paraDescEn: "",
          placeholder:
            '["Authorization:Bearer {{ token }}","zy_token:web_{{ token }}"]',
        },
        {
          paraType: "IN",
          paraCode: "queryParams",
          paraName: "查询参数",
          paraNameEn: "",
          paraValue: JSON.stringify(queryParamsArray),
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 3,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "请求的查询参数, 键值对数组传递",
          paraDescEn: "",
          placeholder: '["page=2", "pageSize=10"]',
        },
        {
          paraType: "IN",
          paraCode: "requestContentType",
          paraName: "请求MIME类型",
          paraNameEn: "",
          paraValue:
            this.getContentTypeFromHeaders(apiData.headers) ||
            "application/json",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 4,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "请求体的Content-Type",
          paraDescEn: "",
          placeholder: "application/json",
        },
        {
          paraType: "IN",
          paraCode: "body",
          paraName: "请求体",
          paraNameEn: "",
          paraValue: bodyValue,
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 5,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "请求体",
          paraDescEn: "",
          placeholder: "",
        },
        {
          paraType: "IN",
          paraCode: "isPassError",
          paraName: "忽略HTTP响应码",
          paraNameEn: "",
          paraValue: "false",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 6,
          required: false,
          visible: true,
          valueType: "Boolean",
          paraDesc: "HTTP异常不阻塞流程",
          paraDescEn: "",
          placeholder: "",
        },
        {
          paraType: "IN",
          paraCode: "contentType",
          paraName: "响应MIME类型",
          paraNameEn: "",
          paraValue: "application/json",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 7,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "响应体的Content-Type",
          paraDescEn: "",
          placeholder: "application/json",
        },
        {
          paraType: "IN",
          paraCode: "isHttpClient",
          paraName: "通过IP和端口访问",
          paraNameEn: "",
          paraValue: "1",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 8,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "通过服务客户端发起请求：1是0否",
          paraDescEn: "",
          placeholder: "0",
        },
      ],
      outParas: [
        {
          paraType: "OUT",
          paraCode: "data",
          paraName: "输入参数名",
          paraNameEn: "",
          paraValue: "data",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 0,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "输入到BPCE的参数名",
          paraDescEn: "",
          placeholder: "",
        },
        {
          paraType: "OUT",
          paraCode: "response",
          paraName: "响应体数据",
          paraNameEn: "",
          paraValue: "",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 0,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "响应体数据的变量名",
          paraDescEn: "",
          placeholder: "",
        },
      ],
    };
  }

  // connectorContent 转换为 apiContent
  static connectorToApi(connectorData, create_date) {
    if (!connectorData || typeof connectorData !== "object") {
      throw new Error("Invalid connectorData: must be a non-null object");
    }

    const inParas = connectorData.inParas || [];
    const timestamp = create_date
      ? new Date(create_date).getTime()
      : Date.now();

    // 从inParas中提取各个参数
    const methodPara = inParas.find((p) => p.paraCode === "method");
    const urlPara = inParas.find((p) => p.paraCode === "url");
    const headersPara = inParas.find((p) => p.paraCode === "headers");
    const queryParamsPara = inParas.find((p) => p.paraCode === "queryParams");
    const bodyPara = inParas.find((p) => p.paraCode === "body");
    const contentTypePara = inParas.find(
      (p) => p.paraCode === "requestContentType"
    );

    // 解析查询参数（使用安全解析）
    const queryParams = [];
    if (queryParamsPara?.paraValue) {
      const queryArray = this.safeJsonParse(queryParamsPara.paraValue, []);
      queryArray.forEach((item) => {
        if (typeof item === "string") {
          const eqIndex = item.indexOf("=");
          if (eqIndex > 0) {
            const key = item.substring(0, eqIndex).trim();
            const value = item.substring(eqIndex + 1);
            if (key) {
              try {
                queryParams.push({
                  key,
                  value: value ? decodeURIComponent(value.trim()) : "",
                  enabled: true,
                });
              } catch (e) {
                // 解码失败时使用原始值
                queryParams.push({
                  key,
                  value: value ? value.trim() : "",
                  enabled: true,
                });
              }
            }
          }
        }
      });
    }

    // 解析请求头（使用安全解析）
    const headers = [];
    if (headersPara?.paraValue) {
      const headersArray = this.safeJsonParse(headersPara.paraValue, []);
      headersArray.forEach((item) => {
        if (typeof item === "string") {
          const colonIndex = item.indexOf(":");
          if (colonIndex > 0) {
            const key = item.substring(0, colonIndex).trim();
            const value = item.substring(colonIndex + 1).trim();
            if (key) {
              headers.push({
                key,
                value,
                enabled: true,
              });
            }
          }
        }
      });
    }

    // 确保Content-Type存在
    const contentType = contentTypePara?.paraValue || "application/json";
    if (!headers.some((h) => h.key.toLowerCase() === "content-type")) {
      headers.push({
        key: "Content-Type",
        value: contentType,
        enabled: true,
      });
    }

    // 构建完整URL（使用优化的辅助方法）
    const baseUrl = urlPara?.paraValue || "";
    const requestUrl = this.buildRequestUrl(baseUrl, queryParams);

    return {
      method: methodPara ? methodPara.paraValue : "GET",
      url: baseUrl,
      queryParams: queryParams,
      headers: headers,
      auth: {
        type: "none",
        basic: {
          username: "",
          password: "",
        },
        bearer: {
          token: "",
        },
        oauth2: {
          accessToken: "",
        },
      },
      body: {
        type: "raw",
        raw: bodyPara ? bodyPara.paraValue : "",
        formData: [
          {
            key: "",
            value: "",
            enabled: true,
          },
        ],
        urlencoded: [
          {
            key: "",
            value: "",
            enabled: true,
          },
        ],
      },
      requestUrl: requestUrl,
      timestamp: timestamp,
      id: timestamp.toString(),
      status: 0,
      statusText: "",
      duration: 0,
      responseSize: "",
    };
  }

  // 辅助方法：从headers中获取Content-Type
  static getContentTypeFromHeaders(headers) {
    if (!Array.isArray(headers)) return null;

    const contentTypeHeader = headers.find(
      (h) => h.enabled && h.key && h.key.toLowerCase() === "content-type"
    );

    return contentTypeHeader ? contentTypeHeader.value : null;
  }

  // 辅助方法：安全地构建查询字符串
  static buildQueryString(queryParams) {
    if (!Array.isArray(queryParams) || queryParams.length === 0) {
      return "";
    }

    return queryParams
      .filter((param) => param.enabled && param.key)
      .map((param) => {
        const key = encodeURIComponent(param.key);
        const value = encodeURIComponent(param.value || "");
        return `${key}=${value}`;
      })
      .join("&");
  }

  // 辅助方法：检查URL是否包含环境变量
  static hasEnvironmentVariables(url) {
    if (!url || typeof url !== "string") return false;
    return /\{\{[^}]+\}\}/.test(url);
  }

  // 辅助方法：安全地解析JSON
  static safeJsonParse(jsonString, fallback = []) {
    if (!jsonString || typeof jsonString !== "string") {
      return fallback;
    }

    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.warn("JSON parse failed:", error.message);
      return fallback;
    }
  }

  // 辅助方法：构建完整URL（性能优化版本）
  static buildRequestUrl(baseUrl, queryParams) {
    if (!baseUrl) return "";

    const hasVars = this.hasEnvironmentVariables(baseUrl);
    const queryString = this.buildQueryString(queryParams);

    if (!queryString) return baseUrl;

    if (hasVars) {
      // 包含环境变量，使用字符串拼接
      return baseUrl.includes("?")
        ? `${baseUrl}&${queryString}`
        : `${baseUrl}?${queryString}`;
    }

    // 不包含环境变量，尝试使用URL对象
    try {
      const url = new URL(baseUrl);
      queryParams
        .filter((param) => param.enabled && param.key)
        .forEach((param) => {
          url.searchParams.set(param.key, param.value || "");
        });
      return url.toString();
    } catch (error) {
      // 回退到字符串拼接
      console.warn(
        "URL construction failed, using fallback method:",
        error.message
      );
      return baseUrl.includes("?")
        ? `${baseUrl}&${queryString}`
        : `${baseUrl}?${queryString}`;
    }
  }

  // 验证apiContent格式
  static validateApiContent(data) {
    if (!data || typeof data !== "object") return false;

    const requiredFields = ["method", "url"];
    return requiredFields.every((field) => data.hasOwnProperty(field));
  }

  // 验证connectorContent格式
  static validateConnectorContent(data) {
    if (!data || typeof data !== "object") return false;

    const requiredFields = ["id", "inParas"];
    return (
      requiredFields.every((field) => data.hasOwnProperty(field)) &&
      Array.isArray(data.inParas)
    );
  }

  // 性能优化：批量转换（增强错误处理和统计）
  static batchApiToConnector(apiDataArray) {
    if (!Array.isArray(apiDataArray)) {
      throw new Error("Input must be an array");
    }

    const results = [];
    const errors = [];
    const startTime = performance.now();

    apiDataArray.forEach((apiData, index) => {
      try {
        if (this.validateApiContent(apiData)) {
          results.push(this.apiToConnector(apiData));
        } else {
          const error = `Invalid API content format at index ${index}`;
          console.warn(error);
          errors.push({ index, error, data: apiData });
        }
      } catch (error) {
        console.error(
          `Error converting item at index ${index}:`,
          error.message
        );
        errors.push({ index, error: error.message, data: apiData });
      }
    });

    const duration = performance.now() - startTime;

    if (errors.length > 0) {
      console.warn(
        `Batch conversion completed with ${
          errors.length
        } errors in ${duration.toFixed(2)}ms`
      );
    }

    return {
      results,
      errors,
      summary: {
        total: apiDataArray.length,
        successful: results.length,
        failed: errors.length,
        duration: Math.round(duration),
      },
    };
  }

  static batchConnectorToApi(connectorDataArray) {
    if (!Array.isArray(connectorDataArray)) {
      throw new Error("Input must be an array");
    }

    const results = [];
    const errors = [];
    const startTime = performance.now();

    connectorDataArray.forEach((connectorData, index) => {
      try {
        if (this.validateConnectorContent(connectorData)) {
          results.push(this.connectorToApi(connectorData));
        } else {
          const error = `Invalid connector content format at index ${index}`;
          console.warn(error);
          errors.push({ index, error, data: connectorData });
        }
      } catch (error) {
        console.error(
          `Error converting item at index ${index}:`,
          error.message
        );
        errors.push({ index, error: error.message, data: connectorData });
      }
    });

    const duration = performance.now() - startTime;

    if (errors.length > 0) {
      console.warn(
        `Batch conversion completed with ${
          errors.length
        } errors in ${duration.toFixed(2)}ms`
      );
    }

    return {
      results,
      errors,
      summary: {
        total: connectorDataArray.length,
        successful: results.length,
        failed: errors.length,
        duration: Math.round(duration),
      },
    };
  }

  // 向后兼容的简化批量转换方法
  static batchApiToConnectorSimple(apiDataArray) {
    const result = this.batchApiToConnector(apiDataArray);
    return result.results;
  }

  static batchConnectorToApiSimple(connectorDataArray) {
    const result = this.batchConnectorToApi(connectorDataArray);
    return result.results;
  }
}

// 导出转换工具类
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = { ApiDataConverter, apiContent, connectorContent };
// } else if (typeof window !== 'undefined') {
//   window.ApiDataConverter = ApiDataConverter;
// }

export default ApiDataConverter;
