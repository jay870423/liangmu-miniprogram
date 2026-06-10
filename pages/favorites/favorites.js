const { normalizeProductImages, getFavorites, removeFavorite } = require('../../utils/request')

function formatPrice(value) {
  const num = Number(value || 0)
  return num.toFixed(2)
}

Page({
  data: {
    items: [],
    page: 1,
    hasMore: false,
    loaded: false,
    loading: false,
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.loadData(true)
  },

  async onPullDownRefresh() {
    try {
      if (wx.getStorageSync('token')) await this.loadData(true)
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  async loadData(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await getFavorites(page)
      if (res.code === 0) {
        const rows = (res.data.items || []).map(item => ({
          ...normalizeProductImages(item),
          priceText: formatPrice(item.price),
        }))
        this.setData({
          items: reset ? rows : [...this.data.items, ...rows],
          page: page + 1,
          hasMore: rows.length >= 20,
          loaded: true,
        })
      }
    } catch (e) {
      this.setData({ loaded: true })
    }
    this.setData({ loading: false })
  },

  loadMore() {
    if (this.data.hasMore) this.loadData()
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/product?id=${e.currentTarget.dataset.id}` })
  },

  removeItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏该商品吗？',
      success: async (res) => {
        if (!res.confirm) return
        await removeFavorite(id)
        wx.showToast({ title: '已取消', icon: 'success' })
        this.loadData(true)
      },
    })
  },
})
