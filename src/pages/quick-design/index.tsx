import { View, Image } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import { generateApi } from "@/utils/api";
import AppHeader from "@/components/AppHeader";
import { imageToBase64 } from "@/utils/imageUtils";
import { useDesign } from "@/store/DesignContext";
import { DESIGNING_IMAGE_URL } from "@/config";
import { generateUUID } from '@/utils/uuid'

const QuickDesign = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [designing, setDesigning] = useState(true);
  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender, imageUrl: imageUrlParam, isLunar } = params || {};

  const { addDesignData } = useDesign();

  useEffect(() => {
    if (imageUrlParam) {
      const decodedUrl = decodeURIComponent(imageUrlParam);
      quickDesignByImage(decodedUrl);
      // processDesignData({
      //   images_url: [decodedUrl],
      //   bracelet_name: "夏日睡莲",
      //   recommendation_text: "一段话描述这款手串的，一段话描述这款手串的整体能量和祝福。",
      //   bead_ids_deduplication: [
      //     {
      //       image_url:
      //         "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%9D%92%E9%87%91%E7%9F%B3.png",
      //       name: "绿松石",
      //       description: "一段话描",
      //     },
      //     {
      //       image_url:
      //         "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%93%9D%E5%AE%9D.png",
      //       name: "蓝水晶",
      //       description: "量和祝福。",
      //     },
      //   ],
      //   design_id: generateUUID(),
      // })
      return;
    }
    quickDesignByInfo(year, month, day, hour, gender, isLunar === "true" ? true : false);
  }, []);

  const processDesignData = (data) => {
    const uniqueId = generateUUID();
    const { images_url, bracelet_name, recommendation_text, bead_ids_deduplication } = data;
    addDesignData({
      images_url,
      bracelet_name,
      recommendation_text,
      bead_ids_deduplication,
      design_id: uniqueId,
    })
    Taro.navigateTo({
      url: "/pages/result/index?imageUrl=" + encodeURIComponent(images_url[0]) + "&designId=" + uniqueId,
    })
  }

  const quickDesignByInfo = (year, month, day, hour, gender, isLunar: boolean) => {
    if (!year || !month || !day || !hour || !gender) {
      return;
    }
    setDesigning(true);
    generateApi
    .quickGenerate({
      birth_year: parseInt(year || "0"),
      birth_month: parseInt(month || "0"),
      birth_day: parseInt(day || "0"),
      birth_hour: parseInt(hour || "0"),
      is_lunar: isLunar,
      sex: parseInt(gender || "0"),
    })
    .then((res) => {
      const imageUrl = res.data.images_url?.[0];
      if (!imageUrl) {
        Taro.showToast({
          title: '生成失败',
          icon: 'none',
        })
        Taro.switchTab({
          url: "/pages/home/index",
        })
        return;
      }
      console.log(res, "res");
      processDesignData(res);
    })
    .catch((err) => {
      Taro.showToast({
        title: '生成失败',
        icon: 'none',
      })
      Taro.switchTab({
        url: "/pages/home/index",
      })
    })
    .finally(() => {
      setDesigning(false);
    });
  };

  const quickDesignByImage = async(imageUrl) => {
    setDesigning(true);
    try {
    const base64 = await imageToBase64(imageUrl, false);
     const res = await generateApi.personalizedGenerateByImage({
        image_base64: [base64 as string],
      })
      console.log(res, "res");
      const _imageUrl = res.data.image_urls?.[0];
      if (!_imageUrl) {
        throw new Error('生成失败');
      }
      // processDesignData(res.data)
      console.log(res, "res");
      // processDesignData(res);
      processDesignData({
        images_url: [_imageUrl],
        bracelet_name: "夏日睡莲",
        recommendation_text: "一段话描述这款手串的，一段话描述这款手串的整体能量和祝福。",
        bead_ids_deduplication: [
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
        ],
        design_id: generateUUID(),
      });
    } catch (err) {
      Taro.showToast({
        title: '生成失败',
        icon: 'none',
      })
      Taro.switchTab({
        url: "/pages/home/index",
      })
    } finally {
      setDesigning(false);
    }
  };

  return (
    <View className="crystal-common-container">
      <AppHeader isWhite={false} />
        {designing ? (
          <View className="quick-design-container">
              <View className="quick-design-loading">
                <Image src={DESIGNING_IMAGE_URL} className="quick-design-loading-image" />
                <View className="quick-design-loading-title">
                  制作中
                  <View className="quick-design-loading-title-dot">
                    <View className="quick-design-loading-title-dot-item">...</View>
                  </View>
                </View>
                <View className="quick-design-loading-content">TIPS: 金生水、水生木、木生火、火生土、土生金。</View>
              </View>
          </View>
        ) : null}
    </View>
  );
};

export default QuickDesign;
