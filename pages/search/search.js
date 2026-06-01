const { searchProducts } = require('../../utils/request')

Page({
  data: {
    keyword: '',
    products: [],
    page: 1,
    hasMore: false,
    loading: false,
    loaded: false,
    history: [],
    hotKeywords: ['黄花梨手串', '沉香线香', '海南黄花梨', '木制摆件', '手把件'],
  },

  onLoad() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({ history })
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  async onSearch() {
    const { keyword } = this.data
    if (!keyword.trim()) return
    const history = this.data.history.filter(h => h !== keyword)
    history.unshift(keyword)
    this.setData({ history: history.slice(0, 10), products: [], page: 1, loaded: false })
    wx.setStorageSync('searchHistory', this.data.history)
    this.doSearch()
  },

  async doSearch() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await searchProducts(this.data.keyword, this.data.page)
      if (res.code === 0) {
        const items = res.data.items || []
        this.setData({
          products: this.data.page === 1 ? items : [...this.data.products, ...items],
          page: this.data.page + 1,
          hasMore: items.length >= 20,
          loaded: true,
        })
      }
    } catch (e) {}
    this.setData({ loading: false })
  },

  onHotTap(e) {
    const kw = e.currentTarget.dataset.kw
    this.setData({ keyword: kw })
    this.onSearch()
  },

  onHistoryTap(e) {
    const kw = e.currentTarget.dataset.kw
    this.setData({ keyword: kw })
    this.onSearch()
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/product?id=${e.currentTarget.dataset.id}` })
  },
})
