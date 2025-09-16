import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DIYTutorialProps, TutorialStep } from './types';
import closeIcon from '@/assets/icons/close.svg';
import styles from './compareImages.module.scss';
import CrystalButton from '../CrystalButton';

const CompareImages: React.FC<DIYTutorialProps> = ({
    visible,
    onClose,
    onComplete,
    steps,
    defaultStep = 1
}) => {
    const [currentStep, setCurrentStep] = useState(defaultStep);

    // 重置状态当教程显示时
    useEffect(() => {
        if (visible) {
            setCurrentStep(defaultStep);
        }
    }, [visible]);

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


    const handleComplete = useCallback(() => {
        onComplete?.();
        onClose();
    }, [onComplete, onClose]);

    if (!visible || steps.length === 0) {
        return null;
    }

    const currentStepData = steps[currentStep - 1];
    const isFirst = currentStep === 1;
    const isLast = currentStep === steps.length;

    console.log(isFirst, isLast,'isFirst, isLast');

    return (
        <View className={styles.compareImagesOverlay} style={{ padding: '0 36px' }}>
            <View className={styles.compareImagesContainer}>
                {/* 内容区域 */}
                <View style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }}>
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
                <View className={styles.compareImagesFooter}>
                    <CrystalButton
                        text="上一项"
                        onClick={handlePrev}
                        disabled={isFirst}
                        style={{ width: '96px', padding: 0 }}
                        textStyle={{ fontSize: '14px' }}
                    />


                    {/* 进度指示器 */}
                    <View className={styles.compareImagesProgressDots}>
                        {steps.map((_, index) => (
                            <View
                                key={index}
                                className={`${styles.compareImagesDot} ${index < currentStep - 1 ? styles.completed :
                                    index === currentStep - 1 ? styles.active : ''
                                    }`}
                                onClick={() => setCurrentStep(index + 1)}
                            />
                        ))}
                    </View>
                        <CrystalButton
                            isPrimary
                            text="下一项"
                            disabled={isLast}
                            onClick={handleNext}
                            style={{ width: '96px', padding: 0 }}
                            textStyle={{ fontSize: '14px' }}
                        />
                </View>

                {/* 跳过按钮 */}
                <View className={styles.compareImagesSkipContainer} onClick={onClose}>
                    <Button className={styles.compareImagesSkipBtn}>
                        关闭
                    </Button>
                </View>
            </View>
        </View>
    );
};

export default CompareImages;
