 // api调试消息结构
const apiContent = {
  "method": "GET",
  "url": "http://192.168.201.129:20831/bpce/cm_bpce_process_event_202507",
  "queryParams": [
    {
      "key": "keys",
      "value": "{\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\":\"hour\",\"COUNT(*)\":\"process_count\"}",
      "enabled": true
    },
    {
      "key": "group",
      "value": "{\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\":1}",
      "enabled": true
    },
    {
      "key": "sort",
      "value": "{\"hour\":1}",
      "enabled": true
    }
  ],
  "headers": [
    {
      "key": "Content-Type",
      "value": "application/json",
      "enabled": true
    },
    {
      "key": "Authorization",
      "value": "{{token}}",
      "enabled": true
    }
  ],
  "auth": {
    "type": "none",
    "basic": {
      "username": "",
      "password": ""
    },
    "bearer": {
      "token": ""
    },
    "oauth2": {
      "accessToken": ""
    }
  },
  "body": {
    "type": "raw",
    "raw": "",
    "formData": [
      {
        "key": "",
        "value": "",
        "enabled": true
      }
    ],
    "urlencoded": [
      {
        "key": "",
        "value": "",
        "enabled": true
      }
    ]
  },
  "requestUrl": "http://192.168.201.129:20831/bpce/cm_bpce_process_event_202507?keys=%7B%22DATE_FORMAT(create_time%2C%20'%25Y-%25m-%25d%20%25H%3A00%3A00')%22%3A%22hour%22%2C%22COUNT(*)%22%3A%22process_count%22%7D&group=%7B%22DATE_FORMAT(create_time%2C%20'%25Y-%25m-%25d%20%25H%3A00%3A00')%22%3A1%7D&sort=%7B%22hour%22%3A1%7D",
  "timestamp": 1752741902121,
  "id": "1752741902121",
  "status": 200,
  "statusText": "OK",
  "duration": 262,
  "responseSize": "9.2 KB"
}

// connector调试消息结构
const connectorContent = {
    "id": "DFy1NoEfH_VS7-UzwN1DaCONNECTOR",
    "name": "当前服务调试",
    "desc": "当前服务调试",
    "code": "restClient",
    "creator": "jiangjl@unitechs.com",
    "createTime": "2025-07-17 16:56:55",
    "inParas": [
        {
            "paraType": "IN",
            "paraCode": "method",
            "paraName": "方法",
            "paraNameEn": "",
            "paraValue": "GET",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 0,
            "required": true,
            "visible": true,
            "valueType": "String",
            "paraDesc": "",
            "paraDescEn": "",
            "placeholder": "[GET, POST, DELETE, PATCH...]"
        },
        {
            "paraType": "IN",
            "paraCode": "url",
            "paraName": "请求URL地址",
            "paraNameEn": "",
            "paraValue": "http://192.168.201.129:20831/bpce/cm_bpce_process_event_202507?keys={\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\":\"hour\",\"COUNT(*)\":\"process_count\"}&group={\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\":1}&sort={\"hour\":1}",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 1,
            "required": true,
            "visible": true,
            "valueType": "String",
            "paraDesc": "接口地址，例如：http://127.0.0.1/api/user/2/detail",
            "paraDescEn": "",
            "placeholder": ""
        },
        {
            "paraType": "IN",
            "paraCode": "headers",
            "paraName": "请求头",
            "paraNameEn": "",
            "paraValue": "[\"Authorization:{{token}}\",\"Content-Type:application/json\"]",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 2,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "键值对数组传递，key:value的方式传递,可以有多个header",
            "paraDescEn": "",
            "placeholder": "[\"Authorization:Bearer {{ token }}\",\"zy_token:web_{{ token }}\"]"
        },
        {
            "paraType": "IN",
            "paraCode": "queryParams",
            "paraName": "查询参数",
            "paraNameEn": "",
            "paraValue": "[\"keys={\\\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\\\":\\\"hour\\\",\\\"COUNT(*)\\\":\\\"process_count\\\"}\",\"group={\\\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\\\":1}\",\"sort={\\\"hour\\\":1}\"]",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 3,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "请求的查询参数, 键值对数组传递",
            "paraDescEn": "",
            "placeholder": "[\"page=2\", \"pageSize=10\"]"
        },
        {
            "paraType": "IN",
            "paraCode": "requestContentType",
            "paraName": "请求MIME类型",
            "paraNameEn": "",
            "paraValue": "application/json",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 4,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "请求体的Content-Type",
            "paraDescEn": "",
            "placeholder": "application/json"
        },
        {
            "paraType": "IN",
            "paraCode": "body",
            "paraName": "请求体",
            "paraNameEn": "",
            "paraValue": "{}",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 5,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "请求体",
            "paraDescEn": "",
            "placeholder": ""
        },
        {
            "paraType": "IN",
            "paraCode": "isPassError",
            "paraName": "忽略HTTP响应码",
            "paraNameEn": "",
            "paraValue": "false",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 6,
            "required": false,
            "visible": true,
            "valueType": "Boolean",
            "paraDesc": "HTTP异常不阻塞流程",
            "paraDescEn": "",
            "placeholder": ""
        },
        {
            "paraType": "IN",
            "paraCode": "contentType",
            "paraName": "响应MIME类型",
            "paraNameEn": "",
            "paraValue": "application/json",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 7,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "响应体的Content-Type",
            "paraDescEn": "",
            "placeholder": "application/json"
        },
        {
            "paraType": "IN",
            "paraCode": "isHttpClient",
            "paraName": "启用服务客户端",
            "paraNameEn": "",
            "paraValue": "1",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 8,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "通过服务客户端发起请求：1是0否",
            "paraDescEn": "",
            "placeholder": "0"
        }
    ],
    "outParas": [
        {
            "paraType": "OUT",
            "paraCode": "data",
            "paraName": "输入参数名",
            "paraNameEn": "",
            "paraValue": "data",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 0,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "输入到BPCE的参数名",
            "paraDescEn": "",
            "placeholder": ""
        },
        {
            "paraType": "OUT",
            "paraCode": "response",
            "paraName": "响应体数据",
            "paraNameEn": "",
            "paraValue": "\"<!DOCTYPE html><html lang=\\\"en\\\"><head>\\n  <meta charset=\\\"utf-8\\\">\\n  <title>主页</title>\\n  <base href=\\\"/access-view/\\\">\\n  <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1\\\">\\n  <link rel=\\\"icon\\\" type=\\\"image/x-icon\\\" href=\\\"/favicon.ico\\\">\\n<style>body{margin:0!important}</style><link rel=\\\"stylesheet\\\" href=\\\"/access-view/access_view_static/styles.4d25b845d602f2ed.css\\\" media=\\\"print\\\" onload=\\\"this.media='all'\\\"><noscript><link rel=\\\"stylesheet\\\" href=\\\"/access-view/access_view_static/styles.4d25b845d602f2ed.css\\\"></noscript></head>\\n<body>\\n  <app-root></app-root>\\n<script src=\\\"/access-view/access_view_static/runtime.47e8a5c292f60c3d.js\\\" type=\\\"module\\\"></script><script src=\\\"/access-view/access_view_static/polyfills.e0838306daec8847.js\\\" type=\\\"module\\\"></script><script src=\\\"/access-view/access_view_static/main.a478893865427a9b.js\\\" type=\\\"module\\\"></script>\\n\\n</body></html>\"",
            "formType": "INPUT",
            "classCode": "",
            "className": "",
            "paraIndex": 0,
            "required": false,
            "visible": true,
            "valueType": "String",
            "paraDesc": "响应体数据的变量名",
            "paraDescEn": "",
            "placeholder": ""
        }
    ]
}

