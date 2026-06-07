const { wxLogin, bindUserPhone, getUserInfo, getMyCoupons } = require('../../utils/request')

Page({
  data: {
    userInfo: null,
    couponCount: 0,
    orderTabs: [
      { iconPath: '/assets/order-pay.png', label: '待支付', status: 'pending' },
      { iconPath: '/assets/order-send.png', label: '待发货', status: 'paid' },
      { iconPath: '/assets/order-receive.png', label: '待收货', status: 'shipped' },
      { iconPath: '/assets/order-done.png', label: '已完成', status: 'completed' },
    ],
    orderCounts: { pending: 0, paid: 0, shipped: 0, completed: 0 },
    menuItems: [
      { id: 'favorites', iconPath: '/assets/fav.png', label: '我的收藏', desc: '常看的商品' },
      { id: 'addresses', iconPath: '/assets/addr.png', label: '收货地址', desc: '管理收货人和地址' },
      { id: 'coupons', iconPath: '/assets/coupon.png', label: '优惠券', desc: '可用优惠与领取记录' },
      { id: 'points', iconPath: '/assets/points.png', label: '积分明细', desc: '查看积分变动' },
      { id: 'help', iconPath: '/assets/help.png', label: '帮助中心', desc: '常见问题与服务说明' },
      { id: 'about', iconPath: '/assets/about.png', label: '关于我们', desc: '品牌与联系方式' },
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
        const userInfo = {
          id: userRes.data.user_id,
          nickname: userRes.data.nickname || '微信用户',
          avatar: userRes.data.avatar_url || '/assets/avatar-default.png',
          phone: userRes.data.phone || '',
          points: userRes.data.available_points || 0,
          memberLevel: userRes.data.member_level,
        }
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
      }
      if (couponRes.code === 0) this.setData({ couponCount: couponRes.data.items?.length || 0 })
    } catch (e) {}
  },

  async onLogin() {
    try {
      wx.showLoading({ title: '登录中...', mask: true })
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      if (!loginRes.code) throw new Error('获取登录凭证失败')
      const res = await wxLogin(loginRes.code)
      if (res.code === 0) {
        const userInfo = {
          id: res.data.user_id,
          nickname: res.data.nickname || '微信用户',
          avatar: res.data.avatar_url || '/assets/avatar-default.png',
          phone: res.data.phone || '',
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

  async onGetPhoneNumber(e) {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (e.detail.errMsg !== 'getPhoneNumber:ok' || !e.detail.code) {
      wx.showToast({ title: '已取消授权', icon: 'none' })
      return
    }
    try {
      wx.showLoading({ title: '绑定中...', mask: true })
      const res = await bindUserPhone(e.detail.code)
      if (res.code === 0) {
        this.setData({ 'userInfo.phone': res.data.phone || '' })
        const userInfo = wx.getStorageSync('userInfo') || {}
        userInfo.phone = res.data.phone || ''
        wx.setStorageSync('userInfo', userInfo)
        wx.showToast({ title: '绑定成功', icon: 'success' })
      }
    } catch (err) {
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
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
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({ userInfo: null })
        }
      },
    })
  },
})
