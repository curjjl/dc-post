import dayjs from 'dayjs';
import { isObject, isEmpty } from 'lodash-es';
import { customAlphabet } from 'nanoid';
const DATE_FORMAT_DEFAULT = 'YYYY-MM-DD HH:mm:ss';

// 获取sessionStorage
export const getSessionData = (item) => {
  try {
    return sessionStorage?.getItem(item) || localStorage?.getItem(item) || null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// 获取当前组织/租户ID，如果没有的话，设置为devplat/default
export const getTenantId = () => {
  try {
    const _tid = sessionStorage?.getItem('TENANT_ID') || localStorage?.getItem('TENANT_ID') || sessionStorage?.getItem('netuserid');

    if (_tid === 'null') {
      return 'default';
    }

    return _tid || 'default';
  } catch (err) {
    console.error(err);
    return 'default';
  }
};

// 获取当前用户ID
export const getUserId = () => {
  try {
    return sessionStorage?.getItem('ID') || localStorage?.getItem('ID') || null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// 获取当前用户所属组ID
export const getTeamId = () => {
  try {
    let teamsStr = sessionStorage?.getItem('TEAMS') || localStorage?.getItem('TEAMS') || null;
    if (teamsStr) {
      return JSON.parse(teamsStr?.replace(/'/g, '"'));
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

// 获取当前用户角色
export const getRolesId = () => {
  try {
    return sessionStorage?.getItem('ROLES') || localStorage?.getItem('ROLES') || null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// 文件流导出blob
export function blobFileDownload(blobData, fileName, _fileType) {
  try {
    if (blobData) {
      let blob = new Blob([blobData], { type: 'application/octet-stream' }); // 转换二进制对象
      if ('download' in document.createElement('a')) {
        // 不是ie浏览器
        let url = window.URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute(
          'download',
          fileName?.replace(new RegExp('"', 'g'), '') // 去除掉文件名称的双引号，避免chrome下载文件之后名称产生下划线
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); // 释放blob对象
      } else {
        window?.navigator?.msSaveBlob(blob, fileName?.replace(new RegExp('"', 'g'), ''));
      }
    } else {
      // console.error('Blob data is not provided');
      throw new Error('Blob data is not provided');
    }
  } catch (err) {
    console.error(err);
  }
}

// 文件内容导出
export function exportFileByContent(fileName, fileExtension, fileContent) {
  try {
    // 创建一个 Blob 对象，将文件内容放入其中
    const blob = new Blob([fileContent], { type: `text/${fileExtension}` });
    // 创建一个下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', `${fileName}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 0);
  } catch (err) {
    console.error(err);
  }
}

// 格式化时间
export const formatDate = (value, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!value) {
    return null;
  }

  if (dayjs(value)?.isValid()) {
    return dayjs(value)?.format(format);
  }
};

// 时间展示
export const getTimeState = () => {
  // 获取当前时间
  let timeNow = new Date();
  // 获取当前小时
  let hours = timeNow.getHours();
  // 设置默认文字
  let text = ``;
  // 判断当前时间段
  if (hours >= 0 && hours <= 10) {
    text = `早上好`;
  } else if (hours > 10 && hours <= 14) {
    text = `中午好`;
  } else if (hours > 14 && hours <= 18) {
    text = `下午好`;
  } else if (hours > 18 && hours <= 24) {
    text = `晚上好`;
  }
  // 返回当前时间段对应的状态
  return text;
};

// 粘贴
export async function pasteImage(imgDOM) {
  try {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read',
    });
    if (permission.state === 'denied') {
      // 没有权限
      throw new Error('Not allowed to read clipboard.');
    }
    const clipboardContents = await navigator?.clipboard?.read();
    for (const item of clipboardContents) {
      if (!item.types.includes('image/png')) {
        throw new Error('Clipboard contains non-image data.');
      }
      const blob = await item.getType('image/png');
      imgDOM.src = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error(error.message);
  }
}

/**
 * 根据指定的t，获取t距离现在过去了多少天
 * @param t     指定的时间
 * @return {any} elapsed 过去的时间
 */
export function getElapsedTime(t) {
  try {
    let now = Date.now();
    let elapsed = now - t;
    let result = '';
    let second = 1000;
    let minute = 60 * second;
    let hours = 60 * minute;
    let day = 24 * hours;
    let months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let nowYear = new Date(now).getFullYear();
    let nowMonth = new Date(now).getMonth();
    //判断是不是闰年
    if ((nowYear % 4 === 0 && nowYear % 100 !== 0) || nowYear % 400 === 0) months[1] = 29;
    let month = Math.abs(new Date(t).getMonth() - nowMonth);
    let year = nowYear - new Date(t).getFullYear();

    if (year !== 0 && month >= 12) result = year + '年';
    else if (month !== 0 && Math.round(elapsed / day) >= months[nowMonth]) return month + '个月';
    else if (parse(day) !== 0) result = parse(day) + '天';
    else if (parse(hours) !== 0) result = parse(hours) + '小时';
    else if (parse(minute) !== 0) result = parse(minute) + '分钟';
    else if (parse(second) !== 0) result = parse(second) + '秒';
    else if (parse(1) !== 0) result = parse(1) + '毫秒';
    else result = '0毫秒';

    // eslint-disable-next-line no-inner-declarations
    function parse(time) {
      return Math.round(elapsed / time);
    }
    return result;
  } catch (error) {
    console.error(error);
  }
}

// 清除对象属性为空
export function clearEmptyProperties(obj) {
  for (const propName in obj) {
    if (isObject(obj[propName])) {
      clearEmptyProperties(obj[propName]);
    }
    if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '' || (isObject(obj[propName]) && isEmpty(obj[propName]))) {
      delete obj[propName];
    }

    // 匹配数组长度不为空，但是值为空的情况，例如：const aaaa = { p1: [null, null] }
    if (Array.isArray(obj[propName]) && obj[propName].length > 0) {
      obj[propName] = obj[propName]?.filter((item) => item !== null && item !== undefined && item !== '');
    }

    // if (Array.isArray(obj[propName]) && obj[propName]?.length > 0 && isEmpty(obj[propName])) {
    //   console.log('匹配数组长度不为空，但是值为空的情况，例如：const')
    //   delete obj[propName];
    // }
  }
  return obj;
}

// 判断字符串格式是否为JSON格式
export function isJson(str) {
  if (typeof str == 'string') {
    try {
      let obj = JSON.parse(str);
      if (typeof obj == 'object' && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log('error：' + str + '!!!' + e);
      return false;
    }
  } else {
    console.log('error：' + str);
    return false;
  }
}

// 判断变量是否为标准合法的JSON数据结构
export function isValidJson(data) {
  try {
    // 如果是字符串，尝试解析为JSON
    if (typeof data === 'string') {
      const parsedData = JSON.parse(data);
      // 确保解析后的数据是对象或数组
      if (typeof parsedData === 'object' && parsedData !== null) {
        return parsedData;
      }
      return false;
    }

    // 如果是对象，检查是否为标准JSON结构
    if (typeof data === 'object' && data !== null) {
      // 尝试序列化再解析，确保是标准JSON结构
      const serialized = JSON.stringify(data);
      const parsed = JSON.parse(serialized);
      // 确保解析后的数据结构与原数据一致
      if (JSON.stringify(parsed) === serialized) {
        return data;
      }
    }

    return false;
  } catch (error) {
    console.error('JSON validation error:', error);
    return false;
  }
}

// 将后台返回的时间戳都加上8个小时
export function addEightHours(date) {
  try {
    // 尝试解析日期，如果失败则返回 null
    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) {
      console.error('Invalid date:', date);
      return null;
    }
    return parsedDate.add(8, 'hour').format(DATE_FORMAT_DEFAULT);
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * 优化后的平面数据转树结构方法
 * @param {Array} data - 原始数据
 * @param {String} idKey - 节点唯一标识字段名
 * @param {String} parentKey - 父节点标识字段名
 * @param {String} childrenKey - 子节点存储字段名
 * @returns {Array} - 树形结构数据
 */
export function buildTreeOptimized(data, idKey = 'ID', parentKey = 'PID', childrenKey = 'children') {
  const idMap = new Map();
  const tree = [];

  // 先初始化所有节点
  data.forEach((item) => {
    idMap.set(item[idKey], { ...item, [childrenKey]: [] });
  });

  // 遍历数据，构建树
  data.forEach((item) => {
    const currentNode = idMap.get(item[idKey]);
    if (item[parentKey] && idMap.has(item[parentKey])) {
      // 如果有父节点，添加到父节点的 children
      idMap.get(item[parentKey])[childrenKey].push(currentNode);
    } else {
      // 如果没有父节点，说明是根节点
      tree.push(currentNode);
    }
  });

  return tree;
}