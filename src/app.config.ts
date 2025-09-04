export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/inspiration/index',
    'pages/inspiration-detail/index',
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
