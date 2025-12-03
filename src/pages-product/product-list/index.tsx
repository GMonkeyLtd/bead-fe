import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import TabBar from "@/components/TabBar";
import { productApi, Product } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import { usePageQuery } from "@/hooks/usePageQuery";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import { formatProductCategory } from "@/utils/utils";

const ProductListPage: React.FC = () => {
  const { height: navBarHeight } = getNavBarHeightAndTop();
  const {
    data: productList,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
  } = usePageQuery<Product>({
    listKey: "productList",
    initialPage: 1,
    pageSize: 20,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await productApi.getProductList(
        {
          page,
          page_size: pageSize,
        },
        { showLoading: true }
      );
      return {
        data: res.data.list,
        hasMore: res.data.list.length + (page - 1) * pageSize < res.data.total,
        total: res.data.total,
      };
    }, []),
    queryItem: useCallback(async (item: Product) => {
      const res = await productApi.getProductDetail(item.id);
      return res.data;
    }, []),
    selector: "#product-more-tag",
  });

  // 页面显示时刷新数据
  usePullDownRefresh(() => {
    refresh();
  });

  // 处理产品点击
  const handleItemClick = (item: Product) => {
    Taro.navigateTo({
      url: `${pageUrls.productDetail}?productId=${item.id}`,
    });
  };

  useDidShow(() => {
    refresh();
  });

  // 使用 IntersectionObserver 监听元素进入视口
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setupScrollListener = useCallback(() => {
    // 清理现有的观察器和定时器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    const targetId = "product-more-tag";

    // 优先使用 IntersectionObserver
    if (typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // 添加 loading 和 error 检查，避免在加载中或错误状态下继续触发
            if (entry.isIntersecting && hasMore && !loading && !error) {
              loadMore();
            }
          });
        },
        {
          root: null,
          rootMargin: "100px",
          threshold: 0.1,
        }
      );

      // 查找目标元素并开始观察
      Taro.createSelectorQuery()
        .select(`#${targetId}`)
        .node()
        .exec((res) => {
          if (res && res[0] && res[0].node && observerRef.current) {
            observerRef.current.observe(res[0].node);
          } else if (observerRef.current) {
            console.warn("Failed to get target node, using fallback method");
            useFallbackMethod(targetId);
          }
        });
    } else {
      console.warn("IntersectionObserver not supported, using fallback method");
      useFallbackMethod(targetId);
    }
  }, [hasMore, loadMore, loading, error]);

  // 降级方案：使用定时器轮询
  const useFallbackMethod = useCallback(
    (targetId: string) => {
      const checkElementStatus = () => {
        // 如果正在加载或发生错误，不继续检查
        if (loading || error) {
          return;
        }
        Taro.createSelectorQuery()
          .select(`#${targetId}`)
          .boundingClientRect()
          .exec((res) => {
            if (res && res[0]) {
              const rect = res[0];
              try {
                const windowInfo = Taro.getWindowInfo();
                // 添加 loading 和 error 检查
                if (
                  rect.top < windowInfo.windowHeight &&
                  rect.bottom > 0 &&
                  hasMore &&
                  !loading &&
                  !error
                ) {
                  loadMore();
                }
              } catch (error) {
                console.warn("Failed to get window info:", error);
                const fallbackHeight = 667;
                // 添加 loading 和 error 检查
                if (
                  rect.top < fallbackHeight &&
                  rect.bottom > 0 &&
                  hasMore &&
                  !loading &&
                  !error
                ) {
                  loadMore();
                }
              }
            }
          });
      };

      fallbackIntervalRef.current = setInterval(checkElementStatus, 500);
    },
    [hasMore, loadMore, loading, error]
  );

  // 设置滚动监听
  useEffect(() => {
    setupScrollListener();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [setupScrollListener]);

  return (
    <CrystalContainer
      showBack={false}
      showHome={false}
      headerExtraContent={
        <View className={styles.customHeader}>
          <Text className={styles.customHeaderText}>好物商城</Text>
        </View>
      }
    >
      <View className={styles.productContainer}>
        <View
          style={{
            height: `calc(100vh - ${navBarHeight + 100}px)`,
            boxSizing: "border-box",
            paddingBottom: "140px",
            overflowY: "auto",
            paddingTop: "12px",
          }}
        >
          <View className={styles.productList}>
            {productList.map((item) => (
              <View
                key={`product_${item.id}`}
                className={styles.productItem}
                onClick={() => handleItemClick(item)}
              >
                <View className={styles.imageContainer}>
                  <Image
                    src={item.image_urls?.[0] || ""}
                    className={styles.productImage}
                    mode="aspectFill"
                    lazyLoad
                  />
                </View>

                <View className={styles.itemInfo}>
                  <View className={styles.titleSection}>
                    <Text className={styles.itemTitle}>{item.name}</Text>
                  </View>

                  <View className={styles.priceSection}>
                    <View className={styles.priceContainer}>
                      <Text className={styles.pricePrefix}>¥</Text>
                      <Text className={styles.currentPrice}>
                        {item.final_price}
                      </Text>
                      {item.reference_price &&
                        item.reference_price > item.final_price && (
                          <Text className={styles.originalPrice}>
                            {item.reference_price}
                          </Text>
                        )}
                    </View>
                  </View>
                  {item.category && (
                    <View className={styles.categorySection}>
                      <Text className={styles.categoryText}>
                        {formatProductCategory(item.category)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
          <View className={styles.noMoreContainer} id="product-more-tag">
            {loading ? (
              <Text className={styles.noMoreText}>加载中...</Text>
            ) : (
              <Text className={styles.noMoreText}>
                {productList.length === 0
                  ? "暂无产品"
                  : "暂时就这些啦～"}
              </Text>
            )}
          </View>
        </View>

        {/* 加载状态 */}
        {loading && productList.length === 0 && (
          <View className={styles.loadingContainer}>
            <View className={styles.loadingSpinner} />
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        )}

        {/* 错误状态 */}
        {error && (
          <View className={styles.errorContainer}>
            <Text className={styles.errorText}>{error}</Text>
            <View className={styles.retryButton} onClick={refresh}>
              <Text className={styles.retryText}>重试</Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!loading && productList.length === 0 && !error && (
          <View className={styles.emptyContainer}>
            <Text className={styles.emptyText}>暂无产品</Text>
          </View>
        )}
      </View>

      <TabBar />
    </CrystalContainer>
  );
};

export default ProductListPage;
