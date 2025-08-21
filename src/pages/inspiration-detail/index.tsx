import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import LazyImage from "@/components/LazyImage";
import api, { inspirationApi, InspirationWord, userHistoryApi } from "@/utils/api";
import CollectIcon from "@/assets/icons/collect.svg";
import CollectedIcon from "@/assets/icons/collect-active.svg";
import CrystalButton from "@/components/CrystalButton";
import createBeadImage from "@/assets/icons/create-bead.svg";
import { getNavBarHeightAndTop, getSafeArea } from "@/utils/style-tools";
import BraceletDetailDialog from "@/components/BraceletDetailDialog";
import BeadList from "@/components/BeadList";
import apiSession from "@/utils/api-session";
import BudgetDialog from "@/components/BudgetDialog";
import apiPay from "@/utils/api-pay";
import { pageUrls } from "@/config/page-urls";

interface BeadInfo {
  id: string;
  name: string;
  element: string;
  effect: string;
  image: string;
  color: string;
}

interface InspirationDetail {
  work_id: string;
  title: string;
  number: string;
  description: string;
  cover_url: string;
  images: string[];
  likes_count: number;
  created_at: string;
  final_price: number;
  original_price: number;
  user: {
    user_id: string;
    nick_name: string;
    avatar_url: string;
  };
  beads: BeadInfo[];
}

