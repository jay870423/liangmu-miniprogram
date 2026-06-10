const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatError,
} = require('../../utils/request')

const TYPE_META = {
  activity: { text: '活动通知', icon: '🎁' },
  payment: { text: '支付通知', icon: '💳' },
  order: { text: '订单通知', icon: '📦' },
  system: { text: '系统通知', icon: '🔔' },
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

Page({
  data: {
    messages: [],
    page: 1,
    hasMore: false,
    loading: false,
    loaded: false,
    unreadCount: 0,
  },

  onLoad() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.switchTab({ url: '/pages/my/my' })
      return
    }
    this.loadMessages(true)
  },

  async onPullDownRefresh() {
    try {
      await this.loadMessages(true)
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  async loadMessages(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await getNotifications(page, 20)
      if (res.code === 0) {
        const items = (res.data.items || []).map(item => {
          const meta = TYPE_META[item.type] || TYPE_META.system
          return {
            ...item,
            type_text: meta.text,
            icon: meta.icon,
            time_text: formatTime(item.publish_at || item.created_at),
          }
        })
        const messages = reset ? items : this.data.messages.concat(items)
        this.setData({
          messages,
          page: page + 1,
          hasMore: items.length >= (res.data.page_size || 20),
          unreadCount: messages.filter(item => !item.is_read).length,
          loaded: true,
        })
      }
    } catch (e) {
      console.error('load messages error:', formatError(e), e)
      wx.showToast({ title: formatError(e) || '消息加载失败', icon: 'none' })
      this.setData({ loaded: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  loadMore() {
    if (this.data.hasMore) this.loadMessages(false)
  },

  async markAllRead() {
    if (!this.data.messages.length) return
    try {
      await markAllNotificationsRead()
      const messages = this.data.messages.map(item => ({ ...item, is_read: true }))
      this.setData({ messages, unreadCount: 0 })
      wx.showToast({ title: '已全部标记为已读', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: formatError(e) || '操作失败', icon: 'none' })
    }
  },

  async onMessageTap(e) {
    const id = e.currentTarget.dataset.id
    const message = this.data.messages.find(item => item.id === id)
    if (!message) return
    if (!message.is_read) {
      try {
        await markNotificationRead(id)
        const messages = this.data.messages.map(item => (
          item.id === id ? { ...item, is_read: true } : item
        ))
        this.setData({
          messages,
          unreadCount: messages.filter(item => !item.is_read).length,
        })
      } catch (err) {}
    }
    this.openLink(message)
  },

  openLink(message) {
    const type = String(message.link_type || 'none').toLowerCase()
    const value = String(message.link_value || '').trim()
    if (!value || type === 'none') return
    if (type === 'product' || type === 'goods') {
      wx.navigateTo({ url: `/pages/product/product?id=${value}` })
      return
    }
    if (type === 'category') {
      wx.setStorageSync('selectedCategoryId', value)
      wx.switchTab({ url: '/pages/category/category' })
      return
    }
    if (type === 'order') {
      wx.navigateTo({ url: '/pages/orders/orders' })
      return
    }
    if (type === 'url' || type === 'link' || type === 'external' || type === 'webview') {
      const url = /^https?:\/\//i.test(value) ? value : `https://${value}`
      wx.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url)}` })
    }
  },
})
