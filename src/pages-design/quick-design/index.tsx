import { View, Video, Text } from "@tarojs/components";
import { useState, useEffect, useRef, useMemo } from "react";
import Taro, { useDidHide } from "@tarojs/taro";
import "./index.scss";
import { generateApi } from "@/utils/api";
import { imageToBase64 } from "@/utils/imageUtils";
import { useDesign } from "@/store/DesignContext";
import { GENERATING_MP4_IMAGE_URL, DESIGNING_IMAGE_URL } from "@/config";
import { generateUUID } from "@/utils/uuid";
import { pageUrls } from "@/config/page-urls";
import PageContainer from "@/components/PageContainer";
import { CancelToken } from "@/utils/request";
import sessionApi from "@/utils/api-session";

const predictedTimeText = (
  <View className="quick-design-loading-content">渲染过程预计等待 20s</View>
);

const progressTipText = (
  <View className="quick-design-loading-content">
    <View>当前高峰期，退出不影响进度</View>
    <View style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Text>稍后可以在</Text>
      <View className="quick-design-loading-content-link">我的作品</View>
      <Text>中查看</Text>
    </View>
  </View>
);

const QuickDesign = () => {
  const [designing, setDesigning] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const params = Taro.getCurrentInstance()?.router?.params;
  const {
    year,
    month,
    day,
    hour,
    gender,
    isLunar,
    beadDataId,
    draftId,
    imageUrl,
    sessionId,
  } = params || {};
  const cancelTokenForImage = useRef<CancelToken | null>(null);
  const cancelTokenForInfo = useRef<CancelToken | null>(null);
  const cancelPollDesignProgress = useRef<CancelToken | null>(null);
  const [progressTip, setProgressTip] = useState(predictedTimeText);
  const timeRef = useRef<any>(null);
  const pollTimeRef = useRef<any>(null);

  const { addDesignData, beadData } = useDesign();

  useDidHide(() => {
    if (cancelTokenForImage.current) {
      cancelTokenForImage.current.cancel("page hide");
    }
    if (cancelTokenForInfo.current) {
      cancelTokenForInfo.current.cancel("page hide");
    }

    if (cancelPollDesignProgress.current) {
      console.log("clear poll");
      cancelPollDesignProgress.current.cancel("page hide");
    }
    if (pollTimeRef.current) {
      clearTimeout(pollTimeRef.current);
    }
  });

  useEffect(() => {
    // 预加载视频
    const preloadVideo = () => {
      // 检查是否在H5环境
      if (typeof document !== 'undefined') {
        const video = document.createElement('video');
        video.src = GENERATING_MP4_IMAGE_URL;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.preload = 'auto';
        
        video.onloadeddata = () => {
          setVideoLoaded(true);
          setTimeout(() => {
            setShowVideo(true);
          }, 300);
        };
        
        video.onerror = () => {
          console.log('Video preload failed, using fallback');
          setVideoLoaded(false);
          setShowVideo(false);
        };
        
        // 开始加载
        video.load();
      } else {
        // 小程序环境，直接显示视频
        setTimeout(() => {
          setVideoLoaded(true);
          setTimeout(() => {
            setShowVideo(true);
          }, 500);
        }, 200);
      }
    };
    
    // 延迟预加载，避免阻塞主线程
    setTimeout(preloadVideo, 100);
    
    // 备用超时机制，防止永远不显示视频
    setTimeout(() => {
      if (!showVideo) {
        setVideoLoaded(true);
        setShowVideo(true);
      }
    }, 3000);
    
    timeRef.current = setTimeout(() => {
      setProgressTip(progressTipText);
    }, 10000);
    
    if (sessionId && draftId && imageUrl) {
      quickDesignByDraft(sessionId, draftId, imageUrl);
    }
    if (beadDataId) {
      const _beadData = beadData.find(
        (item) => item.bead_data_id === beadDataId
      );
      quickDesignByImage(_beadData?.image_url, _beadData?.bead_list);
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

    return () => {
      if (timeRef.current) {
        clearTimeout(timeRef.current);
      }
      if (pollTimeRef.current) {
        clearTimeout(pollTimeRef.current);
      }
      // 清理视频预加载状态
      setVideoLoaded(false);
      setShowVideo(false);
    };
  }, []);

  const processDesignData = (data) => {
    const uniqueId = generateUUID();
    const {
      image_urls,
      bracelet_name,
      recommendation_text,
      bead_ids_deduplication,
      design_id,
    } = data;
    addDesignData({
      image_urls,
      bracelet_name,
      recommendation_text,
      bead_ids_deduplication,
      design_id: uniqueId,
      design_backend_id: design_id,
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
      .quickGenerate(
        {
          birth_year: parseInt(year || "0"),
          birth_month: parseInt(month || "0"),
          birth_day: parseInt(day || "0"),
          birth_hour: parseInt(hour || "0"),
          is_lunar: isLunar,
          sex: parseInt(gender || "0"),
        },
        {
          cancelToken: cancelTokenForInfo.current,
        }
      )
      .then((res) => {
        if (!res?.images_url?.[0]) {
          throw new Error("生成失败");
        }
        processDesignData({ image_urls: res?.images_url });
      })
      .catch((err) => {
        console.log(err, "err");
        Taro.showToast({
          title: "服务繁忙，请稍后再试",
          icon: "none",
          duration: 3000,
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
      const res = await generateApi.personalizedGenerateByImage(
        {
          bead_info: beadsData,
          image_base64: [base64 as string],
        },
        {
          cancelToken: cancelTokenForImage.current,
        }
      );
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
      }, 3000);
    }
  };

  const pollDesignProgress = async (sessionId, draftId, designId) => {
    cancelPollDesignProgress.current = CancelToken.create();

    const res = await sessionApi.queryDesignProgress(
      {
        session_id: sessionId,
        draft_id: draftId,
        design_id: designId,
      },
      {
        cancelToken: cancelPollDesignProgress.current,
        showLoading: false,
      }
    );
    if (res.data?.progress === 100) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${res.data?.design_id}`,
      });
      // processDesignData({
      //   image_urls: [res.data?.image_url],
      //   bracelet_name: res.data?.Info?.Name,
      //   recommendation_text: res.data?.Info?.Description,
      //   bead_ids_deduplication: res.data?.Info?.RecommendBeads,
      //   design_id: res.data?.DesignId,
      // });
    } else {
      if (pollTimeRef.current) {
        clearTimeout(pollTimeRef.current);
      }
      pollTimeRef.current = setTimeout(() => {
        pollDesignProgress(sessionId, draftId, designId);
      }, 1000);
    }
  };

  const quickDesignByDraft = async (sessionId, draftId, imageUrl) => {
    // pollDesignProgress(sessionId, draftId, null);

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
  };

  return (
    <PageContainer style={{ background: "#F4F1EE" }} showBack={false}>
      {designing ? (
        <View className="quick-design-container">
          <View className="quick-design-loading">
            <View className="loading-container">
              {/* 占位符图片 */}
              <View 
                className={`loading-placeholder ${showVideo ? 'fade-out' : ''}`}
                style={{
                  background: `linear-gradient(135deg, #f5f2f0 0%, #e8e2dd 100%), url(${DESIGNING_IMAGE_URL})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  width: '136px',
                  height: '136px',
                  borderRadius: '8px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2
                }}
              />
              
              {/* 视频元素 */}
              <Video
                src={GENERATING_MP4_IMAGE_URL}
                autoplay
                loop
                muted
                controls={false}
                objectFit="cover"
                showPlayBtn={false}
                showCenterPlayBtn={false}
                showProgress={false}
                showFullscreenBtn={false}
                showMuteBtn={false}
                enableProgressGesture={false}
                enablePlayGesture={false}
                poster={DESIGNING_IMAGE_URL}
                className={`loading-video ${showVideo ? 'fade-in' : ''}`}
                onPlay={() => {
                  console.log('Video started playing');
                  if (!showVideo) {
                    setTimeout(() => {
                      setShowVideo(true);
                    }, 200);
                  }
                }}
                onTimeUpdate={() => {
                  if (!showVideo) {
                    setShowVideo(true);
                  }
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setVideoLoaded(false);
                  setShowVideo(false);
                }}
                style={{
                  width: "136px",
                  height: "136px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  boxShadow: "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: showVideo ? 3 : 1,
                  opacity: showVideo ? 1 : 0
                }}
              />
            </View>
            <View className="quick-design-loading-title">
              渲染中
              <View className="quick-design-loading-title-dot">
                <View className="quick-design-loading-title-dot-item">...</View>
              </View>
            </View>
            {progressTip}
          </View>
        </View>
      ) : null}
    </PageContainer>
  );
};

export default QuickDesign;
