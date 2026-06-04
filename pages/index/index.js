const {
  normalizeAssetUrl,
  normalizeProductImages,
  getHomeBanners,
  getHomeCategories,
  getHomeNew,
  getHomeRecommend,
} = require('../../utils/request')

Page({
  data: {
    banners: [],
    categories: [],
    newProducts: [],
    recommendProducts: [],
  },

  onLoad() {
    this.loadData()
  },

  onShow() {},

  async loadData() {
    try {
      const [bannersRes, categoriesRes, newRes, recommendRes] = await Promise.all([
        getHomeBanners(),
        getHomeCategories(),
        getHomeNew(),
        getHomeRecommend(),
      ])
      if (bannersRes.code === 0) {
        this.setData({
          banners: (bannersRes.data.items || []).map(item => ({
            ...item,
            image: normalizeAssetUrl(item.image),
          })),
        })
      }
      if (categoriesRes.code === 0) {
        this.setData({
          categories: (categoriesRes.data.items || []).map(item => ({
            ...item,
            iconUrl: normalizeAssetUrl(item.icon_url || item.icon),
          })),
        })
      }
      if (newRes.code === 0) {
        this.setData({ newProducts: (newRes.data.items || []).map(normalizeProductImages) })
      }
      if (recommendRes.code === 0) {
        this.setData({ recommendProducts: (recommendRes.data.items || []).map(normalizeProductImages) })
      }
    } catch (e) {
      console.error('load data error:', e)
    }
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },
  goMessages() {
    wx.showToast({ title: '暂无消息', icon: 'none' })
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
