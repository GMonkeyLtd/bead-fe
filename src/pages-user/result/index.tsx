import { View, Image, Text, Button } from "@tarojs/components";
import { useEffect, useMemo, useState, useRef } from "react";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import styles from "./index.module.scss";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import expendImage from "@/assets/icons/expend.svg";
import CrystalButton from "@/components/CrystalButton";
import {
  CRYSTALS_BG_IMAGE_URL,
  LOGO_IMAGE_URL,
  DESIGN_PLACEHOLDER_IMAGE_URL,
  GENERATING_GIF_URL,
} from "@/config";
import shareDesignImage from "@/assets/icons/share-design.svg";
import PosterGenerator from "@/components/PosterGenerator";
import BudgetDialog from "@/components/BudgetDialog";
import OrderListComp from "@/components/OrderListComp";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import BraceletDetailDialog from "@/components/BraceletDetailDialog";
import WuxingDisplay from "@/components/WuxingDisplay";
import WearTipsSvg from "@/assets/icons/wear-tips.svg";
import BeadList from "@/components/BeadList";
import MaterialSvg from "@/assets/icons/material.svg";
import createBeadImage from "@/assets/icons/create-bead.svg";
import apiSession from "@/utils/api-session";
import { usePollDesign } from "@/hooks/usePollDesign";
import { getDeduplicateBeads } from "@/utils/utils";

