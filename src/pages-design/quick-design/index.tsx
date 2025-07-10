import { View, Image } from "@tarojs/components";
import { useState, useEffect, useRef } from "react";
import Taro, { useDidHide } from "@tarojs/taro";
import "./index.scss";
import { generateApi } from "@/utils/api";
import { imageToBase64 } from "@/utils/imageUtils";
import { useDesign } from "@/store/DesignContext";
import { DESIGNING_IMAGE_URL } from "@/config";
import { generateUUID } from "@/utils/uuid";
import { pageUrls } from "@/config/page-urls";
import PageContainer from "@/components/PageContainer";
import { CancelToken } from "@/utils/request";
import sessionApi from "@/utils/api-session";

const QuickDesign = () => {
  const [designing, setDesigning] = useState(true);
  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender, isLunar, beadDataId, draftId, imageUrl, sessionId } = params || {};
  const cancelTokenForImage = useRef<CancelToken>(null);
  const cancelTokenForInfo = useRef<CancelToken>(null);

  const { addDesignData, beadData } = useDesign();

  useDidHide(() => {
    if (cancelTokenForImage.current) {
      cancelTokenForImage.current.cancel('page hide')
    }
    if (cancelTokenForInfo.current) {
      cancelTokenForInfo.current.cancel('page hide')
    }
  })

  useEffect(() => {
    if (draftId && imageUrl) {
      quickDesignByDraft(sessionId, draftId, imageUrl);
    }
    if (beadDataId) {
      const _beadData = beadData.find(
        (item) => item.bead_data_id === beadDataId
      );
      quickDesignByImage(
        _beadData?.image_url,
        _beadData?.bead_list
      );
      return;
    }
    quickDesignByInfo(
      year,
      month,
      day,
      hour,
      gender,
      isLunar === "true" ? true : false
    );
  }, []);

  const processDesignData = (data) => {
    const uniqueId = generateUUID();
    const {
      image_urls,
      bracelet_name,
      recommendation_text,
      bead_ids_deduplication,
      design_id
    } = data;
    addDesignData({
      image_urls,
      bracelet_name,
      recommendation_text,
      bead_ids_deduplication,
      design_id: uniqueId,
      design_backend_id: design_id
    });
    Taro.redirectTo({
      url:
        pageUrls.result +
        "?imageUrl=" +
        encodeURIComponent(image_urls[0]) +
        "&designId=" +
        uniqueId,
    });
  };

  const quickDesignByInfo = (
    year,
    month,
    day,
    hour,
    gender,
    isLunar: boolean
  ) => {
    if (!year || !month || !day || !hour || !gender) {
      return;
    }
    setDesigning(true);
    cancelTokenForInfo.current = CancelToken.create();
    generateApi
      .quickGenerate({
        birth_year: parseInt(year || "0"),
        birth_month: parseInt(month || "0"),
        birth_day: parseInt(day || "0"),
        birth_hour: parseInt(hour || "0"),
        is_lunar: isLunar,
        sex: parseInt(gender || "0"),
      }, {
        cancelToken: cancelTokenForInfo.current
      })
      .then((res) => {
        if (!res?.images_url?.[0]) {
          throw new Error("生成失败");
        }
        processDesignData({ image_urls: res?.images_url });
      })
      .catch((err) => {
        Taro.showToast({
          title: "生成失败",
          icon: "none",
        });
        setTimeout(() => {
          Taro.redirectTo({
            url: pageUrls.home,
          });
        }, 3000);
        console.error(JSON.stringify(err));
      })
      .finally(() => {
        setDesigning(false);
      });
  };

  const quickDesignByImage = async (imageUrl, beadsData) => {
    setDesigning(true);
    try {
      const base64 = await imageToBase64(imageUrl, false);
      cancelTokenForImage.current = CancelToken.create();
      const res = await generateApi.personalizedGenerateByImage({
        bead_info: beadsData,
        image_base64: [base64 as string],
      }, {
        cancelToken: cancelTokenForImage.current
      });
      if (!res.data?.image_urls?.[0]) {
        throw new Error("生成失败");
      }
      Taro.redirectTo({
        url:
          pageUrls.result +
          "?imageUrl=" +
          encodeURIComponent(res.data?.image_urls?.[0]) +
          "&designBackendId=" +
          res.data?.design_id,
      });
    } catch (err) {
      console.error(err, "err");
      Taro.showToast({
        title: "生成失败",
        icon: "none",
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 3000)
    }
  };

  const pollDesignProgress = async (sessionId, draftId, designId) => {
    const res = await sessionApi.queryDesignProgress({
      session_id: sessionId,
      draft_id: draftId,
      design_id: designId,
    });
    if (res.data?.Progress === 100) {
      processDesignData({
        image_urls: [res.data?.ImageURL],
        bracelet_name: res.data?.Info?.Name,
        recommendation_text: res.data?.Info?.Description,
        bead_ids_deduplication: res.data?.Info?.RecommendBeads,
        design_id: res.data?.DesignId,
      });
    } else {
      setTimeout(() => {
        pollDesignProgress(sessionId, draftId, designId);
      }, 2000);
    }
  }

  const quickDesignByDraft = async (sessionId, draftId, imageUrl) => {
    const _imageUrl = decodeURIComponent(imageUrl);
    const base64 = await imageToBase64(_imageUrl, false);
    const res = await sessionApi.generateDesignByDraftImage({
      session_id: sessionId,
      draft_id: draftId,
      image_url: base64 as string,
    });
    if (res.data?.design_id) {
      pollDesignProgress(sessionId, draftId, res.data?.design_id);
    }
  }

  return (
    <PageContainer>
      {designing ? (
        <View className="quick-design-container">
          <View className="quick-design-loading">
            <Image
              src={DESIGNING_IMAGE_URL}
              className="quick-design-loading-image"
            />
            <View className="quick-design-loading-title">
              渲染中
              <View className="quick-design-loading-title-dot">
                <View className="quick-design-loading-title-dot-item">...</View>
              </View>
            </View>
            <View className="quick-design-loading-content">
              TIPS: 金生水、水生木、木生火、火生土、土生金。
            </View>
          </View>
        </View>
      ) : null}
    </PageContainer>
  );
};

export default QuickDesign;
