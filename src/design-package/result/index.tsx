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
  const [shareImageUrl, setShareImageUrl] = useState("");
  console.log(designData, "designData");
  const [beadDescriptions, setBeadDescriptions] = useState<any[]>([]);
  const [posterData, setPosterData] = useState(
    {
      title: "四季福缘",
      description: "四季福缘",
      mainImage: 
      "https://p26-aiop-sign.byteimg.com/tos-cn-i-vuqhorh59i/20250619173439F930AD7D1A982EA90EC2-0~tplv-vuqhorh59i-image.image?rk3s=7f9e702d&x-expires=1750412091&x-signature=9QP8pePdU9yBsemF%2ByLIaUoY73g%3D",
      crystals: [
        {
          name: "绿东陵",
          element: "木",
          effect: "招财旺运",
          color: "#000000",
          image: "https://p26-aiop-sign.byteimg.com/tos-cn-i-vuqhorh59i/20250619173439F930AD7D1A982EA90EC2-0~tplv-vuqhorh59i-image.image?rk3s=7f9e702d&x-expires=1750412091&x-signature=9QP8pePdU9yBsemF%2ByLIaUoY73g%3D",
        },

      ],
      qrCode: QR_CODE_IMAGE_URL,
    }
  );

  useEffect(() => {
    // 获取传入的图片URL参数
    const instance = Taro.getCurrentInstance();
    // const params = instance.router?.params;
    const params = {
      bracelet_name: "四季福缘",
      image_urls: [
        "https://p26-aiop-sign.byteimg.com/tos-cn-i-vuqhorh59i/20250619173439F930AD7D1A982EA90EC2-0~tplv-vuqhorh59i-image.image?rk3s=7f9e702d&x-expires=1750412091&x-signature=9QP8pePdU9yBsemF%2ByLIaUoY73g%3D",
      ],
      designId: "design-1234567890",
      bead_ids_deduplication: [
        {
          color: "绿色",
          english: "Green Aventurine",
          function: "招财旺运",
          id: "59",
          image_url:
            "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%BB%BF%E4%B8%9C%E9%99%B5.png",
          name: "绿东陵",
          wuxing: "木",
        },
        {
          color: "浅黄色",
          english: "Citrine",
          function: "聚财纳福",
          id: "38",
          image_url:
            "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%BB%84%E6%B0%B4%E6%99%B6.png",
          name: "黄水晶",
          wuxing: "土",
        },
      ],
      recommendation_text:
        "这款四季福缘手串精选绿东陵与黄水晶为主珠，配以白水晶与海蓝宝，象征春夏秋冬四季轮回。绿东陵带来生机与财运，黄水晶招财聚福，白水晶净化心灵，海蓝宝守护平安。佩戴此串，四季平安，福缘深厚。",
    };
    setImageUrl(params.image_urls[0]);
    setBraceletName(params.bracelet_name);
    setBraceletDescription(params.recommendation_text);
    setBeadDescriptions(params.bead_ids_deduplication);
    // if (params?.designId) {
    //   const result = designData.find((item: any) => item.design_id === params.designId);
    //   const { image_urls, bracelet_name, recommendation_text, bead_ids_deduplication } = result;
    //   console.log(image_urls[0],decodeURIComponent(image_urls[0]), "images_url");
    //   setImageUrl(image_urls[0]);
    //   setBraceletName(bracelet_name);
    //   setBraceletDescription(recommendation_text);
    //   setBeadDescriptions(bead_ids_deduplication);
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
        title: "暂无图片",
        icon: "none",
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
        <View className="result-content-bg-image">
          <Image
            src="https://zhuluoji.cn-sh2.ufileos.com/images-frontend/crystal-image.png"
            mode="widthFix"
            style={{ width: "100%" }}
          />
        </View>
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
              <View className="result-content-card-text-title">
                {braceletName}
              </View>
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
                        <View>{`${item.name}「${item.wuxing}」`}</View>
                      </View>
                      <View className="bead-description">{item.function}</View>
                    </View>
                  ))}
              </View>
              <View className="bead-share-rccode">
                <Image
                  src={QR_CODE_IMAGE_URL}
                  mode="widthFix"
                  style={{ width: "62px", height: "62px" }}
                />
                <View className="bead-share-rccode-text">开启专属定制</View>
              </View>
            </View>
          </View>
        </View>
      </View>
      {shareImageUrl && <Image src={shareImageUrl} mode="widthFix" style={{ width: "100%" }} />}
      <View className="result-content-card-action">
        <CrystalButton onClick={saveImage} text="保存图片" />
        <CrystalButton
          onClick={shareImage}
          text="分享好友"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

export default Result;
