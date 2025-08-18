const apiJson = {
  name: "查询用户测试7vi-001",
  method: "GET",
  url: "http://192.168.201.129:20831/bpce/cm_bpce_process_event_202507",
  queryParams: [
    {
      key: "keys",
      value:
        '{"DATE_FORMAT(create_time, \'%Y-%m-%d %H:00:00\')":"hour","COUNT(*)":"process_count"}',
      enabled: true,
    },
    {
      key: "group",
      value: "{\"DATE_FORMAT(create_time, '%Y-%m-%d %H:00:00')\":1}",
      enabled: true,
    },
    {
      key: "sort",
      value: '{"hour":1}',
      enabled: true,
    },
  ],
  headers: [
    {
      key: "Content-Type",
      value: "application/json",
      enabled: true,
    },
    {
      key: "Authorization",
      value: "{{token}}",
      enabled: true,
    },
    {
      key: "",
      value: "",
      enabled: true,
    },
  ],
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
    raw: "",
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
  requestUrl:
    "http://192.168.201.129:20831/bpce/cm_bpce_process_event_202507?keys=%7B%22DATE_FORMAT(create_time%2C%20'%25Y-%25m-%25d%20%25H%3A00%3A00')%22%3A%22hour%22%2C%22COUNT(*)%22%3A%22process_count%22%7D&group=%7B%22DATE_FORMAT(create_time%2C%20'%25Y-%25m-%25d%20%25H%3A00%3A00')%22%3A1%7D&sort=%7B%22hour%22%3A1%7D",
};

console.log(JSON.stringify(apiJson));

http://localhost:3000/dc-post/workspace?name=%E6%9F%A5%E8%AF%A2%E7%94%A8%E6%88%B7%E6%B5%8B%E8%AF%957vi-001&pid=cmUWoVppFurlG6b&suffix=api&id=pD86v_gQGOA-gNulXUm7k&apiText={xxx...xxxx}
