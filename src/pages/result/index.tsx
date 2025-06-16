import { View, Button, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";

const Result = () => {
  const [imageUrl, setImageUrl] = useState("");
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
    }

    // 设置导航栏标题
    Taro.setNavigationBarTitle({
      title: "生成结果"
    });
  }, []);

  // 保存图片到相册
  const saveImage = async () => {
    if (!imageUrl) {
      Taro.showToast({
        title: "没有图片可保存",
        icon: "none"
      });
      return;
    }

    try {
      setLoading(true);
      
      // 先下载图片到本地
      const downloadRes = await Taro.downloadFile({
        url: imageUrl
      });

      if (downloadRes.statusCode === 200) {
        // 保存图片到相册
        await Taro.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath
        });

        Taro.showToast({
          title: "保存成功",
          icon: "success"
        });
      }
    } catch (error) {
      console.error("保存图片失败:", error);
      Taro.showToast({
        title: "保存失败",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // 分享图片
  const shareImage = () => {
    Taro.showShareMenu({
      withShareTicket: true
    });
  };

  // 重新生成
  const regenerate = () => {
    Taro.navigateBack();
  };

  console.log(imageUrl, "当前显示的imageUrl");

  return (
    <View className="crystal-common-container">
      <AppHeader isWhite={false} />

    <View className="result-container">
      {/* 顶部装饰 */}
      <View className="result-header">
        <View className="crystal-decoration">
          <Text className="crystal-title">您的专属定制手串</Text>
          <Text className="crystal-subtitle">Crystal Portrait</Text>
        </View>
      </View>

      {/* 图片展示区域 */}
      <View className="image-container">
        <View className="image-frame">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              className="generated-image"
              mode="aspectFill"
              onLoad={() => console.log("图片加载成功")}
              style={{
                width: '280px',
                height: '280px'
              }}
              onError={() => {
                console.log("图片加载失败");
                Taro.showToast({
                  title: "图片加载失败",
                  icon: "error"
                });
              }}
            />
          ) : (
            <View className="image-placeholder">
              <Text className="placeholder-text">图片加载中...</Text>
            </View>
          )}
        </View>
      </View>
    </View>
    </View>
  );
};

export default Result; 