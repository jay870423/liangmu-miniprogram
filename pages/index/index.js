const {
  normalizeAssetUrl,
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
      if (newRes.code === 0) this.setData({ newProducts: newRes.data.items })
      if (recommendRes.code === 0) this.setData({ recommendProducts: recommendRes.data.items })
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
    const item = e.currentTarget.dataset.item
    if (item.link_type === 'product' && item.link_value) {
      wx.navigateTo({ url: `/pages/product/product?id=${item.link_value}` })
    }
  },
})
