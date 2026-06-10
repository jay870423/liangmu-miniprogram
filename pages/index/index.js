const {
  normalizeAssetUrl,
  normalizeProductImages,
  formatError,
  getHomeBanners,
  getHomeCategories,
  getHomeNew,
  getHomeRecommend,
  getNotificationUnreadCount,
} = require('../../utils/request')

Page({
  data: {
    banners: [],
    categories: [],
    newProducts: [],
    recommendProducts: [],
    unreadCount: 0,
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadUnreadCount()
  },

  async loadData() {
    await Promise.all([
      this.loadBanners(),
      this.loadCategories(),
      this.loadNewProducts(),
      this.loadRecommendProducts(),
      this.loadUnreadCount(),
    ])
  },

  async loadUnreadCount() {
    if (!wx.getStorageSync('token')) {
      this.setData({ unreadCount: 0 })
      return
    }
    try {
      const res = await getNotificationUnreadCount()
      if (res.code === 0) {
        this.setData({ unreadCount: Number((res.data || {}).count || 0) })
      }
    } catch (e) {
      this.setData({ unreadCount: 0 })
    }
  },

  async onPullDownRefresh() {
    try {
      await this.loadData()
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  async loadBanners() {
    try {
      const res = await getHomeBanners()
      if (res.code === 0) {
        this.setData({
          banners: (res.data.items || []).map(item => ({
            ...item,
            image: normalizeAssetUrl(item.image),
          })),
        })
      }
    } catch (e) {
      console.error('load banners error:', formatError(e), e)
    }
  },

  async loadCategories() {
    try {
      const res = await getHomeCategories()
      if (res.code === 0) {
        this.setData({
          categories: (res.data.items || []).map(item => ({
            ...item,
            iconUrl: normalizeAssetUrl(item.icon_url || item.icon),
          })),
        })
      }
    } catch (e) {
      console.error('load home categories error:', formatError(e), e)
    }
  },

  async loadNewProducts() {
    try {
      const res = await getHomeNew()
      if (res.code === 0) {
        this.setData({ newProducts: (res.data.items || []).map(normalizeProductImages) })
      }
    } catch (e) {
      console.error('load new products error:', formatError(e), e)
    }
  },

  async loadRecommendProducts() {
    try {
      const res = await getHomeRecommend()
      if (res.code === 0) {
        this.setData({ recommendProducts: (res.data.items || []).map(normalizeProductImages) })
      }
    } catch (e) {
      console.error('load recommend products error:', formatError(e), e)
    }
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },
  goMessages() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录后查看消息', icon: 'none' })
      wx.switchTab({ url: '/pages/my/my' })
      return
    }
    wx.navigateTo({ url: '/pages/messages/messages' })
  },
  goCategory(e) {
    const id = e.currentTarget.dataset.id
    wx.setStorageSync('selectedCategoryId', id)
    wx.switchTab({ url: '/pages/category/category' })
  },
  goAllCategory() {
    wx.switchTab({ url: '/pages/category/category' })
  },
  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/product?id=${e.currentTarget.dataset.id}` })
  },
  goNewProducts() {
    wx.navigateTo({ url: '/pages/search/search?type=new' })
  },
  goRecommendProducts() {
    wx.navigateTo({ url: '/pages/search/search?type=recommend' })
  },
  onBannerTap(e) {
    const item = this.data.banners[e.currentTarget.dataset.index]
    if (!item) return
    const type = String(item.link_type || 'none').toLowerCase()
    const value = String(item.link_value || '').trim()
    if (!value || type === 'none') return

    if (type === 'product' || type === 'goods') {
      wx.navigateTo({ url: `/pages/product/product?id=${value}` })
      return
    }

    if (type === 'category') {
      wx.setStorageSync('selectedCategoryId', value)
      wx.switchTab({ url: '/pages/category/category' })
      return
    }

    if (type === 'url' || type === 'link' || type === 'external' || type === 'webview' || type === 'web_view') {
      const url = /^https?:\/\//i.test(value) ? value : `https://${value}`
      wx.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url)}` })
      return
    }

    wx.showToast({ title: '暂不支持该跳转类型', icon: 'none' })
  },
})
