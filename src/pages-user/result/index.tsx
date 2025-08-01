import { View, Image, Text, Button } from "@tarojs/components";
import { useEffect, useMemo, useState, useRef } from "react";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import expendImage from "@/assets/icons/expend.svg";
import CrystalButton from "@/components/CrystalButton";
import {
  CRYSTALS_BG_IMAGE_URL,
  LOGO_IMAGE_URL,
  APP_QRCODE_IMAGE_URL,
  DESIGN_PLACEHOLDER_IMAGE_URL,
} from "@/config";
import { useDesign } from "@/store/DesignContext";
import shareDesignImage from "@/assets/icons/share-design.svg";
// import PosterGenerator from "@/components/PosterGenerator";
import BudgetDialog from "@/components/BudgetDialog";
import { OrderStatus } from "@/utils/orderUtils";
import OrderListComp from "@/components/OrderListComp";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import { computeBraceletLength } from "@/utils/cystal-tools";
import BraceletDetailDialog from "@/components/BraceletDetailDialog";
import WuxingDisplay from "@/components/WuxingDisplay";
import WearTipsSvg from "@/assets/icons/wear-tips.svg";
import BeadList from "@/components/BeadList";
import MaterialSvg from "@/assets/icons/material.svg";
import createBeadImage from "@/assets/icons/create-bead.svg";

