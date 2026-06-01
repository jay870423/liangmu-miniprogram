const { getUserInfo, getMyCoupons } = require('../../utils/request')

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
      if (userRes.code === 0) this.setData({ userInfo: userRes.data })
      if (couponRes.code === 0) this.setData({ couponCount: couponRes.data.items?.length || 0 })
    } catch (e) {}
  },

  onLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        userInfo.avatar = userInfo.avatarUrl
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
      }
    })
  },

  goOrderList(e) {
    const status = e.currentTarget.dataset.status
    wx.navigateTo({ url: `/pages/orders/orders?status=${status}` })
  },

  goCoupons() {
    wx.navigateTo({ url: '/pages/orders/orders?type=coupons' })
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id
    const pages = {
      favorites: '/pages/orders/orders?type=favorites',
      addresses: '/pages/orders/orders?type=addresses',
      coupons: '/pages/orders/orders?type=coupons',
      points: '/pages/orders/orders?type=points',
      help: '/pages/orders/orders?type=help',
      about: '/pages/orders/orders?type=about',
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
