const { normalizeAssetUrl, getCategories, getCategoryProducts } = require('../../utils/request')

Page({
  data: {
    categories: [],
    currentCateId: '',
    currentCateName: '全部分类',
    products: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
    loading: false,
    loaded: false,
  },

  onLoad(opt) {
    if (opt && opt.id) {
      this.setData({ currentCateId: opt.id })
    }
    this.loadCategories()
  },

  onShow() {
    this.applyPendingCategory()
  },

  async loadCategories() {
    try {
      const res = await getCategories()
      if (res.code === 0) {
        const categories = (res.data.items || []).map(item => ({
          ...item,
          iconUrl: normalizeAssetUrl(item.icon_url || item.icon),
        }))
        this.setData({ categories })
        if (!this.applyPendingCategory() && !this.data.currentCateId && categories.length > 0) {
          this.selectCategory(categories[0].id)
        } else if (this.data.currentCateId) {
          this.selectCategory(this.data.currentCateId)
        }
      }
    } catch (e) { console.error(e) }
  },

  applyPendingCategory() {
    const id = wx.getStorageSync('selectedCategoryId')
    if (!id || this.data.categories.length === 0) return false
    wx.removeStorageSync('selectedCategoryId')
    this.selectCategory(id)
    return true
  },

  selectCategory(id) {
    const cate = this.data.categories.find(c => c.id === id)
    if (!cate) return
    this.setData({
      currentCateId: id,
      currentCateName: cate.name,
      products: [],
      page: 1,
      loaded: false,
    })
    this.loadProducts(true)
  },

  async loadProducts(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await getCategoryProducts(this.data.currentCateId, page, this.data.pageSize)
      if (res.code === 0) {
        const items = res.data.items || []
        this.setData({
          products: reset ? items : [...this.data.products, ...items],
          total: res.data.total || 0,
          page: page + 1,
          hasMore: items.length >= this.data.pageSize,
          loaded: true,
        })
      }
    } catch (e) { console.error(e) }
    this.setData({ loading: false })
  },

  switchCate(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.currentCateId) return
    this.selectCategory(id)
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) this.loadProducts()
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/product?id=${e.currentTarget.dataset.id}` })
  },

  onAddCart(e) {
    wx.showToast({ title: '已添加购物车', icon: 'success' })
  },
})
