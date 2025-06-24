export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/dev/index',
  ],
  subPackages: [
    {
      root: 'pages-design',
      pages: [
        'quick-design/index',
        'design/index'
      ]
    },
    {
      root: 'pages-utils',
      pages: [
        'custom-design/index',
      ]
    },
    {
      root: 'pages-user',
      pages: [
        'order-detail/index',
        'order-list/index',
        'design-list/index',
        'result/index',
      ]
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F4F1EE',
    navigationBarTitleText: '琉光纪',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F4F1EE'
  },

})
