export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  image: string;
  highlights?: string[]; // 需要高亮显示的UI元素
  tips?: string[]; // 额外的提示信息
}

export interface DIYTutorialProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  steps: TutorialStep[];
  autoPlay?: boolean;
  autoPlayDelay?: number; // 自动播放延迟时间（毫秒）
}

export interface TutorialStepProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
}