const Result = () => {
  const instance = Taro.getCurrentInstance();
  const params = instance.router?.params;
  const { sessionId, from, originImageUrl: originImageUrlParam } = params || {};

  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();
  const [braceletName, setBraceletName] = useState("");
  const [braceletDescription, setBraceletDescription] = useState("");
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
  const [referencePrice, setReferencePrice] = useState<number>(0);
  const [designSessionId, setDesignSessionId] = useState<string>("");
  const [designDraftId, setDesignDraftId] = useState<string>("");
  const [braceletSpec, setBraceletSpec] = useState<any>({});
  const { design, getDesign } = usePollDesign({ pollingInterval: 5000 });
  
  const [originImageUrl, setOriginImageUrl] = useState<string>(originImageUrlParam ? decodeURIComponent(originImageUrlParam) : "");

  const getOrderData = (orderUuid: string[]) => {
    api.userHistory.getOrderById(orderUuid).then((res) => {
      res.data.orders?.length > 0 && setOrderList(res.data.orders);
    });
  };

  const canDiy = useMemo(() => {
    return beadsInfo?.length > 0 && beadsInfo?.every((item) => !!item.sku_id);
  }, [beadsInfo]);

  const processDesignData = (designData) => {
    const { design_id, image_url, info, reference_price, session_id, draft_id } =
      designData || {};
    const {
      name,
      description,
      rizhu,
      wuxing,
      spec
    } = info;
    const deduplicatedBeads = getDeduplicateBeads(info.items, 'spu_id');
    setBeadsInfo(info.items);
    setImageUrl(image_url);
    setBraceletName(name);
    setBeadDescriptions(deduplicatedBeads.filter((item) => !!item.func_summary));
    setDesignNo(design_id);
    setBraceletDescription(description);
    setRizhuInfo(rizhu || wuxing?.[0]);
    setWuxingInfo(wuxing);
    setReferencePrice(reference_price);
    setDesignSessionId(session_id);
    setDesignDraftId(draft_id);
    setBraceletSpec(spec);
  }

  useEffect(() => {
    if (design?.order_uuids?.length) {
      getOrderData(design.order_uuids);
    }
  }, [design?.design_id]);

  useEffect(() => {
    if (design?.design_id) {
      processDesignData(design);
    }
  }, [design]);

  const initData = () => {
    // 获取传入的图片URL参数
    if (params?.designBackendId) {
      const imageUrl = params?.imageUrl || "";
      imageUrl && setImageUrl(decodeURIComponent(imageUrl));
      getDesign({
        designId: params?.designBackendId,
      })
    }
  };

  useEffect(() => {
    if (designDraftId) {
      apiSession.getDesignDraft({ session_id: designSessionId, draft_id: designDraftId }).then((res) => {
        res.data.image_url && setOriginImageUrl(res.data.image_url);
      })
    }
  }, [designDraftId])

  useDidShow(() => {
    initData();
  });

  usePullDownRefresh(() => {
    initData();
  });

  // 保存图片到相册
  const saveImage = async () => {
    setLoading(true);
    Taro.showLoading({
      title: "正在生成分享图...",
      mask: true,
    });
    try {
      const res = await Taro.request({
        url: 'https://api.gmonkey.top/api/generate-share-poster',
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
              function: item.func_summary,
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
        Taro.hideLoading();
        Taro.showToast({
          title: "保存中",
          icon: "loading",
        });

        // 将base64转换为临时文件
        const base64Data = res.data.data;

        const tempFilePath = `${Taro.env.USER_DATA_PATH}/temp_poster_${Date.now()}.webp`;

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

  const handleModifyDesign = () => {
    Taro.redirectTo({
      url: `${pageUrls.customDesign}?designId=${designNo}&sessionId=${designSessionId}&draftId=${designDraftId}&from=result`,
    });
  };

  return (
    <View
      className={styles.resultContainer}
      style={{
        height: "100vh",
        paddingTop: `-${navBarTop}px`,
        "--bg-image": `url(${imageUrl || DESIGN_PLACEHOLDER_IMAGE_URL})`,
      }}
    >
      <AppHeader isWhite onBack={() => {
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
        className={styles.resultContentContainer}
        style={{
          position: "relative",
          paddingTop: `${navBarTop + navBarHeight + 20}px`,
          height: `calc(100vh - ${120}px)`,
          overflowY: "auto",
        }}
      >
        <View
          className={styles.resultContentBgImage}
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
        <View className={styles.resultContentCard}>
          <View
            className={styles.resultContentCardImage}
            onClick={viewImage}
            style={imageUrl ? { background: `url(${imageUrl}) center/cover` } : undefined}
          >
            {!imageUrl && (
              <View className={styles.originImageContainer}>
                <Image src={originImageUrl || DESIGN_PLACEHOLDER_IMAGE_URL} mode="heightFix" style={{ height: '70%' }} />
              </View>
            )}
            <View className={styles.logoImageContainer} onClick={viewImage}>
              <Image
                className={styles.logoImage}
                src={LOGO_IMAGE_URL}
                mode="widthFix"
                style={{ width: "48px", height: "23px" }}
              />
            </View>
            {!imageUrl ? (
              <View className={styles.generatingGifContainer}>
                <Image className={styles.generatingGif} src={GENERATING_GIF_URL} mode="widthFix" />
                <View className={styles.generatingGifText}>
                  场景设计...
                </View>
              </View>
            ) : (
              <Image className={styles.expendImage} src={expendImage} mode="widthFix" />
            )}
          </View>
          <View className={styles.resultContentCardTextContainer}>
            <View className={styles.resultContentCardText}>
              {designNo && (
                <View className={styles.resultContentCardSubtitle}>{`设计编号：${designNo}`}</View>
              )}
              <View className={styles.resultContentCardTextTitleContainer}>
                <View className={styles.resultContentCardTextTitle}>
                  {braceletName}
                </View>
                <View
                  className={styles.braceletLengthInfoContainer}
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
                  {braceletSpec?.wrist_size && (
                    <View className={styles.braceletLengthInfoSizeContainer}>
                      {/* <View>{`${predictedBraceletLength}～${
                          predictedBraceletLength + 0.5
                        } cm`}</View>
                        <View style={{ width: "1px", height: "12px", backgroundColor: "#1F1722", opacity: 0.7 }}></View> */}
                      <View>{"手串明细 >"}</View>
                    </View>
                  )}
                </View>
              </View>
              <View className={styles.resultContentCenterContainer}>
                <View className={styles.resultContentCenterText}>
                  <View className={styles.resultContentBraceletDescription}>
                    {braceletDescription}
                  </View>
                  <View className={styles.resultContentWearTips}>
                    <View className={styles.resultContentWearTipsTitleContainer}>
                      <Image
                        src={WearTipsSvg}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <Text className={styles.resultContentWearTipsTitle}>
                        佩戴建议
                      </Text>
                    </View>
                    <View className={styles.resultContentBraceletDescription}>
                      天然水晶佩戴一段时间后建议定期净化噢~可以用清水冲洗或在月光下放置一晚，以保持水晶的能量纯净和光泽度。
                    </View>
                  </View>
                </View>
                <View className={styles.resultContentWuxingDisplayContainer}>
                  <WuxingDisplay
                    element={{
                      type: rizhuInfo,
                      description: `五行属性喜${wuxingInfo?.join("、")}`,
                    }}
                  />
                </View>
              </View>
              <View className={styles.resultContentWearTips}>
                <View className={styles.resultContentWearTipsTitleContainer}>
                  <Image
                    src={MaterialSvg}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <Text className={styles.resultContentWearTipsTitle}>
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

        </View>
        {orderList?.length > 0 && (
          <View className={styles.resultOrderListContainer}>
            <View className={styles.resultOrderListTitle}>
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
                Taro.navigateTo({
                  url: `${pageUrls.orderDetail}?orderId=${item.id}`,
                });
              }}
            />
          </View>
        )}
      </View>
      <View className={styles.resultContentCardAction}>
        <CrystalButton
          onClick={() => saveImage()}
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
        {designSessionId && referencePrice && (<CrystalButton
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
        />)}
      </View>
      {budgetDialogShow && (
        <BudgetDialog
          visible={budgetDialogShow}
          title={braceletName}
          designNumber={designNo}
          productImage={imageUrl}
          onClose={() => setBudgetDialogShow(false)}
          referencePrice={referencePrice}
          onModifyDesign={canDiy ? handleModifyDesign : undefined}
        />
      )}
      <PosterGenerator  // 生成海报   
        data={{ braceletImage: originImageUrl }}
        onGenerated={(url) => {
          // setShareImageUrl(url);
          // if (autoShareRef.current) {
          //   saveImage(url);
          // }
        }}
        showPoster={true}
      />
      {braceletDetailDialogShow && beadsInfo?.length > 0 && (
        <BraceletDetailDialog
          visible={braceletDetailDialogShow}
          beads={beadsInfo}
          title={braceletName}
          onClose={() => setBraceletDetailDialogShow(false)}
          wristSize={braceletSpec?.wrist_size}
        />
      )}
    </View>
  );
};

export default Result;
