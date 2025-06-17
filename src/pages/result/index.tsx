import { View, Button, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import logoImage from "@/assets/icons/logo.svg";
import expendImage from "@/assets/icons/expend.svg";
import CrystalButton from "@/components/CrystalButton";
import rcodeImage from "@/assets/rcode.png"

const Result = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { top: navBarTop } = getNavBarHeightAndTop();

  const [beadDescriptions, setBeadDescriptions] = useState([
    {
      image_url:
        "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%9D%92%E9%87%91%E7%9F%B3.png",
      name: "绿松石",
      description: "一段话描",
    },
    {
      image_url:
        "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%93%9D%E5%AE%9D.png",
      name: "蓝水晶",
      description: "量和祝福。",
    },
  ]);

  useEffect(() => {
    // 获取传入的图片URL参数
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    console.log(params, "params");
    if (params?.imageUrl) {
      const decodedUrl = decodeURIComponent(params.imageUrl);
      setImageUrl(decodedUrl);
      document.documentElement.style.setProperty(
        "--bg-image",
        `url(${decodedUrl})`
      );
      console.log(decodedUrl, "decodedUrl");
    } else {
      document.documentElement.style.setProperty(
        "--background-image",
        `url(https://crystal-ring.cn-sh2.ufileos.com/ring.png)`
      );
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
      Taro.showToast({
        title: "保存中",
        icon: "loading",
      });

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

  // 分享图片
  const shareImage = () => {
    Taro.showShareMenu({
      withShareTicket: true,
    });
  };

  const viewImage = () => {
    if (!imageUrl) {
      Taro.showToast({
        title: '暂无图片',
        icon: 'none'
      });
      return;
    }

    Taro.previewImage({
      current: imageUrl,
      urls: [imageUrl],
    });
  };

  console.log(imageUrl, "当前显示的imageUrl");

  return (
    <View
      className="result-container"
      style={{
        height: "100vh",
        paddingTop: `-${navBarTop}px`,
        "--bg-image": `url(${imageUrl})`,
      }}
    >
      <AppHeader isWhite />
      <View className="result-content-container">
        <View className="result-content-card">
          <View className="result-content-card-image" onClick={viewImage}>
            <View className="logo-image-container" onClick={viewImage}>
              <Image className="logo-image" src={logoImage} mode="widthFix" />
            </View>
            <Image className="expend-image" src={expendImage} mode="widthFix" />
          </View>
          <View className="result-content-card-text-container">
            <View className="result-content-card-text">
              <View className="result-content-card-text-desc">
                财如泉涌 生生不息
              </View>
              <View className="result-content-card-text-title">夏日睡莲</View>
              <View className="result-content-card-text-content">
                一段话描述这款手串的，一段话描述这款手串的整体能量和祝福。
              </View>
            </View>
            <View className="bead-description-container">
              <View className="bead-description-list">
                {beadDescriptions.length > 0 &&
                  beadDescriptions.map((item, index) => (
                    <View className="bead-item" key={index}>
                      <View className="bead-title" key={index}>
                        <Image
                          src={item.image_url}
                          style={{
                            width: "15px",
                            height: "15px",
                            marginRight: "4px",
                          }}
                        />
                        <View>{item.name}</View>
                      </View>
                      <View className="bead-description">{item.description}</View>
                    </View>
                  ))}
              </View>
              <View className="bead-share-rccode">
                <Image src={rcodeImage} mode="widthFix" style={{ width: '62px', height: '62px'}} />
                <View className="bead-share-rccode-text">开启专属定制</View>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View className="result-content-card-action">
        <CrystalButton onClick={saveImage} text="保存图片" />
        <CrystalButton onClick={shareImage} text="分享好友" />
      </View>
    </View>
  );
};

export default Result;
