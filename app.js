App({
  globalData: {
    userInfo: null,
    token: null,
    openid: null,
    baseUrl: 'http://81.70.144.73:5176/api/v1'
  },

  onLaunch() {
    // 检查登录态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  }
})
