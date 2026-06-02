const { getAvailableCoupons, getMyCoupons, receiveCoupon } = require('../../utils/request')

function moneyText(value) {
  return Number(value || 0).toFixed(0)
}

function dateText(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

Page({
  data: {
    tabs: [
      { label: '可领取', value: 'available' },
      { label: '未使用', value: 'unused' },
      { label: '已使用', value: 'used' },
      { label: '已过期', value: 'expired' },
    ],
    currentTab: 'unused',
    items: [],
    loaded: false,
    loading: false,
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.loadData()
  },

  switchTab(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.currentTab) return
    this.setData({ currentTab: value, items: [], loaded: false })
    this.loadData()
  },

  async loadData() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = this.data.currentTab === 'available'
        ? await getAvailableCoupons()
        : await getMyCoupons(this.data.currentTab)
      if (res.code === 0) {
        const rows = (res.data.items || []).map(item => ({
          ...item,
          amountText: moneyText(item.discount_amount),
          minText: moneyText(item.min_order_amount),
          endText: dateText(item.end_time),
          statusClass: item.status === 'used' || this.data.currentTab === 'expired' ? 'disabled' : '',
          stateText: item.has_received ? '已领取' : this.stateText(item.status || this.data.currentTab),
        }))
        this.setData({ items: rows, loaded: true })
      }
    } catch (e) {
      this.setData({ loaded: true })
    }
    this.setData({ loading: false })
  },

  stateText(status) {
    const map = { available: '可领取', unused: '未使用', used: '已使用', expired: '已过期' }
    return map[status] || '优惠券'
  },

  async receiveItem(e) {
    try {
      await receiveCoupon(e.currentTarget.dataset.id)
      wx.showToast({ title: '领取成功', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '领取失败', icon: 'none' })
    }
  },
})
