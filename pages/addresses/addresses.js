const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../../utils/request')

const emptyForm = {
  id: '',
  receiver_name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail_address: '',
  is_default: false,
}

Page({
  data: {
    items: [],
    loaded: false,
    showForm: false,
    form: { ...emptyForm },
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.loadData()
  },

  async loadData() {
    try {
      const res = await getAddresses()
      if (res.code === 0) this.setData({ items: res.data.items || [], loaded: true })
    } catch (e) {
      this.setData({ loaded: true })
    }
  },

  addItem() {
    this.setData({ showForm: true, form: { ...emptyForm } })
  },

  editItem(e) {
    const item = this.data.items[e.currentTarget.dataset.index]
    this.setData({ showForm: true, form: { ...item } })
  },

  closeForm() {
    this.setData({ showForm: false, form: { ...emptyForm } })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onDefaultChange(e) {
    this.setData({ 'form.is_default': e.detail.value })
  },

  async saveForm() {
    const form = this.data.form
    const required = ['receiver_name', 'phone', 'province', 'city', 'district', 'detail_address']
    if (required.some(key => !String(form[key] || '').trim())) {
      wx.showToast({ title: '请填写完整地址', icon: 'none' })
      return
    }
    try {
      if (form.id) {
        await updateAddress(form.id, form)
      } else {
        await addAddress(form)
      }
      wx.showToast({ title: '已保存', icon: 'success' })
      this.closeForm()
      this.loadData()
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    }
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id
    setDefaultAddress(id).then(() => {
      wx.showToast({ title: '设置成功', icon: 'success' })
      this.loadData()
    })
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除地址',
      content: '确定删除该收货地址吗？',
      success: async (res) => {
        if (!res.confirm) return
        await deleteAddress(id)
        wx.showToast({ title: '已删除', icon: 'success' })
        this.loadData()
      },
    })
  },
})
