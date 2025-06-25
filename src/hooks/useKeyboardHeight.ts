import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";

const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 键盘适配逻辑
  useEffect(() => {
    // 监听键盘弹起
    const onKeyboardHeightChange = (res) => {
      // 设置CSS变量
      // document.documentElement.style.setProperty(
      //   "--keyboard-height",
      //   `${res.height}px`
      // );
      setKeyboardHeight(res.height);
    };

    // 小程序键盘事件监听
    Taro.onKeyboardHeightChange &&
      Taro.onKeyboardHeightChange(onKeyboardHeightChange);

    return () => {
      // 清理监听器
      Taro.offKeyboardHeightChange &&
        Taro.offKeyboardHeightChange(onKeyboardHeightChange);
      document.documentElement.style.removeProperty("--keyboard-height");
    };
  }, []);

  return { keyboardHeight };
};

export default useKeyboardHeight;