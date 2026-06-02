const { getPoints, getPointsHistory } = require('../../utils/request')

function dateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

Page({
  data: {
    summary: {},
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
    this.loadSummary()
    this.loadHistory(true)
  },

  async loadSummary() {
    try {
      const res = await getPoints()
      if (res.code === 0) this.setData({ summary: res.data })
    } catch (e) {}
  },

  async loadHistory(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await getPointsHistory(page)
      if (res.code === 0) {
        const rows = (res.data.items || []).map(item => ({
          ...item,
          typeText: item.type === 'earn' ? '获得积分' : '使用积分',
          createdText: dateTime(item.created_at),
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
    if (this.data.hasMore) this.loadHistory()
  },
})
