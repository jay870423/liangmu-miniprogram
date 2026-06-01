// 格式化金额
function formatPrice(price) {
  return '¥' + (price / 100).toFixed(2)
}

// 格式化日期
function formatDate(timestamp) {
  const d = new Date(timestamp * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 格式化时间
function formatTime(timestamp) {
  const d = new Date(timestamp * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 显示加载
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

// 隐藏加载
function hideLoading() {
  wx.hideLoading()
}

// 显示成功toast
function showSuccess(title = '成功') {
  wx.showToast({ title, icon: 'success' })
}

// 显示失败toast
function showError(title = '出错了') {
  wx.showToast({ title, icon: 'none' })
}

// 微信登录
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: res => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('获取code失败'))
        }
      },
      fail: reject
    })
  })
}

// 获取用户手机号（需要button open-type="getPhoneNumber"）
function getPhoneNumber(e) {
  return new Promise((resolve, reject) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      resolve(e.detail)
    } else {
      reject(new Error(e.detail.errMsg))
    }
  })
}

// 跳转到商品详情
function goProduct(id) {
  wx.navigateTo({ url: `/pages/product/product?id=${id}` })
}

// 加入购物车成功提示
function addCartSuccess() {
  wx.showToast({ title: '已加入购物车', icon: 'success' })
}

module.exports = {
  formatPrice,
  formatDate,
  formatTime,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  wxLogin,
  getPhoneNumber,
  goProduct,
  addCartSuccess
}
