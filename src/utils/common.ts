import Taro from "@tarojs/taro";
import { pageUrls } from "@/config/page-urls";

export const goBack = () => {
  if (Taro.getCurrentPages().length === 1) {
    Taro.navigateTo({
      url: pageUrls.home,
    });
  } else {
    Taro.navigateBack();
  }
};