const { getCategories, getCategoryProducts } = require('../../utils/request')

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
    this.loadCategories()
    if (opt && opt.id) {
      this.setData({ currentCateId: opt.id })
    }
  },

  async loadCategories() {
    try {
      const res = await getCategories()
      if (res.code === 0) {
        this.setData({ categories: res.data.items })
        if (!this.data.currentCateId && res.data.items.length > 0) {
          this.setData({ currentCateId: res.data.items[0].id, currentCateName: res.data.items[0].name })
          this.loadProducts()
        }
      }
    } catch (e) { console.error(e) }
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
    const cate = this.data.categories.find(c => c.id === id)
    if (id === this.data.currentCateId) return
    this.setData({ currentCateId: id, currentCateName: cate ? cate.name : '', products: [], page: 1, loaded: false })
    this.loadProducts(true)
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
