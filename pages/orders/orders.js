const {
  normalizeProductImages,
  getOrders,
  getAddresses,
  getProductDetail,
  createOrder,
  payOrder,
  cancelOrder,
  confirmReceive,
  removeCartItem,
} = require('../../utils/request')

function money(value) {
  const num = Number(value || 0)
  return num.toFixed(2)
}

function buildFullAddress(address = {}) {
  return `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail_address || ''}`
}

Page({
  data: {
    tabs: [
      { label: '全部', value: '' },
      { label: '待支付', value: 'pending' },
      { label: '待发货', value: 'paid' },
      { label: '待收货', value: 'shipped' },
      { label: '已完成', value: 'completed' },
    ],
    currentTab: '',
    orders: [],
    page: 1,
    hasMore: false,
    loading: false,
    loaded: false,
    creating: false,
    checkoutMode: false,
    checkoutItems: [],
    addresses: [],
    selectedAddress: null,
    checkoutSummary: {
      total_amount: '0.00',
      freight_amount: '0.00',
      pay_amount: '0.00',
    },
    statusText: {
      pending: '待支付',
      paid: '待发货',
      shipped: '待收货',
      delivered: '待收货',
      received: '待评价',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
    },
    statusClass: {
      pending: 'pending',
      paid: 'paid',
      shipped: 'shipped',
      delivered: 'shipped',
      received: 'shipped',
      completed: 'done',
      cancelled: 'cancelled',
      refunded: 'cancelled',
    },
  },

  onLoad(opt = {}) {
    if (opt.status !== undefined) {
      this.setData({ currentTab: String(opt.status) })
    }
    if (opt.type === 'create') {
      this.setData({ checkoutMode: true, loaded: true })
      this.initCheckout(opt)
      return
    }
    this.loadOrders(true)
  },

  onShow() {
    if (this.data.checkoutMode && wx.getStorageSync('token')) {
      this.loadAddresses()
    }
  },

  async initCheckout(opt = {}) {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.switchTab({ url: '/pages/my/my' })
      return
    }
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      let items = []
      if (opt.product_id) {
        const productRes = await getProductDetail(opt.product_id)
        if (productRes.code !== 0) throw new Error(productRes.message || '商品加载失败')
        const product = normalizeProductImages(productRes.data)
        const quantity = Number(opt.quantity || 1)
        items = [{
          product_id: product.id,
          product_name: product.name,
          product_image: product.main_image || product.image || (product.images || [])[0] || '',
          price: product.price,
          shipping_fee: product.shipping_fee,
          quantity,
          subtotal: money(Number(product.price || 0) * quantity),
          sku_spec: opt.sku_spec ? JSON.parse(decodeURIComponent(opt.sku_spec)) : {},
        }]
      } else {
        items = wx.getStorageSync('checkoutItems') || []
      }
      if (!items.length) throw new Error('请选择要结算的商品')
      const normalizedItems = await this.normalizeCheckoutItems(items)
      this.setData({ checkoutItems: normalizedItems })
      this.calcCheckoutSummary(normalizedItems)
      await this.loadAddresses()
    } catch (err) {
      wx.showToast({ title: err.message || '结算信息加载失败', icon: 'none' })
      this.loadOrders(true)
    } finally {
      wx.hideLoading()
    }
  },

  async normalizeCheckoutItems(items) {
    const list = []
    for (const item of items) {
      let next = { ...item }
      if (!next.product_name || !next.product_image || !next.price || next.shipping_fee === undefined) {
        const detailRes = await getProductDetail(next.product_id)
        if (detailRes.code === 0) {
          const product = normalizeProductImages(detailRes.data)
          next = {
            ...next,
            product_name: next.product_name || product.name,
            product_image: next.product_image || product.main_image || product.image || (product.images || [])[0] || '',
            price: next.price || product.price,
            shipping_fee: next.shipping_fee || product.shipping_fee,
          }
        }
      }
      const quantity = Number(next.quantity || 1)
      const price = Number(next.price || 0)
      const shippingFee = Number(next.shipping_fee || 0)
      list.push({
        ...normalizeProductImages(next),
        quantity,
        price_text: money(price),
        shipping_fee: money(shippingFee),
        shipping_fee_text: money(shippingFee),
        subtotal_text: money(next.subtotal || price * quantity),
      })
    }
    return list
  },

  async loadAddresses() {
    try {
      const res = await getAddresses()
      if (res.code !== 0) return
      const addresses = (res.data.items || []).map(item => ({
        ...item,
        full_address: buildFullAddress(item),
      }))
      const lastSelectedId = wx.getStorageSync('lastSelectedAddressId')
      const currentId = this.data.selectedAddress && this.data.selectedAddress.id
      const selected = addresses.find(item => item.id === lastSelectedId)
        || addresses.find(item => item.id === currentId)
        || addresses.find(item => item.is_default)
        || addresses[0]
        || null
      if (lastSelectedId) wx.removeStorageSync('lastSelectedAddressId')
      this.setData({ addresses, selectedAddress: selected })
    } catch (e) {}
  },

  calcCheckoutSummary(items = this.data.checkoutItems) {
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)
    const freight = items.reduce((sum, item) => sum + Number(item.shipping_fee || 0), 0)
    const pay = total + freight
    this.setData({
      checkoutSummary: {
        total_amount: money(total),
        freight_amount: money(freight),
        pay_amount: money(pay),
      },
    })
  },

  chooseAddress(e) {
    const id = e.currentTarget.dataset.id
    const selected = this.data.addresses.find(item => item.id === id)
    if (selected) this.setData({ selectedAddress: selected })
  },

  goAddressManage() {
    wx.navigateTo({ url: '/pages/addresses/addresses?from=checkout' })
  },

  async submitOrderAndPay() {
    if (this.data.creating) return
    const { selectedAddress, checkoutItems } = this.data
    if (!selectedAddress) {
      wx.showToast({ title: '请先添加收货地址', icon: 'none' })
      return
    }
    if (!checkoutItems.length) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    this.setData({ creating: true })
    wx.showLoading({ title: '提交订单中...', mask: true })
    try {
      const orderItems = checkoutItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        sku_spec: item.sku_spec || {},
      }))
      const orderRes = await createOrder({
        address_id: selectedAddress.id,
        items: orderItems,
      })
      if (orderRes.code !== 0 || !orderRes.data.order_id) {
        throw new Error(orderRes.message || '创建订单失败')
      }
      await this.removeOrderedCartItems(checkoutItems)
      wx.removeStorageSync('checkoutItems')
      wx.hideLoading()
      await this.requestPayment(orderRes.data.order_id)
      this.setData({ checkoutMode: false, currentTab: 'paid', orders: [], page: 1 })
      this.loadOrders(true)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '支付失败', icon: 'none' })
    } finally {
      this.setData({ creating: false })
    }
  },

  async removeOrderedCartItems(items = []) {
    const cartItemIds = items
      .map(item => item.cart_item_id)
      .filter(Boolean)
    for (const id of cartItemIds) {
      try {
        await removeCartItem(id)
      } catch (e) {}
    }
  },

  async loadOrders(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await getOrders(this.data.currentTab, page)
      if (res.code === 0) {
        const items = (res.data.items || []).map(order => ({
          ...order,
          total_amount_text: money(order.total_amount),
          freight_amount_text: money(order.freight_amount),
          coupon_amount_text: money(order.coupon_amount),
          points_amount_text: money(order.points_amount),
          pay_amount_text: money(order.pay_amount || order.total_amount),
          show_discount: Number(order.coupon_amount || 0) > 0 || Number(order.points_amount || 0) > 0,
          items: (order.items || []).map(normalizeProductImages),
        }))
        this.setData({
          orders: reset ? items : [...this.data.orders, ...items],
          page: page + 1,
          hasMore: items.length >= (res.data.page_size || 20),
          loaded: true,
        })
      }
    } catch (e) {
      this.setData({ loaded: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  switchTab(e) {
    const val = e.currentTarget.dataset.value
    if (val === this.data.currentTab) return
    this.setData({ currentTab: val, orders: [], page: 1, loaded: false })
    this.loadOrders(true)
  },

  loadMore() {
    if (this.data.hasMore) this.loadOrders()
  },

  requestPayment(orderId) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await payOrder(orderId)
        if (res.data && res.data.paid) {
          wx.showToast({ title: '支付成功', icon: 'success' })
          resolve()
          return
        }
        const payParams = res.data || {}
        wx.requestPayment({
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType || 'RSA',
          paySign: payParams.paySign,
          success: () => {
            wx.showToast({ title: '支付成功', icon: 'success' })
            resolve()
          },
          fail: (err) => {
            const msg = err.errMsg && err.errMsg.includes('cancel') ? '已取消支付' : '支付失败'
            reject(new Error(msg))
          },
        })
      } catch (err) {
        reject(err)
      }
    })
  },

  payOrder(e) {
    const id = e.currentTarget.dataset.id
    this.requestPayment(id).then(() => this.loadOrders(true)).catch((err) => {
      wx.showToast({ title: err.message || '支付失败', icon: 'none' })
    })
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定取消该订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await cancelOrder(id)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadOrders(true)
        } catch (err) {
          wx.showToast({ title: err.message || '取消失败', icon: 'none' })
        }
      },
    })
  },

  confirmReceive(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认收货',
      content: '确认已经收到商品了吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await confirmReceive(id)
          wx.showToast({ title: '已确认收货', icon: 'success' })
          this.loadOrders(true)
        } catch (err) {
          wx.showToast({ title: err.message || '确认失败', icon: 'none' })
        }
      },
    })
  },
})
