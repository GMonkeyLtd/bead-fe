export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/dev/index',
  ],
  subPackages: [
    {
      root: 'pages-design',
      pages: [
        'result/index',
        'quick-design/index',
        'design/index',
        'custom-design/index',
      ]
    },
    {
      root: 'pages-user',
      pages: [
        'order-detail/index',
        'design-list/index',
      ]
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '琉光纪',
    navigationBarTextStyle: 'black',
    backgroundColor: '#ffffff'
  },

})
