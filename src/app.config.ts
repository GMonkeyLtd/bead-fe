export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/design/index',
    'pages/result/index',
    'pages/quick-design/index',
    'pages/tabPage/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '五行水晶命理测算',
    navigationBarTextStyle: 'black',
    backgroundColor: '#ffffff'
  },
  tabBar: {
    color: '#F4F1EF',
    selectedColor: '#444444',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        // iconPath: 'assets/icons/home.png',
        // selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/tabPage/index',
        text: '结果',
        // iconPath: 'assets/icons/crystal.png',
        // selectedIconPath: 'assets/icons/crystal-active.png'
      },
      // {
      //   pagePath: 'pages/design/index',
      //   text: '个性化定制',
      // },
    ]
  }
})