const InspirationDetailPage: React.FC = () => {
  const router = useRouter();
  const { workId, designId } = router.params || {};
  const [designData, setDesignData] = useState<any>(null);
  const [braceletDetailDialogShow, setBraceletDetailDialogShow] = useState(false);
  const [budgetDialogShow, setBudgetDialogShow] = useState(false);
  const [detail, setDetail] = useState<InspirationWord | null>(null);
  const [loading, setLoading] = useState(true);
  const { height: navBarHeight } = getNavBarHeightAndTop();
  const getInspirationDetail = async (work_id) => {
    try {
      setLoading(true);
      inspirationApi.getInspirationData({ work_id }).then((res) => {
        console.log(res, "res?.data[0]");
        setDetail(res?.data?.works?.[0] as InspirationDetail);
      });
    } catch (error) {
      console.error("获取灵感详情失败:", error);
      Taro.showToast({
        title: "获取详情失败",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDesignData = async (designId: number) => {
    try {
      const res = await apiSession.getDesignItem(designId);
      console.log(res, "res");
      setDesignData(res.data);
    } catch (error) {
      console.error("获取设计数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getData = () => {
    if (workId) {
      getInspirationDetail(workId);
    }
    if (designId) {
      getDesignData(parseInt(designId));
    }
  }

  useEffect(() => {
    getData()
    if (workId) {
      inspirationApi.viewWorkDetail({ work_id: workId })
    }
  }, [workId, designId]);

  // const handleImageSwipe = (direction: "left" | "right") => {
  //   if (!detail?.images) return;

  //   if (direction === "left" && currentImageIndex < detail.images.length - 1) {
  //     setCurrentImageIndex(currentImageIndex + 1);
  //   } else if (direction === "right" && currentImageIndex > 0) {
  //     setCurrentImageIndex(currentImageIndex - 1);
  //   }
  // };

  // const handleUserClick = () => {
  //   if (!detail?.user) return;

  //   Taro.navigateTo({
  //     url: `/pages/user-profile/index?userId=${detail.user.user_id}`
  //   });
  // };

  const handleMakeSameStyle = () => {
    if (!detail) return;

    Taro.navigateTo({
      url: `/pages-design/custom-design/index?templateId=${detail.work_id}`,
    });
  };

  // 处理收藏点击
  const handleCollectClick = (e: any) => {
    e.stopPropagation();
    if (detail?.is_collect) {
      inspirationApi
        .cancelCollectInspiration({ work_id: detail.work_id })
        .then(() => {
          Taro.showToast({
            title: "取消收藏成功",
            icon: "success",
          });
          getData();
        })
        .catch((err) => {
          Taro.showToast({
            title: "取消收藏失败",
            icon: "none",
          });
        });
    } else {
      inspirationApi
        .collectInspiration({ work_id: detail.work_id })
        .then(() => {
          Taro.showToast({
            title: "收藏成功",
            icon: "success",
          });
          getData();
        })
        .catch((err) => {
          Taro.showToast({
            title: "收藏失败",
            icon: "none",
          });
        });
    }
  };


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `发布于${date.getMonth() + 1}月${date.getDate()}日`;
  };
  if (loading) {
    return (
      <CrystalContainer showBack={true}>
        <View className={styles.loadingContainer}>
          <View className={styles.loadingSpinner} />
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </CrystalContainer>
    );
  }

  if (!detail) {
    return (
      <CrystalContainer showBack={true}>
        <View className={styles.errorContainer}>
          <Text className={styles.errorText}>内容不存在或已被删除</Text>
        </View>
      </CrystalContainer>
    );
  }

  const handlePurchase = () => {
    apiPay.buySameProduct({ word_id: detail.work_id }).then((res) => {
      const { order_uuid } = res?.data || {};
        Taro.getSetting({ 
          success: (res) => {
            console.log(res, 'res')
          }
        })
        Taro.requestSubscribeMessage({
          tmplIds: ["KoXRoTjwgniOQfSF9WN7h-hT_mw-AYRDhwyG_9cMTgI"], // 最多3个
          entityIds: [order_uuid], // 添加必需的 entityIds 参数
          complete: () => {
            Taro.redirectTo({
              url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
            })
          },
          success: () => {
            Taro.redirectTo({
              url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
            })
          },
          fail: () => Taro.redirectTo({
            url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
          })
        });
    })
  }


  return (
    <CrystalContainer showBack={true} showHome={false}>
      <ScrollView
        className={styles.container}
        scrollY
        style={{
          height: `calc(100vh - ${navBarHeight + 154}px)`,
        }}
      >
        {/* 主图片区域 */}
        <View className={styles.imageSection}>
          <Image
            src={detail.cover_url}
            className={styles.mainImage}
            mode="aspectFill"
          />

          {/* 图片指示器 */}
          {/* {detail.images && detail.images.length > 1 && (
            <View className={styles.imageIndicator}>
              {detail.images.map((_, index) => (
                <View
                  key={index}
                  className={`${styles.indicatorDot} ${
                    index === currentImageIndex ? styles.active : ''
                  }`}
                />
              ))}
            </View>
          )} */}

          {/* 图片切换按钮 */}
          {/* {detail.images && detail.images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <View 
                  className={`${styles.navButton} ${styles.prevButton}`}
                  onClick={() => handleImageSwipe('right')}
                >
                  <Text className={styles.navButtonText}>‹</Text>
                </View>
              )}
              {currentImageIndex < detail.images.length - 1 && (
                <View 
                  className={`${styles.navButton} ${styles.nextButton}`}
                  onClick={() => handleImageSwipe('left')}
                >
                  <Text className={styles.navButtonText}>›</Text>
                </View>
              )}
            </>
          )} */}
        </View>

        {/* 内容区域 */}
        <View className={styles.contentSection}>
          {/* 标题区域 */}
          <View className={styles.titleSection}>
            <View className={styles.titleContainer}>
              <Text className={styles.title}>
                {designData?.info?.name}
              </Text>
              <Text
                className={styles.workNumber}
              >{`NO.${designData?.design_id}`}</Text>
            </View>
            <View className={styles.likeContainer} onClick={handleCollectClick}>
              <Image
                src={detail?.is_collect ? CollectedIcon : CollectIcon}
                className={styles.collectIcon}
                mode="aspectFill"
              />
              <Text className={styles.likeCount}>{detail?.collects_count}</Text>
            </View>
          </View>

          {/* 正文区域 */}
          <View className={styles.descriptionSection}>
            <Text className={styles.description}>
              {designData?.info?.description}
            </Text>
            {/* 珠子信息区域 */}
            <BeadList
              beads={designData?.info?.recommend_beads?.filter((item) => !!item.func_summary)}
            />
            {/* 作者和时间 */}
            <View className={styles.workDetailContainer}>
              <View className={styles.authorTimeSection}>
                <View className={styles.authorContainer}>
                  <Image
                    src={detail.user.avatar_url}
                    className={styles.authorAvatar}
                    mode="aspectFill"
                  />
                  <Text className={styles.authorName}>
                    {detail.user.nick_name}
                  </Text>
                </View>
                <View className={styles.divider} />
                <Text className={styles.publishTime}>
                  {formatTime(detail.created_at)}
                </Text>
              </View>
              <View className={styles.detailActionContainer} onClick={() => setBraceletDetailDialogShow(true)}>手串明细 &gt;</View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className={styles.bottomBar}>
        {/* <View className={styles.separator} /> */}
        {designData?.session_id && designData?.reference_price && (<CrystalButton
          onClick={() => {
            setBudgetDialogShow(true)
          }}
          text="制作同款"
          icon={
            <Image
              src={createBeadImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
          style={{ width: "220px", margin: "24px 0 24px", }}
          isPrimary={true}
        />)}
      </View>
      {budgetDialogShow && (
        <BudgetDialog
          visible={budgetDialogShow}
          title={designData?.info?.name}
          designNumber={designData?.design_id}
          productImage={detail.cover_url}
          onClose={() => setBudgetDialogShow(false)}
          referencePrice={detail?.final_price}
          originalPrice={detail?.original_price}
          // onModifyDesign={handleModifyDesign}
          isSameProduct={true}
          creatorName={detail.user.nick_name}
          onConfirm={handlePurchase}
        />
      )}
      {braceletDetailDialogShow && designData?.info?.beads?.length > 0 && (
        <BraceletDetailDialog
          visible={braceletDetailDialogShow}
          beads={designData?.info?.beads}
          title={designData?.info?.name}
          onClose={() => setBraceletDetailDialogShow(false)}
          wristSize={designData?.info?.spec?.wrist_size}
        />
      )}
       {budgetDialogShow && (
        <BudgetDialog
          visible={budgetDialogShow}
          title={designData?.info?.name}
          designNumber={designData?.design_id}
          productImage={detail.cover_url}
          onClose={() => setBudgetDialogShow(false)}
          referencePrice={designData?.reference_price}
          // onModifyDesign={handleModifyDesign}
          isSameProduct
        />
      )}
    </CrystalContainer>
  );
};

export default InspirationDetailPage;
