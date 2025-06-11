export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/predict/index',
    'pages/result/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '五行水晶命理测算',
    navigationBarTextStyle: 'black',
    backgroundColor: '#ffffff'
  },
  tabBar: {
    color: '#857393',
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
        pagePath: 'pages/predict/index',
        text: '定制',
        // iconPath: 'assets/icons/crystal.png',
        // selectedIconPath: 'assets/icons/crystal-active.png'
      },
    ]
  }
})
