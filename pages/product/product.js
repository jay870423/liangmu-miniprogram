const {
  normalizeProductImages,
  getProductDetail,
  addCart,
  addFavorite,
  removeFavorite,
} = require('../../utils/request')

Page({
  data: { product: {}, images: [], selectedSpecIndex: -1, isFavorite: false },

  onLoad(opt) {
    if (opt && opt.id) this.loadProduct(opt.id)
  },

  async loadProduct(id) {
    try {
      const res = await getProductDetail(id)
      if (res.code === 0) {
        const p = normalizeProductImages(res.data)
        this.setData({
          product: {
            ...p,
            images: p.images && p.images.length ? p.images : [p.main_image].filter(Boolean),
          },
          images: p.images && p.images.length ? p.images : [p.main_image].filter(Boolean),
          isFavorite: p.is_favorite,
        })
        wx.setNavigationBarTitle({ title: p.name })
      }
    } catch (e) { wx.showToast({ title: '加载失败', icon: 'none' }) }
  },

  selectSpec(e) {
    this.setData({ selectedSpecIndex: e.currentTarget.dataset.index })
  },

  async toggleFavorite() {
    const { product, isFavorite } = this.data
    try {
      if (isFavorite) {
        await removeFavorite(product.id)
      } else {
        await addFavorite(product.id)
      }
      this.setData({ isFavorite: !isFavorite })
    } catch (e) { wx.showToast({ title: '请先登录', icon: 'none' }) }
  },

  goCart() { wx.switchTab({ url: '/pages/cart/cart' }) },

  onAddCart() {
    const { product, selectedSpecIndex } = this.data
    if (!wx.getStorageSync('token')) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能加入购物车',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: '/pages/my/my' })
        },
      })
      return
    }
    addCart({ product_id: product.id, quantity: 1, sku_spec: { spec_index: selectedSpecIndex } })
      .then(() => wx.showToast({ title: '已加入购物车', icon: 'success' }))
      .catch((err) => wx.showToast({ title: err.message || '加入失败', icon: 'none' }))
  },

  onBuyNow() {
    const { product } = this.data
    wx.navigateTo({ url: `/pages/orders/orders?type=create&product_id=${product.id}` })
  },
})
