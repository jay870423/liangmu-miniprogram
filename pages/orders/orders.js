const { getOrders } = require('../../utils/request')

Page({
  data: {
    tabs: [
      { label: '全部', value: '' },
      { label: '待支付', value: '0' },
      { label: '待发货', value: '1' },
      { label: '待收货', value: '2' },
      { label: '已完成', value: '3' },
    ],
    currentTab: '',
    orders: [],
    page: 1,
    hasMore: false,
    loading: false,
    loaded: false,
    statusText: { 0: '待支付', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' },
    statusClass: { 0: 'pending', 1: 'paid', 2: 'shipped', 3: 'done' },
  },

  onLoad(opt) {
    if (opt && opt.status !== undefined) {
      this.setData({ currentTab: String(opt.status) })
    }
    this.loadOrders(true)
  },

  async loadOrders(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await getOrders(this.data.currentTab, page)
      if (res.code === 0) {
        const items = res.data.items || []
        this.setData({
          orders: reset ? items : [...this.data.orders, ...items],
          page: page + 1,
          hasMore: items.length >= 10,
          loaded: true,
        })
      }
    } catch (e) { this.setData({ loaded: true }) }
    this.setData({ loading: false })
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

  cancelOrder(e) {
    wx.showModal({ title: '确认取消', content: '确定取消该订单吗？', success: (res) => {
      if (res.confirm) this.loadOrders(true)
    }})
  },

  payOrder(e) { wx.showToast({ title: '跳转支付中...', icon: 'none' }) },
  confirmReceive(e) { wx.showToast({ title: '已确认收货', icon: 'success' }) },
})
