import { View, Button, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";

const LoadingPage = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取传入的图片URL参数
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    console.log(params, "params");
    if (params?.imageUrl) {
      const decodedUrl = decodeURIComponent(params.imageUrl);
      setImageUrl(decodedUrl);
      console.log(decodedUrl, "decodedUrl");
    } else {
      setImageUrl("https://crystal-ring.cn-sh2.ufileos.com/ring.png");
    }

    // 设置导航栏标题
    Taro.setNavigationBarTitle({
      title: "生成结果",
    });
  }, []);

  // 保存图片到相册
  const saveImage = async () => {
    if (!imageUrl) {
      Taro.showToast({
        title: "没有图片可保存",
        icon: "none",
      });
      return;
    }

    try {
      setLoading(true);

      // 先下载图片到本地
      const downloadRes = await Taro.downloadFile({
        url: imageUrl,
      });

      if (downloadRes.statusCode === 200) {
        // 保存图片到相册
        await Taro.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath,
        });

        Taro.showToast({
          title: "保存成功",
          icon: "success",
        });
      }
    } catch (error) {
      console.error("保存图片失败:", error);
      Taro.showToast({
        title: "保存失败",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <View className="crystal-common-container">
      <AppHeader isWhite={false} />

      <View className="loading-page-container">
        <View className="loading-page-content">
          <View className="loading-page-content-title">
            <Text>生成中...</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LoadingPage;
