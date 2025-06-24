import { View, Button, Text, Image } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import logoSvg from "@/assets/icons/logo.svg";
import expendImage from "@/assets/icons/expend.svg";
import CrystalButton from "@/components/CrystalButton";
import { CRYSTALS_BG_IMAGE_URL, QR_CODE_IMAGE_URL } from "@/config";
import { useDesign } from "@/store/DesignContext";
import createBeadImage from "@/assets/icons/create-bead.svg";
import shareDesignImage from "@/assets/icons/share-design.svg";
import PosterGenerator from "@/components/PosterGenerator";
import BudgetDialog from "@/components/BudgetDialog";

const Result = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();
  const [braceletName, setBraceletName] = useState("");
  const [braceletDescription, setBraceletDescription] = useState("");
  const { designData } = useDesign();
  const [shareImageUrl, setShareImageUrl] = useState("");
  console.log(designData, "designData");
  const [beadDescriptions, setBeadDescriptions] = useState<any[]>([]);
  const [designNo, setDesignNo] = useState("000001");
  const [budgetDialogShow, setBudgetDialogShow] = useState(false);

  const posterData = useMemo(() => {
    return {
      title: braceletName,
      description: braceletDescription,
      crystals: beadDescriptions,
      qrCode: QR_CODE_IMAGE_URL,
      mainImage: imageUrl,
    };
  }, [braceletName, braceletDescription, beadDescriptions, imageUrl]);

  useEffect(() => {
    // 获取传入的图片URL参数
    const instance = Taro.getCurrentInstance();
    // const params = instance.router?.params;
    const params = {
      bracelet_name: "四季福缘",
      image_urls: [
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
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
    setDesignNo("00001");
    // if (params?.designId) {
    //   const result = designData.find(
    //     (item: any) => item.design_id === params.designId
    //   );
    //   const {
    //     image_urls,
    //     bracelet_name,
    //     recommendation_text,
    //     bead_ids_deduplication,
    //   } = result;
    //   console.log(
    //     image_urls[0],
    //     decodeURIComponent(image_urls[0]),
    //     "images_url"
    //   );
    //   setImageUrl(image_urls[0]);
    //   setBraceletName(bracelet_name);
    //   setBraceletDescription(recommendation_text);
    //   setBeadDescriptions(bead_ids_deduplication);
    // }
  }, []);

  // 保存图片到相册
  const saveImage = async () => {
    if (!shareImageUrl) {
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

      await Taro.saveImageToPhotosAlbum({
        filePath: shareImageUrl,
      });

      Taro.showToast({
        title: "保存成功",
        icon: "success",
      });
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
  const doCreate = () => {
    setBudgetDialogShow(true);
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
      <View
        className="result-content-container"
        style={{
          position: "relative",
          paddingTop: `${navBarTop + navBarHeight + 20}px`,
          height: `calc(100vh - ${120}px)`,
          overflowY: "auto",
        }}
      >
        <View
          className="result-content-bg-image"
          style={{
            top: `-${navBarTop + navBarHeight}px`,
          }}
        >
          <Image
            src={CRYSTALS_BG_IMAGE_URL}
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
              {designNo && (
                <View className="result-content-card-subtitle">{`设计编号：${designNo}`}</View>
              )}
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
              <View className="bead-share-qrcode">
                <Image
                  src={QR_CODE_IMAGE_URL}
                  mode="widthFix"
                  style={{ width: "62px", height: "62px" }}
                />
                <View className="bead-share-qrcode-text">开启专属定制</View>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View
        className="result-content-card-action"
      >
        <CrystalButton
          onClick={saveImage}
          text="分享"
          prefixIcon={
            <Image
              src={shareDesignImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
        <CrystalButton
          onClick={doCreate}
          isPrimary
          text="制作成品"
          style={{ flex: 1 }}
          prefixIcon={
            <Image
              src={createBeadImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
      </View>
      <BudgetDialog
        visible={budgetDialogShow}
        title={braceletName}
        designNumber={designNo}
        productImage={imageUrl}
        onConfirm={console.log}
        onClose={() => setBudgetDialogShow(false)}
      />
      <PosterGenerator data={posterData} onGenerated={setShareImageUrl} />
    </View>
  );
};

export default Result;
