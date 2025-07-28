

export const BEADS_LIST = [8, 10, 12, 13, 14, 15, 16];

export const CUSTOM_RENDER_RATIO = 3;

export const BEADS_SIZE_RENDER = BEADS_LIST.map((item) => ({
  bead_diameter: item,
  render_diameter: item * CUSTOM_RENDER_RATIO,
}));

export const ASSISTANT_GUIDE_TAG = "BeadsGuide:";

export const WISH_TEMPLATES = [
  {
    wish: "事业财运",
    reply: "我想要提升事业财运"
  },
  {
    wish: "爱情桃花",
    reply: "我想要增强爱情桃花运"
  },
  {
    wish: "健康平安",
    reply: "我想要增进健康平安"
  },
  
  {
    wish: "学业智慧",
    reply: "我想要提高学业智慧"
  },
  {
    wish: "情绪疗愈",
    reply: "我想要获得情绪疗愈"
  },
  {
    wish: "人际和谐",
    reply: "我想要促进人际和谐"
  },
];

export const BEAD_SIZE_TEMPLATE = "我期望的水晶直径是{size}";

export const BEAD_HAND_CIRCUMFERENCE_TEMPLATE = "我的手腕尺寸是{hand_circumference}";
