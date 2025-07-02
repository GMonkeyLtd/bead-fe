export default defineAppConfig({
  pages: [
    'pages/home/index'
  ],
  subPackages: [
    {
      root: 'pages-design',
      pages: [
        'quick-design/index',
        'design/index',
        'custom-design/index'
      ]
    },
    {
      root: 'pages-user',
      pages: [
        'user-center/index',
        'result/index',
        'contact-preference/index',
      ]
    },
    {
      root: 'pages-order',
      pages: [
        'order-detail/index',
        'order-list/index',
        'order-dispatching/index',
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
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F4F1EE',
    navigationBarTitleText: '璞光纪',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F4F1EE',
    enablePullDownRefresh: true
  },

})
