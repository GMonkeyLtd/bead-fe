export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/custom-design/index',
    'pages/tabPage/index',
  ],
  subPackages: [
    {
      root: 'design-package',
      pages: [
        
        'result/index',
        'quick-design/index',
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