const Result = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();
  const [braceletName, setBraceletName] = useState("");
  const [braceletDescription, setBraceletDescription] = useState("");
  const { designData } = useDesign();
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [beadDescriptions, setBeadDescriptions] = useState<any[]>([]);
  const [designNo, setDesignNo] = useState("");
  const [beadsInfo, setBeadsInfo] = useState<any[]>([]);
  const [rizhuInfo, setRizhuInfo] = useState<any[]>("");
  const [wuxingInfo, setWuxingInfo] = useState<any[]>([]);
  const [budgetDialogShow, setBudgetDialogShow] = useState(false);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [braceletDetailDialogShow, setBraceletDetailDialogShow] =
    useState(false);
  const autoShareRef = useRef(false);
  const instance = Taro.getCurrentInstance();
  const params = instance.router?.params;
  const { sessionId, from } = params || {};

  const posterData = useMemo(() => {
    return {
      title: braceletName,
      description: braceletDescription,
      crystals: beadDescriptions,
      qrCode: APP_QRCODE_IMAGE_URL,
      mainImage: imageUrl,
      designNo: designNo,
    };
  }, [braceletName, braceletDescription, beadDescriptions, imageUrl, designNo]);

  const getOrderData = (orderUuid: string[]) => {
    api.userHistory.getOrderById(orderUuid).then((res) => {
      res.data.orders?.length > 0 && setOrderList(res.data.orders);
    });
  };

  const getDesignData = (designId: string) => {
    api.userHistory
      .getDesignById(parseInt(designId))
      .then((res) => {
        const { id, image_url, word_info, order_uuid, beads_info } =
          res?.data || {};
        if (order_uuid?.length > 0) {
          getOrderData(order_uuid);
        }
        setBeadsInfo(beads_info);
        const {
          bracelet_name,
          recommendation_text,
          bead_ids_deduplication,
          rizhu,
          wuxing,
        } = word_info;

        setImageUrl(image_url);
        setBraceletName(bracelet_name);
        setBeadDescriptions(bead_ids_deduplication);
        setDesignNo(id);
        setBraceletDescription(recommendation_text);
        setRizhuInfo(rizhu || wuxing?.[0]);
        setWuxingInfo(wuxing);
      })
      .catch((err) => {
        console.log(err, "err");
        Taro.showToast({
          title: "加载失败",
          icon: "none",
        });
      });
  };

  const initData = () => {
    // 获取传入的图片URL参数

    if (params?.designBackendId) {
      const imageUrl = params?.imageUrl || "";
      imageUrl && setImageUrl(decodeURIComponent(imageUrl));
      getDesignData(params?.designBackendId);
    }

    if (params?.designId) {
      const result = designData.find(
        (item: any) => item.design_id === params.designId
      );
      const {
        image_urls,
        bracelet_name,
        recommendation_text,
        bead_ids_deduplication,
        design_backend_id,
      } = result;

      setImageUrl(image_urls?.[0] || "");
      setBraceletName(bracelet_name || "");
      setBraceletDescription(recommendation_text || "");
      setBeadDescriptions(bead_ids_deduplication || []);
      setDesignNo(design_backend_id || "");
    }
  };

  useEffect(() => {
    initData();
  }, []);

  useDidShow(() => {
    initData();
  });

  usePullDownRefresh(() => {
    initData();
  });

  const predictedBraceletLength = useMemo(() => {
    return beadsInfo?.length > 0
      ? computeBraceletLength(beadsInfo, "bead_diameter")
      : 0;
  }, [beadsInfo]);

  // 保存图片到相册
  const saveImage = async () => {
    setLoading(true);
    Taro.showToast({
      title: "正在生成分享图...",
      icon: "none",
    });    
    try {
      const res = await Taro.request({
        url: "http://106.75.246.41:8000/api/generate-crystal-poster",
        method: "POST",
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          crystal_data: {
            design_id: designNo,
            bracelet_image: imageUrl,
            bracelet_name: braceletName,
            rizhu: rizhuInfo,
            wuxing: wuxingInfo,
            bracelet_description: braceletDescription,
            crystal_list: beadDescriptions?.map((item) => ({
              id: item.id,
              name: item.name,
              wuxing: item.wuxing,
              function: item.function,
              image_url: item.image_url,
            })),
          }
        }
      })
      console.log("请求成功，响应:", res);
      if (res.data.data) {
        // 检查相册权限
        const authSetting = await Taro.getSetting();
        const writePhotosAlbumAuth =
          authSetting.authSetting["scope.writePhotosAlbum"];

        if (writePhotosAlbumAuth === false) {
          // 权限被拒绝，引导用户到设置页面
          const res = await Taro.showModal({
            title: "提示",
            content: "需要相册权限才能保存图片，请在设置中开启权限",
            confirmText: "去设置",
            cancelText: "取消",
          });

          if (res.confirm) {
            await Taro.openSetting();
          }
          return;
        }

        if (writePhotosAlbumAuth === undefined) {
          // 首次申请权限
          try {
            await Taro.authorize({
              scope: "scope.writePhotosAlbum",
            });
          } catch (authError) {
            // 用户拒绝了权限
            const res = await Taro.showModal({
              title: "提示",
              content: "需要相册权限才能保存图片，请在设置中开启权限",
              confirmText: "去设置",
              cancelText: "取消",
            });

            if (res.confirm) {
              await Taro.openSetting();
            }
            return;
          }
        }

        Taro.showToast({
          title: "保存中",
          icon: "loading",
        });

        // 将base64转换为临时文件
        const base64Data = res.data.data;
        console.log('Base64 data length:', base64Data?.length);
        
        const tempFilePath = `${Taro.env.USER_DATA_PATH}/temp_poster_${Date.now()}.webp`;
        console.log(tempFilePath, "tempFilePath");
        await Taro.getFileSystemManager().writeFile({
          filePath: tempFilePath,
          data: base64Data,
          encoding: 'base64',
          success: () => {
            setShareImageUrl(tempFilePath);
            Taro.saveImageToPhotosAlbum({
              filePath: tempFilePath,
              success: () => {
                Taro.showToast({
                  title: "保存成功",
                  icon: "success",
                });
              },
              fail: (error) => {
                Taro.showToast({
                  title: "保存失败",
                  icon: "error",
                });
                console.log(error, "保存失败");
              }
            });
          },
          fail: (error) => {
            console.log("写入失败", error);
          }
        });
      }
    } catch (error) {
      // 检查是否是用户取消操作
      const errorMessage =
        typeof error === "object" && error !== null && "errMsg" in error
          ? (error as { errMsg: string }).errMsg
          : "";

      // 如果不是用户取消操作，则显示报错
      if (!errorMessage.includes("cancel")) {
        console.error(error, "error");
        Taro.showToast({
          title: "保存失败",
          icon: "error",
        });
      }
    }
    finally {
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
        "--bg-image": `url(${imageUrl || DESIGN_PLACEHOLDER_IMAGE_URL})`,
      }}
    >
      <AppHeader isWhite onBack={() => {
        console.log(from, "from");
        if (from === "chat") {
          Taro.redirectTo({
            url: pageUrls.chatDesign + "?session_id=" + sessionId,
          });
        } else {
          if (Taro.getCurrentPages().length > 1) {
            Taro.navigateBack();
          } else {
            Taro.redirectTo({
              url: pageUrls.userCenter,
            });
          }
        }
      }} />
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
            top: 0,
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
              <Image
                className="logo-image"
                src={LOGO_IMAGE_URL}
                mode="widthFix"
              />
            </View>
            <Image className="expend-image" src={expendImage} mode="widthFix" />
          </View>
          <View className="result-content-card-text-container">
            <View className="result-content-card-text">
              {designNo && (
                <View className="result-content-card-subtitle">{`设计编号：${designNo}`}</View>
              )}
              <View className="result-content-card-text-title-container">
                <View className="result-content-card-text-title">
                  {braceletName}
                </View>
                <View
                  className="bracelet-length-info-container"
                  onClick={() =>
                    beadsInfo?.length > 0 && setBraceletDetailDialogShow(true)
                  }
                >
                  {/* <View className="bracelet-length-info-count-container">
                    <View className="bracelet-length-info-count">
                      {beadsInfo?.length || 0}
                    </View>
                    <View className="bracelet-length-info-unit">颗</View>
                  </View> */}
                  {predictedBraceletLength > 0 && (
                    <View className="bracelet-length-info-size-container">
                      {/* <View>{`${predictedBraceletLength}～${
                        predictedBraceletLength + 0.5
                      } cm`}</View>
                      <View style={{ width: "1px", height: "12px", backgroundColor: "#1F1722", opacity: 0.7 }}></View> */}
                      <View>{"手串明细 >"}</View>
                    </View>
                  )}
                </View>
              </View>
              <View className="result-content-center-container">
                <View className="result-content-center-text">
                  <View className="result-content-bracelet-description">
                    {braceletDescription}
                  </View>
                  <View className="result-content-wear-tips">
                    <View className="result-content-wear-tips-title-container">
                      <Image
                        src={WearTipsSvg}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <Text className="result-content-wear-tips-title">
                        佩戴建议
                      </Text>
                    </View>
                    <View className="result-content-bracelet-description">
                      天然水晶佩戴一段时间后建议定期净化噢~可以用清水冲洗或在月光下放置一晚，以保持水晶的能量纯净和光泽度。
                    </View>
                  </View>
                </View>
                <View className="result-content-wuxing-display-container">
                  <WuxingDisplay
                    element={{
                      type: rizhuInfo,
                      description: `五行属性喜${wuxingInfo?.join("、")}`,
                    }}
                  />
                </View>
              </View>
              <View className="result-content-wear-tips">
                <View className="result-content-wear-tips-title-container">
                  <Image
                    src={MaterialSvg}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <Text className="result-content-wear-tips-title">
                    水晶材料
                  </Text>
                </View>
                <BeadList
                  beads={beadDescriptions}
                  cardStyle={{ background: "#F9F9F9" }}
                />
              </View>
            </View>
          </View>

          {orderList?.length > 0 && (
            <View className="result-order-list-container">
              <View className="result-order-list-title">
                {`相关订单（${orderList.length}）`}
              </View>
              <OrderListComp
                orders={orderList.map((item) => ({
                  id: item.order_uuid,
                  orderNumber: item.order_uuid,
                  status: item.order_status,
                  merchantName: item.merchant_info?.name,
                  createTime: item.created_at,
                  budget: item.price,
                }))}
                showActions={false}
                showImage={false}
                onItemClick={(item) => {
                  if (
                    [
                      OrderStatus.PendingDispatch,
                      OrderStatus.Dispatching,
                    ].includes(item.status)
                  ) {
                    Taro.navigateTo({
                      url: `${pageUrls.orderDispatching}?orderId=${item.id}`,
                    });
                  } else {
                    Taro.navigateTo({
                      url: `${pageUrls.orderDetail}?orderId=${item.id}`,
                    });
                  }
                }}
              />
            </View>
          )}
        </View>
      </View>
      <View className="result-content-card-action">
        <CrystalButton
          onClick={() => saveImage(shareImageUrl)}
          text="分享"
          style={{ marginTop: "20px", marginLeft: "24px" }}
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
          style={{ flex: 1, marginTop: "20px", marginRight: "24px" }}
          prefixIcon={
            <Image
              src={createBeadImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
      </View>
      {budgetDialogShow && (
        <BudgetDialog
          visible={budgetDialogShow}
          title={braceletName}
          designNumber={designNo}
          productImage={imageUrl}
          onClose={() => setBudgetDialogShow(false)}
        />
      )}
      {/* <PosterGenerator
        data={posterData}
        onGenerated={(url) => {
          setShareImageUrl(url);
          if (autoShareRef.current) {
            saveImage(url);
          }
        }}
        showPoster={false}
      /> */}
      {braceletDetailDialogShow && beadsInfo?.length > 0 && (
        <BraceletDetailDialog
          visible={braceletDetailDialogShow}
          beads={beadsInfo}
          title={braceletName}
          onClose={() => setBraceletDetailDialogShow(false)}
        />
      )}
    </View>
  );
};

export default Result;
