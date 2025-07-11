// 简单的拖拽功能测试
// 这个文件可以在浏览器控制台中运行来测试拖拽功能

export const testDragResize = () => {
  console.log('🧪 开始测试拖拽调整面板宽度功能...')
  
  // 测试1: 检查拖拽手柄是否存在
  const historyHandle = document.querySelector('.resize-handle--left')
  const responseHandle = document.querySelector('.resize-handle--right')
  
  console.log('✅ 左侧拖拽手柄:', historyHandle ? '存在' : '❌ 不存在')
  console.log('✅ 右侧拖拽手柄:', responseHandle ? '存在' : '❌ 不存在')
  
  // 测试2: 检查面板宽度是否可以获取
  const historySider = document.querySelector('.history-sider')
  const responseSider = document.querySelector('.response-sider')
  
  if (historySider) {
    const historyWidth = historySider.style.width || getComputedStyle(historySider).width
    console.log('✅ 左侧面板当前宽度:', historyWidth)
  }
  
  if (responseSider) {
    const responseWidth = responseSider.style.width || getComputedStyle(responseSider).width
    console.log('✅ 右侧面板当前宽度:', responseWidth)
  }
  
  // 测试3: 检查localStorage中的宽度设置
  const savedHistoryWidth = localStorage.getItem('historyPanelWidth')
  const savedResponseWidth = localStorage.getItem('responsePanelWidth')
  
  console.log('✅ 保存的左侧面板宽度:', savedHistoryWidth || '未设置')
  console.log('✅ 保存的右侧面板宽度:', savedResponseWidth || '未设置')
  
  // 测试4: 模拟拖拽事件
  if (historyHandle) {
    console.log('🎯 模拟左侧面板拖拽...')
    
    // 创建模拟事件
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 300,
      bubbles: true
    })
    
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 350,
      bubbles: true
    })
    
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true
    })
    
    // 触发事件序列
    historyHandle.dispatchEvent(mouseDownEvent)
    setTimeout(() => {
      document.dispatchEvent(mouseMoveEvent)
      setTimeout(() => {
        document.dispatchEvent(mouseUpEvent)
        console.log('✅ 左侧面板拖拽模拟完成')
      }, 100)
    }, 50)
  }
  
  // 测试5: 检查CSS类是否正确应用
  const hasResizeHandleStyles = document.querySelector('.resize-handle')
  console.log('✅ 拖拽手柄样式:', hasResizeHandleStyles ? '已应用' : '❌ 未应用')
  
  // 测试6: 检查主题适配
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark'
  console.log('✅ 当前主题:', isDarkTheme ? '深色' : '浅色')
  
  console.log('🎉 拖拽功能测试完成！')
  
  return {
    historyHandle: !!historyHandle,
    responseHandle: !!responseHandle,
    savedHistoryWidth,
    savedResponseWidth,
    hasStyles: !!hasResizeHandleStyles,
    theme: isDarkTheme ? 'dark' : 'light'
  }
}

// 在浏览器控制台中运行测试
if (typeof window !== 'undefined') {
  window.testDragResize = testDragResize
  console.log('💡 在控制台中运行 testDragResize() 来测试拖拽功能')
}
