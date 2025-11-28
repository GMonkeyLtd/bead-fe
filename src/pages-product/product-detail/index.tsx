import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import { productApi, Product, userApi } from "@/utils/api";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import CrystalButton from "@/components/CrystalButton";
import BudgetDialog from "@/components/BudgetDialog";
import { pageUrls } from "@/config/page-urls";

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const { productId } = router.params || {};
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetDialogShow, setBudgetDialogShow] = useState(false);
  const { top: navBarTop } = getNavBarHeightAndTop();

  const getProductDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await productApi.getProductDetail(id, { showLoading: false });
      setProduct(res.data);
    } catch (error) {
      console.error("获取产品详情失败:", error);
      Taro.showToast({
        title: "获取详情失败",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      getProductDetail(productId);
    }
  }, [productId]);

  const onClickBuy = async () => {
    try {
      const userData = await userApi.getUserInfo();
      const { phone, wechat_id } = userData?.data || ({} as any);
      const default_contact = (userData?.data as any)?.default_contact;
      if (default_contact === 0 && !phone) {
        Taro.redirectTo({
          url: `${pageUrls.contactPreference}?productId=${productId}&from=product-detail`,
        });
        return;
      }
      if (default_contact === 1 && !wechat_id) {
        Taro.redirectTo({
          url: `${pageUrls.contactPreference}?productId=${productId}&from=product-detail`,
        });
        return;
      }
      setBudgetDialogShow(true);
    } catch (error) {
      console.error("获取用户信息失败:", error);
      setBudgetDialogShow(true);
    }
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

  if (!product) {
    return (
      <CrystalContainer showBack={true}>
        <View className={styles.errorContainer}>
          <Text className={styles.errorText}>产品不存在或已被删除</Text>
        </View>
      </CrystalContainer>
    );
  }

  return (
    <View
      className={styles.resultContainer}
      style={{
        height: "100vh",
        paddingTop: `-${navBarTop}px`,
        background: "#F5F1EF",
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
          <Swiper
            indicatorColor="rgba(255,255,255,0.6)"
            indicatorActiveColor="#fff"
            circular={true}
            indicatorDots={product.image_urls?.length > 1}
            autoplay={true}
            interval={4000}
            duration={500}
            style={{ height: "100vw" }}
          >
            {(product.image_urls || []).map((imageUrl, index) => (
              <SwiperItem key={`${imageUrl}-${index}`}>
                <Image
                  src={imageUrl}
                  className={styles.mainImage}
                  mode="aspectFill"
                  style={{ width: "100%", height: "100%" }}
                  onClick={() => {
                    Taro.previewImage({
                      urls: product.image_urls || [],
                      current: imageUrl,
                    });
                  }}
                />
              </SwiperItem>
            ))}
          </Swiper>
        </View>

        {/* 内容区域 */}
        <View className={styles.contentSection}>
          <View className={styles.sectionCardList}>
            <View className={styles.sectionCard}>
              {/* 价格区域 */}
              <View className={styles.priceSection}>
                <View className={styles.priceContainer}>
                  <Text className={styles.pricePrefix}>¥</Text>
                  <Text className={styles.currentPrice}>
                    {product.final_price}
                  </Text>
                  {product.reference_price &&
                    product.reference_price > product.final_price && (
                      <Text className={styles.originalPrice}>
                        {product.reference_price}
                      </Text>
                    )}
                </View>
              </View>

              {/* 标题区域 */}
              <View className={styles.titleSection}>
                <View className={styles.titleContainer}>
                  <Text className={styles.title}>{product.name}</Text>
                  {product.category && (
                    <Text className={styles.categoryText}>{product.category}</Text>
                  )}
                </View>
              </View>

              {/* 描述区域 */}
              {product.description && (
                <View className={styles.descriptionSection}>
                  <Text className={styles.description}>
                    {product.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className={styles.bottomBar}>
        {product?.final_price && (
          <CrystalButton
            onClick={onClickBuy}
            text="购买"
            style={{ flex: 1, margin: "24px 0 24px" }}
            isPrimary={true}
          />
        )}
      </View>

      {budgetDialogShow && product && (
        <BudgetDialog
          visible={budgetDialogShow}
          title={product.name}
          designNumber={product.product_id}
          productImage={product.image_urls?.[0]}
          onClose={() => setBudgetDialogShow(false)}
          referencePrice={product.final_price}
          originalPrice={product.reference_price}
          productId={product.product_id}
          isProduct={true}
        />
      )}
    </View>
  );
};

export default ProductDetailPage;

