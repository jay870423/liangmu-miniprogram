const API_ORIGIN = 'https://api.zhouyuaninfo.com.cn'
const BASE_URL = `${API_ORIGIN}/api/v1`

function normalizeAssetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`
  return `${API_ORIGIN}/${url}`
}

function formatMoney(value) {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

function normalizeProductImages(item = {}) {
  const next = { ...item }
  if (next.main_image) next.main_image = normalizeAssetUrl(next.main_image)
  if (next.image) next.image = normalizeAssetUrl(next.image)
  if (next.product_image) next.product_image = normalizeAssetUrl(next.product_image)
  if (Array.isArray(next.images)) next.images = next.images.map(normalizeAssetUrl)
  if (Array.isArray(next.detail_images)) next.detail_images = next.detail_images.map(normalizeAssetUrl)
  if (next.price !== undefined) {
    next.price_value = Number(next.price || 0)
    next.price_text = formatMoney(next.price)
  }
  if (next.original_price !== undefined) {
    next.original_price_value = Number(next.original_price || 0)
    next.original_price_text = formatMoney(next.original_price)
  }
  if (next.subtotal !== undefined) {
    next.subtotal_text = formatMoney(next.subtotal)
  }
  return next
}

function getHeaders(needAuth) {
  const headers = { 'Content-Type': 'application/json' }
  if (needAuth) {
    const token = wx.getStorageSync('token')
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function request(url, method = 'GET', data = null, needAuth = false) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: getHeaders(needAuth),
      success: (res) => {
        const data = res.data && res.data.detail ? res.data.detail : res.data
        if (res.data && res.data.code === 0) {
          resolve(res.data)
        } else if ((data && data.code === 1002) || res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.showToast({ title: '请重新登录', icon: 'none' })
          reject(data || { code: 1002, message: '请重新登录' })
        } else {
          reject(data || { message: '请求失败' })
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

// 首页
const getHomeBanners = () => request('/home/banners')
const getHomeCategories = () => request('/home/categories')
const getHomeNew = () => request('/home/new')
const getHomeRecommend = () => request('/home/recommend')

// 分类
const getCategories = () => request('/categories')
const getCategoryProducts = (categoryId, page = 1, pageSize = 20) =>
  request(`/products?category_id=${categoryId}&page=${page}&page_size=${pageSize}`)

// 商品
const getProductDetail = (id) => request(`/products/${id}`, 'GET', null, false)
const searchProducts = (keyword, page = 1) =>
  request(`/products/search?keyword=${encodeURIComponent(keyword)}&page=${page}`)

// 购物车
const getCart = () => request('/cart', 'GET', null, true)
const addCart = (data) => request('/cart', 'POST', data, true)
const updateCartItem = (id, data) => request(`/cart/${id}`, 'PUT', data, true)
const removeCartItem = (id) => request(`/cart/${id}`, 'DELETE', null, true)

// 收藏
const getFavorites = (page = 1, pageSize = 20) =>
  request(`/favorites?page=${page}&page_size=${pageSize}`, 'GET', null, true)
const addFavorite = (productId) => request('/favorites', 'POST', { product_id: productId }, true)
const removeFavorite = (productId) => request(`/favorites/${productId}`, 'DELETE', null, true)

// 订单
const getOrders = (status = '', page = 1) =>
  request(`/orders?status=${status}&page=${page}`, 'GET', null, true)
const createOrder = (data) => request('/orders', 'POST', data, true)
const payOrder = (id) => request(`/orders/${id}/pay`, 'POST', null, true)
const cancelOrder = (id) => request(`/orders/${id}/cancel`, 'PUT', null, true)
const confirmReceive = (id) => request(`/orders/${id}/receive`, 'POST', null, true)

// 地址
const getAddresses = () => request('/addresses', 'GET', null, true)
const addAddress = (data) => request('/addresses', 'POST', data, true)
const updateAddress = (id, data) => request(`/addresses/${id}`, 'PUT', data, true)
const deleteAddress = (id) => request(`/addresses/${id}`, 'DELETE', null, true)
const setDefaultAddress = (id) => request(`/addresses/${id}/default`, 'PUT', null, true)

// 优惠券
const getAvailableCoupons = () => request('/coupons', 'GET', null, true)
const getMyCoupons = (status = 'unused') => request(`/user/coupons?status=${status}`, 'GET', null, true)
const receiveCoupon = (couponId) => request(`/user/coupons/${couponId}/receive`, 'POST', null, true)

// 用户
const wxLogin = (code) => request('/user/login', 'POST', { code }, false)
const bindUserPhone = (code) => request('/user/phone', 'POST', { code }, true)
const getUserInfo = () => request('/user/info', 'GET', null, true)
const updateUserInfo = (data) => request('/user/info', 'PUT', data, true)

// 积分
const getPoints = () => request('/user/points', 'GET', null, true)
const getPointsHistory = (page = 1, pageSize = 20) =>
  request(`/points/log?page=${page}&page_size=${pageSize}`, 'GET', null, true)

module.exports = {
  normalizeAssetUrl,
  formatMoney,
  normalizeProductImages,
  getHomeBanners,
  getHomeCategories,
  getHomeNew,
  getHomeRecommend,
  getCategories,
  getCategoryProducts,
  getProductDetail,
  searchProducts,
  getCart,
  addCart,
  updateCartItem,
  removeCartItem,
  getFavorites,
  addFavorite,
  removeFavorite,
  getOrders,
  createOrder,
  payOrder,
  cancelOrder,
  confirmReceive,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAvailableCoupons,
  getMyCoupons,
  receiveCoupon,
  wxLogin,
  bindUserPhone,
  getUserInfo,
  updateUserInfo,
  getPoints,
  getPointsHistory,
}
