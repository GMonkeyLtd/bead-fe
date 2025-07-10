import React, { useState, useEffect, useRef } from 'react';
import { Image, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface LazyImageProps {
  src: string;
  placeholder?: string;
  alt?: string;
  className?: string;
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix';
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number; // 距离多少像素时开始加载
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder = '',
  alt = '',
  className = '',
  mode = 'aspectFill',
  onLoad,
  onError,
  threshold = 100,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imageRef = useRef<HTMLElement>();

  useEffect(() => {
    const observer = Taro.createIntersectionObserver({
      thresholds: [0],

      rootMargin: `${threshold}px`,
    });

    const element = imageRef.current;
    console.log(element,'element');
    if (element) {
      observer.observe(element as any, (res) => {
        console.log(res,'res');
        if (res.intersectionRatio && res.intersectionRatio > 0) {
          setIsVisible(true);
          observer.disconnect();
        }
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  useEffect(() => {
    if (isVisible && !isLoaded && !isError) {
      setCurrentSrc(src);
    }
  }, [isVisible, src, isLoaded, isError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setCurrentSrc(placeholder);
    onError?.();
  };
  console.log(currentSrc, isLoaded, isError, isVisible,'currentSrc');

  return (
    <View 
      ref={imageRef as any}
      className={`${styles.lazyImageWrapper} ${className}`}
    >
      <Image
        src={currentSrc}
        mode={mode}
        className={`${styles.lazyImage} ${isLoaded ? styles.loaded : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!isLoaded && !isError && (
        <View className={styles.loadingPlaceholder}>
          <View className={styles.spinner} />
        </View>
      )}
      {isError && (
        <View className={styles.errorPlaceholder}>
          <View className={styles.errorIcon}>📷</View>
          <View className={styles.errorText}>加载失败</View>
        </View>
      )}
    </View>
  );
};

export default LazyImage; 