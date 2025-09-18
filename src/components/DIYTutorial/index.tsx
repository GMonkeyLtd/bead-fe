import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DIYTutorialProps, TutorialStep } from './types';
import closeIcon from '@/assets/icons/close.svg';
import './index.scss';
import CrystalButton from '../CrystalButton';

const DIYTutorial: React.FC<DIYTutorialProps> = ({
    visible,
    onClose,
    onComplete,
    steps,
    autoPlay = false,
    autoPlayDelay = 3000
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    // 自动播放功能
    useEffect(() => {
        if (autoPlay && visible && isAutoPlaying && currentStep < steps.length) {
            const timer = setTimeout(() => {
                handleNext();
            }, autoPlayDelay);

            return () => clearTimeout(timer);
        }
    }, [autoPlay, visible, isAutoPlaying, currentStep, steps.length, autoPlayDelay]);

    // 重置状态当教程显示时
    useEffect(() => {
        if (visible) {
            setCurrentStep(1);
            setIsAutoPlaying(autoPlay);
        }
    }, [visible, autoPlay]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    }, [currentStep, steps.length]);

    const handlePrev = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const handleSkip = useCallback(() => {
        Taro.showModal({
            title: '跳过教程',
            content: '确定要跳过教程吗？您可以随时在设置中重新查看。',
            success: (res) => {
                if (res.confirm) {
                    onClose();
                }
            }
        });
    }, [onClose]);

    const handleComplete = useCallback(() => {
        onComplete?.();
        onClose();
        // Taro.showToast({
        //     title: '教程完成！',
        //     icon: 'success',
        //     duration: 1500
        // });
    }, [onComplete, onClose]);

    const toggleAutoPlay = useCallback(() => {
        setIsAutoPlaying(prev => !prev);
    }, []);

    if (!visible || steps.length === 0) {
        return null;
    }

    const currentStepData = steps[currentStep - 1];
    const isFirst = currentStep === 1;
    const isLast = currentStep === steps.length;

    return (
        <View className="tutorial-overlay" style={{ padding: '40px 36px' }}>
            <View className="tutorial-container">
                {/* 头部 */}
                {/* <View className="tutorial-header">
          <View className="header-actions">
            <Image src={closeIcon} style={{ width: "20px", height: "20px" }} onClick={onClose} />
          </View>
        </View> */}

                {/* 内容区域 */}
                <View style={{ width: '100%' }}>
                    <Image
                        mode="widthFix"
                        src={currentStepData.image}
                        onError={() => {
                            console.warn(`教程图片加载失败: ${currentStepData.image}`);
                        }}
                        style={{ width: '100%' }}
                    />
                </View>

                {/* 底部操作区 */}
                <View className="tutorial-footer">
                    <View className="footer-left">
                        <CrystalButton
                            text="上一步"
                            onClick={handlePrev}
                            disabled={isFirst}
                            style={{ width: '96px', padding: 0 }}
                            textStyle={{ fontSize: '14px' }}
                        />

                    </View>

                    {/* 进度指示器 */}
                    <View className="progress-dots">
                        {steps.map((_, index) => (
                            <View
                                key={index}
                                className={`dot ${index < currentStep - 1 ? 'completed' :
                                        index === currentStep - 1 ? 'active' : ''
                                    }`}
                                onClick={() => setCurrentStep(index + 1)}
                            />
                        ))}
                    </View>

                    <View className="footer-right">
                        {isLast ? (
                            <CrystalButton
                                isPrimary
                                text="完成"
                                onClick={handleComplete}
                                style={{ width: '96px', padding: 0 }}
                                textStyle={{ fontSize: '14px', letterSpacing: '2px' }}
                            />
                        ) : (
                            <CrystalButton
                                isPrimary
                                text="下一步"
                                onClick={handleNext}
                                style={{ width: '96px', padding: 0 }}
                                textStyle={{ fontSize: '14px' }}
                            />
                        )}
                    </View>
                </View>

                {/* 跳过按钮 */}
                <View className="skip-container" onClick={onClose}>
                    <Button className="nav-button skip-btn">
                        关闭
                    </Button>
                </View>
            </View>
        </View>
    );
};

export default DIYTutorial;
