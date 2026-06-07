const {
  normalizeProductImages,
  getOrders,
  createOrder,
  payOrder,
  cancelOrder,
  confirmReceive,
} = require('../../utils/request')

function money(value) {
  const num = Number(value || 0)
  return num.toFixed(2)
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
      this.createOrderAndPay(opt)
      return
    }
    this.loadOrders(true)
  },

  async createOrderAndPay(opt = {}) {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.switchTab({ url: '/pages/my/my' })
      return
    }
    if (this.data.creating) return
    this.setData({ creating: true, loaded: true })
    wx.showLoading({ title: '创建订单中...', mask: true })
    try {
      let items = []
      if (opt.product_id) {
        items = [{
          product_id: opt.product_id,
          quantity: Number(opt.quantity || 1),
          sku_spec: opt.sku_spec ? JSON.parse(decodeURIComponent(opt.sku_spec)) : {},
        }]
      } else {
        items = wx.getStorageSync('checkoutItems') || []
      }
      if (!items.length) throw new Error('请选择要结算的商品')

      const orderRes = await createOrder({ items })
      if (orderRes.code !== 0 || !orderRes.data.order_id) {
        throw new Error(orderRes.message || '创建订单失败')
      }
      wx.removeStorageSync('checkoutItems')
      wx.hideLoading()
      await this.confirmAndPay(orderRes.data)
      this.setData({ currentTab: 'paid' })
      this.loadOrders(true)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '结算失败', icon: 'none' })
      this.loadOrders(true)
    } finally {
      this.setData({ creating: false })
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

  confirmAndPay(order) {
    const content = [
      `商品金额：¥${money(order.total_amount)}`,
      `运费：¥${money(order.freight_amount)}`,
      Number(order.coupon_amount || 0) > 0 ? `优惠：-¥${money(order.coupon_amount)}` : '',
      Number(order.points_amount || 0) > 0 ? `积分抵扣：-¥${money(order.points_amount)}` : '',
      `实付金额：¥${money(order.pay_amount)}`,
    ].filter(Boolean).join('\n')
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '确认支付金额',
        content,
        confirmText: '去支付',
        success: (res) => {
          if (!res.confirm) {
            reject(new Error('已取消支付'))
            return
          }
          this.requestPayment(order.order_id).then(resolve).catch(reject)
        },
        fail: reject,
      })
    })
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
