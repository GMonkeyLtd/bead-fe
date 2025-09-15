import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import { TutorialStepProps } from './types';

const TutorialStep: React.FC<TutorialStepProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  isFirst,
  isLast
}) => {
  return (
    <View className="tutorial-step">
      {/* 步骤指示器 */}
      <View className="step-indicator">
        第 {currentStep} 步，共 {totalSteps} 步
      </View>

      {/* 图片展示 */}
      <View className="step-image-container">
        <Image
          src={step.image}
          className="step-image"
          mode="aspectFit"
        />
      </View>

      {/* 标题和描述 */}
      <View className="step-text">
        <Text className="step-title">{step.title}</Text>
        <Text className="step-description">{step.description}</Text>
      </View>

      {/* 提示信息 */}
      {step.tips && step.tips.length > 0 && (
        <View className="step-tips">
          <View className="tip-title">小贴士</View>
          {step.tips.map((tip, index) => (
            <View key={index} className="tip-item">
              {tip}
            </View>
          ))}
        </View>
      )}

      {/* 进度点 */}
      <View className="progress-dots">
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            className={`dot ${
              index < currentStep - 1 ? 'completed' : 
              index === currentStep - 1 ? 'active' : ''
            }`}
          />
        ))}
      </View>

      {/* 操作按钮 */}
      <View className="step-actions">
        <View className="action-left">
          {!isFirst && (
            <Button className="nav-button prev-btn" onClick={onPrev}>
              上一步
            </Button>
          )}
        </View>

        <View className="action-center">
          <Button className="nav-button skip-btn" onClick={onSkip}>
            跳过教程
          </Button>
        </View>

        <View className="action-right">
          {isLast ? (
            <Button className="nav-button complete-btn" onClick={onComplete}>
              完成
            </Button>
          ) : (
            <Button className="nav-button next-btn" onClick={onNext}>
              下一步
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default TutorialStep;
