const { wxLogin, getUserInfo, getMyCoupons } = require('../../utils/request')

Page({
  data: {
    userInfo: null,
    couponCount: 0,
    orderTabs: [
      { icon: '💰', label: '待支付', status: 0 },
      { icon: '📦', label: '待发货', status: 1 },
      { icon: '🚚', label: '待收货', status: 2 },
      { icon: '✅', label: '已完成', status: 3 },
    ],
    orderCounts: { 0: 0, 1: 0, 2: 0, 3: 0 },
    menuItems: [
      { id: 'favorites', icon: '❤️', label: '我的收藏' },
      { id: 'addresses', icon: '📍', label: '收货地址' },
      { id: 'coupons', icon: '🎫', label: '优惠券' },
      { id: 'points', icon: '💎', label: '积分明细' },
      { id: 'help', icon: '❓', label: '帮助中心' },
      { id: 'about', icon: 'ℹ️', label: '关于我们' },
    ],
  },

  onShow() {
    const token = wx.getStorageSync('token')
    if (token) this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      const [userRes, couponRes] = await Promise.all([getUserInfo(), getMyCoupons()])
      if (userRes.code === 0) {
        this.setData({
          userInfo: {
            id: userRes.data.user_id,
            nickname: userRes.data.nickname || '微信用户',
            avatar: userRes.data.avatar_url || '/assets/avatar-default.png',
            points: userRes.data.available_points || 0,
            memberLevel: userRes.data.member_level,
          },
        })
      }
      if (couponRes.code === 0) this.setData({ couponCount: couponRes.data.items?.length || 0 })
    } catch (e) {}
  },

  async onLogin() {
    try {
      wx.showLoading({ title: '登录中...', mask: true })
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        })
      })
      if (!loginRes.code) throw new Error('获取登录凭证失败')
      const res = await wxLogin(loginRes.code)
      if (res.code === 0) {
        const userInfo = {
          id: res.data.user_id,
          nickname: res.data.nickname || '微信用户',
          avatar: res.data.avatar_url || '/assets/avatar-default.png',
          points: res.data.available_points || 0,
          memberLevel: res.data.member_level,
        }
        wx.setStorageSync('token', res.data.token)
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
        wx.showToast({ title: '登录成功', icon: 'success' })
        this.loadUserInfo()
      }
    } catch (e) {
      wx.showToast({ title: e.message || '登录失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  goOrderList(e) {
    const status = e.currentTarget.dataset.status
    wx.navigateTo({ url: `/pages/orders/orders?status=${status}` })
  },

  goCoupons() {
    wx.navigateTo({ url: '/pages/coupons/coupons' })
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id
    const pages = {
      favorites: '/pages/favorites/favorites',
      addresses: '/pages/addresses/addresses',
      coupons: '/pages/coupons/coupons',
      points: '/pages/points/points',
      help: '/pages/help/help',
      about: '/pages/about/about',
    }
    if (pages[id]) wx.navigateTo({ url: pages[id] })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出', content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({ userInfo: null })
        }
      }
    })
  },
})
