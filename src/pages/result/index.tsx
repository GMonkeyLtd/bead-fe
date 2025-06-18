import { View, Button, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import logoSvg from "@/assets/icons/logo.svg";
import expendImage from "@/assets/icons/expend.svg";
import CrystalButton from "@/components/CrystalButton";
import { QR_CODE_IMAGE_URL } from "@/config";
import { useDesign } from "@/store/DesignContext";

const Result = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { top: navBarTop } = getNavBarHeightAndTop();
  const [braceletName, setBraceletName] = useState("");
  const [braceletDescription, setBraceletDescription] = useState("");
  const { designData } = useDesign();
  console.log(designData, "designData");
  const [beadDescriptions, setBeadDescriptions] = useState([]);

  useEffect(() => {
    // 获取传入的图片URL参数
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    if (params?.designId) {
      const result = designData.find((item: any) => item.design_id === params.designId);
      const { images_url, bracelet_name, recommendation_text, bead_ids_deduplication } = result;
      console.log(images_url[0],decodeURIComponent(images_url[0]), "images_url");
      setImageUrl(images_url[0]);
      setBraceletName(bracelet_name);
      setBraceletDescription(recommendation_text);
      setBeadDescriptions(bead_ids_deduplication);
    } 
    // if (params?.imageUrl) {
    //   console.log(params.imageUrl, decodeURIComponent(params.imageUrl), "params.imageUrl");
    //   document.documentElement.style.setProperty(
    //     "--background-image",
    //     `url(${decodeURIComponent(params.imageUrl)})`
    //   );
    //   setImageUrl(decodeURIComponent(params.imageUrl));
    // }
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
            {/* <Image mode="widthFix" src={imageUrl} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} /> */}
            <View className="logo-image-container" onClick={viewImage}>
              <Image className="logo-image" src={logoSvg} mode="widthFix" />
            </View>
            <Image className="expend-image" src={expendImage} mode="widthFix" />
          </View>
          <View className="result-content-card-text-container">
            <View className="result-content-card-text">
              <View className="result-content-card-text-title">{braceletName}</View>
              <View className="result-content-card-text-content">
                {braceletDescription}
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
                <Image src={QR_CODE_IMAGE_URL} mode="widthFix" style={{ width: '62px', height: '62px'}} />
                <View className="bead-share-rccode-text">开启专属定制</View>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View className="result-content-card-action">
        <CrystalButton onClick={saveImage} text="保存图片" />
        <CrystalButton onClick={shareImage} text="分享好友" style={{ flex: 1 }} />
      </View>
    </View>
  );
};

export default Result;
