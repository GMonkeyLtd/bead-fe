import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Button,
  SwiperItem,
  Swiper,
} from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import LazyImage from "@/components/LazyImage";
import api, {
  inspirationApi,
  InspirationWord,
  userApi,
  userHistoryApi,
} from "@/utils/api";
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
import { getDeduplicateBeads } from "@/utils/utils";
import { InspirationItem } from "../inspiration";
import editInspirationSvg from "@/assets/icons/edit-inspiration.svg";
import PromoBanner from "@/components/PromoBanner";
import MaterialSvg from "@/assets/icons/material.svg";
import AppHeader from "@/components/AppHeader";
import { SWIPER_DATA } from "@/config/home-content";

const InspirationDetailPage: React.FC = () => {
  const router = useRouter();
  const { workId, designId, showBudgetDialog } = router.params || {};
  const [designData, setDesignData] = useState<any>(null);
  const [braceletDetailDialogShow, setBraceletDetailDialogShow] =
    useState(false);
  const [budgetDialogShow, setBudgetDialogShow] = useState(
    showBudgetDialog == "true" || false
  );
  const [detail, setDetail] = useState<InspirationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { height: navBarHeight, top: navBarTop } = getNavBarHeightAndTop();
  const [isOnSale, setIsOnSale] = useState(true);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      callback();
    }, delay);
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  const deduplicateBeads = useMemo(() => {
    // 按spu_id对designData?.info?.items进行去重
    const beads = designData?.info?.items || [];
    return getDeduplicateBeads(beads, "spu_id")?.filter(
      (item) => !!item.func_summary
    );
  }, [designData]);

  const getInspirationDetail = async (work_id) => {
    try {
      setLoading(true);
      inspirationApi
        .getInspirationData({ work_id }, { showLoading: false })
        .then((res) => {
          console.log(res, "res?.data[0]");
          setDetail(res?.data?.works?.[0] as InspirationItem);
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
      const res = await apiSession.getDesignItem(designId, {
        showLoading: false,
      });
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
  };

  useEffect(() => {
    getData();
    if (workId) {
      inspirationApi.viewWorkDetail(
        { work_id: workId },
        { showLoading: false }
      );
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
        .cancelCollectInspiration(
          { work_id: detail.work_id },
          { showLoading: false }
        )
        .then(() => {
          safeSetTimeout(() => {
            Taro.showToast({
              title: "取消收藏成功",
              icon: "success",
            });
          }, 200);
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
        .collectInspiration({ work_id: detail.work_id }, { showLoading: false })
        .then(() => {
          safeSetTimeout(() => {
            Taro.showToast({
              title: "收藏成功，已收藏作品可到收藏集中查看。",
              icon: "none",
            });
          }, 200);
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

  const handleEditInspiration = () => {
    Taro.reportEvent("inspiration_event", {
      edit_inspiration_design: 1,
    });
    Taro.redirectTo({
      url: `${pageUrls.customDesign}?designId=${designData?.design_id}&from=inspiration&workId=${detail.work_id}`,
    });
  };

  const onClickBuySame = async () => {
    Taro.reportEvent("inspiration_event", {
      get_same_product: 1,
    });
    const userData = await userApi.getUserInfo();
    const { default_contact, phone, wechat_id } = userData?.data || ({} as any);
    if (default_contact === 0 && !phone) {
      Taro.redirectTo({
        url: `${pageUrls.contactPreference}?designId=${designData?.design_id}&workId=${detail.work_id}&from=inspiration-detail`,
      });
      return;
    }
    if (default_contact === 1 && !wechat_id) {
      Taro.redirectTo({
        url: `${pageUrls.contactPreference}?designId=${designData?.design_id}&workId=${detail.work_id}&from=inspiration-detail`,
      });
      return;
    }
    setBudgetDialogShow(true);
  };

  return (
    <View
      className={styles.resultContainer}
      style={{
        height: "100vh",
        paddingTop: `-${navBarTop}px`,
        background: "#F5F1EF",
        // "--bg-image": `url(${imageUrl || DESIGN_PLACEHOLDER_IMAGE_URL})`,
      }}
    >
      <AppHeader
        extraContent={null}
        isWhite
        onBack={() => {
          Taro.navigateBack();
        }}
      />
      <ScrollView
        className={styles.container}
        scrollY
        style={{
          height: `calc(100vh - ${72}px)`,
        }}
      >
        {/* 主图片区域 */}
        <View className={styles.imageSection}>
          {/* <Image
            src={detail.cover_url}
            className={styles.mainImage}
            mode="widthFix"
            onClick={() => {
              if (!detail) return;
              Taro.previewImage({
                urls: [detail.cover_url],
              });
            }}
          /> */}
          <Swiper
            // className={styles.imageSwiper}
            indicatorColor="rgba(255,255,255,0.6)"
            indicatorActiveColor="#fff"
            circular={true}
            indicatorDots={true}
            autoplay={true}
            interval={4000}
            duration={500}
            style={{ height: '100vw' }}
          >
            {[detail?.cover_url, ...(detail?.real_images || [])].map(
              (item, index) => (
                <SwiperItem key={`${item}-${index}`}>
                  <Image
                    src={item}
                    className={styles.mainImage}
                    mode="aspectFill"
                    // mode="widthFix"
                    // mode="aspectFit"
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => {
                      Taro.previewImage({
                        urls: [item],
                      });
                    }}
                  />
                </SwiperItem>
              )
            )}
          </Swiper>
          {isOnSale && (
            <View className={styles.promoBannerContainer}>
              <PromoBanner
                currentPrice={detail.final_price}
                originalPrice={detail.original_price}
                promoText="同款制作，尽享折扣"
                discountText=""
                salesCount="120"
                onClick={undefined}
              />
            </View>
          )}
        </View>
        {/* 内容区域 */}
        <View className={styles.contentSection}>
          <View className={styles.sectionCardList}>
            <View className={styles.sectionCard}>
              {!isOnSale && (
                <View className={styles.priceSection}>
                  <View className={styles.priceContainer}>
                    <Text className={styles.pricePrefix}>¥</Text>
                    <Text className={styles.currentPrice}>
                      {detail.final_price}
                    </Text>
                    <Text className={styles.originalPrice}>
                      {detail.original_price}
                    </Text>
                  </View>
                </View>
              )}
              {/* 标题区域 */}
              <View className={styles.titleSection}>
                <View className={styles.titleContainer}>
                  <Text className={styles.title}>{designData?.info?.name}</Text>
                  <Text
                    className={styles.workNumber}
                  >{`NO.${designData?.design_id}`}</Text>
                </View>
                <View
                  className={styles.likeContainer}
                  onClick={handleCollectClick}
                >
                  <Image
                    src={detail?.is_collect ? CollectedIcon : CollectIcon}
                    className={styles.collectIcon}
                    mode="aspectFill"
                  />
                  <Text className={styles.likeCount}>
                    {detail?.collects_count}
                  </Text>
                </View>
              </View>

              {/* 正文区域 */}
              <View className={styles.descriptionSection}>
                <Text className={styles.description}>
                  {designData?.info?.description}
                </Text>
              </View>
            </View>
            <View className={styles.sectionCard}>
              <View className={styles.beadListSection}>
                <View className={styles.crystalMaterialTitleContainer}>
                  <Image
                    src={MaterialSvg}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <Text className={styles.crystalMaterialTitle}>水晶材料</Text>
                </View>
                {/* 珠子信息区域 */}
                <BeadList beads={deduplicateBeads} />
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
                  <View
                    className={styles.detailActionContainer}
                    onClick={() => setBraceletDetailDialogShow(true)}
                  >
                    手串明细 &gt;
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className={styles.bottomBar}>
        <View
          className={styles.editorContainer}
          onClick={handleEditInspiration}
        >
          <Image
            src={editInspirationSvg}
            mode="widthFix"
            style={{ width: "20px", height: "20px" }}
          />
          <View className={styles.editorText}>编辑</View>
        </View>
        {detail?.final_price && (
          <CrystalButton
            onClick={() => {
              Taro.reportEvent("inspiration_event", {
                get_same_product: 1,
              });
              setBudgetDialogShow(true);
            }}
            text={
              detail.final_price
                ? `¥${detail.final_price} 制作同款`
                : "制作同款"
            }
            icon={
              detail.final_price ? undefined : (
                <Image
                  src={createBeadImage}
                  mode="widthFix"
                  style={{ width: "24px", height: "24px" }}
                />
              )
            }
            style={{ flex: 1, margin: "24px 0 24px" }}
            isPrimary={true}
          />
        )}
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
          workId={detail.work_id}
          isSameProduct={true}
          creatorName={detail.user.nick_name}
        />
      )}
      {braceletDetailDialogShow && designData?.info?.items?.length > 0 && (
        <BraceletDetailDialog
          visible={braceletDetailDialogShow}
          beads={designData?.info?.items}
          title={designData?.info?.name}
          onClose={() => setBraceletDetailDialogShow(false)}
          wristSize={designData?.info?.spec?.wrist_size}
        />
      )}
    </View>
  );
};

export default InspirationDetailPage;
