export default defineAppConfig({
  // 🔥 关键优化：启用按需注入，只加载必要的组件代码
  lazyCodeLoading: "requiredComponents",
  pages: [
    'pages/home/index'
  ],
  subPackages: [
    {
      root: 'pages-chat',
      pages: [
        'chat-design/index',
      ]
    },
    {
      root: 'pages-design',
      pages: [
        'quick-design/index',
        'custom-design/index'
      ]
    },
    {
      root: 'pages-user',
      pages: [
        'user-center/index',
        'my-invites/index', // 新增页面
        'result/index',
        'contact-preference/index',
        'modify-user/index',
      ]
    },
    {
      root: 'pages-order',
      pages: [
        'order-detail/index',
        'order-list/index',
        // 'order-dispatching/index',
        'cancel-order/index',
      ]
    },
    {
      root: 'pages-merchant',
      pages: [
        'login/index',
        'grab-orders/index',
        'order-management/index',
        'user-center/index',
      ]
    },
    {
      root: 'pages-common',
      pages: [
        'webview/index',
        'design-report/index',
        'inspiration/index',
        'inspiration-detail/index',
      ]
    },
    {
      root: 'pages-product',
      pages: [
        'product-list/index',
        'product-detail/index',
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F4F1EE',
    navigationBarTitleText: '璞光纪',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F4F1EE',
    enablePullDownRefresh: false
  },
  requiredPrivateInfos: [
    "chooseAddress"
  ],
  plugins: {
    "logisticsPlugin": {
      "version": "2.3.0",
      "provider": "wx9ad912bf20548d92"
    }
  }
})