// 数据转换工具类
class ApiDataConverter {
  // apiContent 转换为 connectorContent
  static apiToConnector(apiData) {
    if (!apiData || typeof apiData !== 'object') {
      throw new Error('Invalid apiData: must be a non-null object');
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
    let bodyValue = '{}';
    if (apiData.body) {
      if (apiData.body.type === 'raw' && apiData.body.raw) {
        bodyValue = apiData.body.raw;
      } else if (apiData.body.type === 'formData' && Array.isArray(apiData.body.formData)) {
        const formObj = {};
        apiData.body.formData.forEach(item => {
          if (item.enabled && item.key) {
            formObj[item.key] = item.value || '';
          }
        });
        bodyValue = JSON.stringify(formObj);
      } else if (apiData.body.type === 'urlencoded' && Array.isArray(apiData.body.urlencoded)) {
        const urlObj = {};
        apiData.body.urlencoded.forEach(item => {
          if (item.enabled && item.key) {
            urlObj[item.key] = item.value || '';
          }
        });
        bodyValue = JSON.stringify(urlObj);
      }
    }

    return {
      id: connectorId,
      name: "API调试转换",
      desc: "从API调试消息转换而来",
      code: "restClient",
      creator: "system",
      createTime: new Date(timestamp).toLocaleString('zh-CN'),
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
          placeholder: "[GET, POST, DELETE, PATCH...]"
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
          placeholder: ""
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
          placeholder: "[\"Authorization:Bearer {{ token }}\",\"zy_token:web_{{ token }}\"]"
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
          placeholder: "[\"page=2\", \"pageSize=10\"]"
        },
        {
          paraType: "IN",
          paraCode: "requestContentType",
          paraName: "请求MIME类型",
          paraNameEn: "",
          paraValue: this.getContentTypeFromHeaders(apiData.headers) || "application/json",
          formType: "INPUT",
          classCode: "",
          className: "",
          paraIndex: 4,
          required: false,
          visible: true,
          valueType: "String",
          paraDesc: "请求体的Content-Type",
          paraDescEn: "",
          placeholder: "application/json"
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
          placeholder: ""
        }
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
          placeholder: ""
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
          placeholder: ""
        }
      ]
    };
  }

  // connectorContent 转换为 apiContent
  static connectorToApi(connectorData) {
    if (!connectorData || typeof connectorData !== 'object') {
      throw new Error('Invalid connectorData: must be a non-null object');
    }

    const inParas = connectorData.inParas || [];
    const timestamp = Date.now();

    // 从inParas中提取各个参数
    const methodPara = inParas.find(p => p.paraCode === 'method');
    const urlPara = inParas.find(p => p.paraCode === 'url');
    const headersPara = inParas.find(p => p.paraCode === 'headers');
    const queryParamsPara = inParas.find(p => p.paraCode === 'queryParams');
    const bodyPara = inParas.find(p => p.paraCode === 'body');
    const contentTypePara = inParas.find(p => p.paraCode === 'requestContentType');

    // 解析查询参数
    const queryParams = [];
    if (queryParamsPara && queryParamsPara.paraValue) {
      try {
        const queryArray = JSON.parse(queryParamsPara.paraValue);
        if (Array.isArray(queryArray)) {
          queryArray.forEach(item => {
            const [key, value] = item.split('=');
            if (key) {
              queryParams.push({
                key: key.trim(),
                value: value ? decodeURIComponent(value.trim()) : '',
                enabled: true
              });
            }
          });
        }
      } catch (e) {
        console.warn('Failed to parse queryParams:', e.message);
      }
    }

    // 解析请求头
    const headers = [];
    if (headersPara && headersPara.paraValue) {
      try {
        const headersArray = JSON.parse(headersPara.paraValue);
        if (Array.isArray(headersArray)) {
          headersArray.forEach(item => {
            const [key, value] = item.split(':');
            if (key) {
              headers.push({
                key: key.trim(),
                value: value ? value.trim() : '',
                enabled: true
              });
            }
          });
        }
      } catch (e) {
        console.warn('Failed to parse headers:', e.message);
      }
    }

    // 确保Content-Type存在
    const contentType = contentTypePara ? contentTypePara.paraValue : 'application/json';
    if (!headers.some(h => h.key.toLowerCase() === 'content-type')) {
      headers.push({
        key: 'Content-Type',
        value: contentType,
        enabled: true
      });
    }

    // 构建完整URL
    const baseUrl = urlPara ? urlPara.paraValue : '';
    const url = new URL(baseUrl);
    queryParams.forEach(param => {
      if (param.enabled && param.key) {
        url.searchParams.set(param.key, param.value);
      }
    });

    return {
      method: methodPara ? methodPara.paraValue : 'GET',
      url: baseUrl,
      queryParams: queryParams,
      headers: headers,
      auth: {
        type: "none",
        basic: {
          username: "",
          password: ""
        },
        bearer: {
          token: ""
        },
        oauth2: {
          accessToken: ""
        }
      },
      body: {
        type: "raw",
        raw: bodyPara ? bodyPara.paraValue : "",
        formData: [
          {
            key: "",
            value: "",
            enabled: true
          }
        ],
        urlencoded: [
          {
            key: "",
            value: "",
            enabled: true
          }
        ]
      },
      requestUrl: url.toString(),
      timestamp: timestamp,
      id: timestamp.toString(),
      status: 0,
      statusText: "",
      duration: 0,
      responseSize: ""
    };
  }

  // 辅助方法：从headers中获取Content-Type
  static getContentTypeFromHeaders(headers) {
    if (!Array.isArray(headers)) return null;
    
    const contentTypeHeader = headers.find(h => 
      h.enabled && h.key && h.key.toLowerCase() === 'content-type'
    );
    
    return contentTypeHeader ? contentTypeHeader.value : null;
  }

  // 验证apiContent格式
  static validateApiContent(data) {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['method', 'url'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  // 验证connectorContent格式
  static validateConnectorContent(data) {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['id', 'inParas'];
    return requiredFields.every(field => data.hasOwnProperty(field)) &&
           Array.isArray(data.inParas);
  }

  // 性能优化：批量转换
  static batchApiToConnector(apiDataArray) {
    if (!Array.isArray(apiDataArray)) {
      throw new Error('Input must be an array');
    }
    
    return apiDataArray.map((apiData, index) => {
      try {
        return this.apiToConnector(apiData);
      } catch (error) {
        console.error(`Error converting item at index ${index}:`, error.message);
        return null;
      }
    }).filter(Boolean);
  }

  static batchConnectorToApi(connectorDataArray) {
    if (!Array.isArray(connectorDataArray)) {
      throw new Error('Input must be an array');
    }
    
    return connectorDataArray.map((connectorData, index) => {
      try {
        return this.connectorToApi(connectorData);
      } catch (error) {
        console.error(`Error converting item at index ${index}:`, error.message);
        return null;
      }
    }).filter(Boolean);
  }
}

// 导出转换工具类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiDataConverter, apiContent, connectorContent };
} else if (typeof window !== 'undefined') {
  window.ApiDataConverter = ApiDataConverter;
}

