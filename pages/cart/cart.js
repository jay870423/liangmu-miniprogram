const { normalizeProductImages, getCart, updateCartItem, removeCartItem } = require('../../utils/request')

Page({
  data: {
    cartItems: [],
    selectAll: false,
    totalPrice: 0,
    selectedCount: 0,
    loaded: false,
  },

  onShow() {
    this.loadCart()
  },

  async loadCart() {
    try {
      const res = await getCart()
      if (res.code === 0) {
        const items = (res.data.items || []).map(item => ({
          ...normalizeProductImages(item),
          selected: false,
        }))
        this.setData({ cartItems: items, loaded: true })
        this.calcTotal()
      }
    } catch (e) {
      this.setData({ loaded: true })
    }
  },

  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const items = this.data.cartItems.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    )
    this.setData({ cartItems: items })
    this.calcTotal()
  },

  toggleSelectAll() {
    const sel = !this.data.selectAll
    const items = this.data.cartItems.map(item => ({ ...item, selected: sel }))
    this.setData({ cartItems: items, selectAll: sel })
    this.calcTotal()
  },

  async decreaseQty(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.cartItems.find(i => i.id === id)
    if (item && item.quantity > 1) {
      await updateCartItem(id, { quantity: item.quantity - 1 })
      this.loadCart()
    }
  },

  async increaseQty(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.cartItems.find(i => i.id === id)
    if (item) {
      await updateCartItem(id, { quantity: item.quantity + 1 })
      this.loadCart()
    }
  },

  async removeItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除', content: '确定要删除该商品吗？', success: async (res) => {
      if (res.confirm) {
        await removeCartItem(id)
        this.loadCart()
      }
    }})
  },

  calcTotal() {
    let total = 0, count = 0
    this.data.cartItems.forEach(item => {
      if (item.selected) {
        total += item.price * item.quantity
        count++
      }
    })
    const all = this.data.cartItems.length > 0 && this.data.cartItems.every(i => i.selected)
    this.setData({ totalPrice: total, selectedCount: count, selectAll: all })
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/product?id=${e.currentTarget.dataset.id || e.currentTarget.dataset.product_id}` })
  },

  goShopping() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goCheckout() {
    if (this.data.selectedCount === 0) return
    if (!wx.getStorageSync('token')) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能结算购物车商品',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: '/pages/my/my' })
        },
      })
      return
    }
    const selectedItems = this.data.cartItems
      .filter(item => item.selected)
      .map(item => ({
        cart_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal || (Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2),
        sku_spec: item.sku_spec || {},
      }))
    wx.setStorageSync('checkoutItems', selectedItems)
    wx.navigateTo({ url: '/pages/orders/orders?type=create' })
  },
})
