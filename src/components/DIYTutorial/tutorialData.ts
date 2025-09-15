import { TutorialStep } from './types';
import Taro from '@tarojs/taro';

export const DIY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: '欢迎来到DIY设计台',
    description: '在这里，您可以自由设计属于自己的水晶手链。让我们一起开始这段创意之旅！',
    image: 'https://zhuluoji.cn-sh2.ufileos.com/images-frontend/tutorials/step1.png',
    tips: [
      '您可以随时点击左上角返回按钮保存进度',
      '设计过程中可以随时预览效果'
    ]
  },
  {
    id: 2,
    title: '选择水晶珠子',
    description: '点击下方的水晶分类，选择您喜欢的珠子类型。每种珠子都有不同的寓意和能量。',
    image: 'https://zhuluoji.cn-sh2.ufileos.com/images-frontend/tutorials/step2.png',
    highlights: ['bead-selector'],
    tips: [
      '可以根据五行属性选择适合的珠子',
      '不同尺寸的珠子可以创造丰富的层次感',
      '点击珠子可以查看详细信息'
    ]
  },
  {
    id: 3,
    title: '添加珠子到手链',
    description: '选中珠子后，点击手链上的任意位置即可添加。您也可以拖拽珠子来调整位置。',
    image: 'https://zhuluoji.cn-sh2.ufileos.com/images-frontend/tutorials/step3.png',
    highlights: ['bracelet-ring'],
    tips: [
      '长按珠子可以删除',
      '可以添加多个相同类型的珠子',
      '手链会根据珠子数量自动调整大小'
    ]
  },
  {
    id: 4,
    title: '调整珠子位置',
    description: '通过拖拽可以调整珠子在手链上的位置，创造出您想要的排列效果。',
    image: 'https://zhuluoji.cn-sh2.ufileos.com/images-frontend/tutorials/step4.png',
    highlights: ['bracelet-ring'],
    tips: [
      '相邻的珠子会自动对齐',
      '可以使用旋转功能调整整体布局',
      '支持撤销和重做操作'
    ]
  },
  {
    id: 5,
    title: '添加配饰',
    description: '选择合适的配饰来装点您的手链，让设计更加精美独特。',
    image: 'https://zhuluoji.cn-sh2.ufileos.com/images-frontend/tutorials/step5.png',
    highlights: ['accessory-selector'],
    tips: [
      '配饰通常放在手链的中心位置',
      '可以选择多个配饰组合使用',
      '配饰的大小会影响整体视觉效果'
    ]
  }
];

// 获取教程步骤的函数
export const getTutorialSteps = (): TutorialStep[] => {
  return DIY_TUTORIAL_STEPS;
};

// 获取特定步骤
export const getTutorialStep = (stepId: number): TutorialStep | undefined => {
  return DIY_TUTORIAL_STEPS.find(step => step.id === stepId);
};

// 检查用户是否已完成教程的本地存储key
export const TUTORIAL_COMPLETED_KEY = 'diy_tutorial_completed';

// 检查用户是否已完成教程
export const isTutorialCompleted = (): boolean => {
  try {
    const completed = Taro.getStorageSync(TUTORIAL_COMPLETED_KEY);
    return completed === 'true';
  } catch (error) {
    console.error('检查教程完成状态失败:', error);
    return false;
  }
};

// 标记教程为已完成
export const markTutorialCompleted = (): void => {
  try {
    Taro.setStorageSync(TUTORIAL_COMPLETED_KEY, 'true');
  } catch (error) {
    console.error('保存教程完成状态失败:', error);
  }
};

// 重置教程状态
export const resetTutorialStatus = (): void => {
  try {
    Taro.removeStorageSync(TUTORIAL_COMPLETED_KEY);
  } catch (error) {
    console.error('重置教程状态失败:', error);
  }
};
