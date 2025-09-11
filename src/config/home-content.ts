export interface SwiperItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  contentColor?: string;
  type: 'image' | 'video';
}

export const SWIPER_DATA: SwiperItem[] = [
    // {
    //   id: 1,
    //   title: "水晶手串新灵感",
    //   subtitle: "CRYSTAL",
    //   description: "探索未来，掌握命运",
    //   backgroundImage: "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/home-page-bg.png",
    //   type: 'image'
    // },
    {
      id: 2,
      title: "水晶手串新灵感",
      subtitle: "CRYSTAL", 
      description: "定制属于你的光",
      backgroundVideo: "https://zhuluoji.cn-sh2.ufileos.com/resources/home-video.mp4",
      type: 'video',
      contentColor: '#fff'
    },
    // {
    //   id: 3,
    //   title: "水晶手串新灵感",
    //   subtitle: "CRYSTAL",
    //   description: "探索未来，掌握命运",
    //   backgroundImage:
    //     "http://crystal-ring.cn-sh2.ufileos.com/home-page/page02.png",
    //   type: 'image'
    // },
  ];