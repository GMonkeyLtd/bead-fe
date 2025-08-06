import React, { useState, useEffect } from "react";
import { View } from "@tarojs/components";
import styles from "./index.module.scss";

interface TypewriterTextProps {
  text: string;
  isActive: boolean;
  speed?: number; // 打字速度，单位毫秒
  onComplete?: () => void;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  isActive,
  speed = 30,
  onComplete,
  className,
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(false);

  // 重置状态
  useEffect(() => {
    if (!isActive) {
      setDisplayText(text);
      setCurrentIndex(text.length);
      setShowCursor(false);
      return;
    }

    // 激活时重置状态
    setDisplayText("");
    setCurrentIndex(0);
    setShowCursor(false);
  }, [text, isActive]);

  // 打字机效果
  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      // 打字完成，显示光标闪烁效果
      setShowCursor(true);
      if (onComplete) {
        setTimeout(() => {
          setShowCursor(false);
          onComplete();
        }, 1000); // 光标闪烁1秒后完成
      }
    }
  }, [text, currentIndex, isActive, speed, onComplete]);

  // 光标闪烁效果
  useEffect(() => {
    if (!showCursor) return;
    
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [showCursor]);

  return (
    <View className={`${styles.typewriterText} ${className || ""}`}>
      {displayText}
      {/* {showCursor && <View className={styles.cursor}>|</View>} */}
    </View>
  );
};

export default TypewriterText; 