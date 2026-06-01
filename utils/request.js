const BASE_URL = 'https://api.zhouyuaninfo.com.cn/api/v1'

function getHeaders(needAuth) {
  const headers = { 'Content-Type': 'application/json' }
  if (needAuth) {
    const token = wx.getStorageSync('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
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
        if (res.data && res.data.code === 0) {
          resolve(res.data)
        } else if (res.data && res.data.code === 1002) {
          wx.removeStorageSync('token')
          wx.showToast({ title: '请重新登录', icon: 'none' })
          reject(res.data)
        } else {
          reject(res.data || { message: '请求失败' })
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
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
const addFavorite = (productId) => request('/favorites', 'POST', { product_id: productId }, true)
const removeFavorite = (productId) => request(`/favorites/${productId}`, 'DELETE', null, true)

// 订单
const getOrders = (status = '', page = 1) =>
  request(`/orders?status=${status}&page=${page}`, 'GET', null, true)
const createOrder = (data) => request('/orders', 'POST', data, true)

// 地址
const getAddresses = () => request('/addresses', 'GET', null, true)
const addAddress = (data) => request('/addresses', 'POST', data, true)
const updateAddress = (id, data) => request(`/addresses/${id}`, 'PUT', data, true)
const deleteAddress = (id) => request(`/addresses/${id}`, 'DELETE', null, true)
const setDefaultAddress = (id) => request(`/addresses/${id}/default`, 'PUT', null, true)

// 优惠券
const getMyCoupons = () => request('/coupons/mine', 'GET', null, true)

// 用户
const wxLogin = (code) => request('/user/wx_login', 'POST', { code }, false)
const getUserInfo = () => request('/user/info', 'GET', null, true)
const updateUserInfo = (data) => request('/user/info', 'PUT', data, true)

// 积分
const getPoints = () => request('/points', 'GET', null, true)
const getPointsHistory = () => request('/points/history', 'GET', null, true)

module.exports = {
  getHomeBanners, getHomeCategories, getHomeNew, getHomeRecommend,
  getCategories, getCategoryProducts,
  getProductDetail, searchProducts,
  getCart, addCart, updateCartItem, removeCartItem,
  addFavorite, removeFavorite,
  getOrders, createOrder,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getMyCoupons,
  wxLogin, getUserInfo, updateUserInfo,
  getPoints, getPointsHistory,
}
