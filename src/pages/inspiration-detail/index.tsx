import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import LazyImage from "@/components/LazyImage";
import { inspirationApi } from "@/utils/api";

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
  user: {
    user_id: string;
    nike_name: string;
    avatar_url: string;
  };
  beads: BeadInfo[];
}

const InspirationDetailPage: React.FC = () => {
  const router = useRouter();
  const { workId } = router.params;
  
  const [detail, setDetail] = useState<InspirationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (workId) {
      fetchInspirationDetail();
    }
  }, [workId]);

  const fetchInspirationDetail = async () => {
    try {
      setLoading(true);
      // 模拟获取详情数据
      const mockDetail: InspirationDetail = {
        work_id: workId || "work000001",
        title: "冰雪奇缘",
        number: "NO.0024",
        description: "一段话描述这款手串的，一段话描述这款手串的整体能量和祝福。一段话描述这款手串的，一段话描述这款手串的整体能量和祝福。",
        cover_url: "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250709221603.092_0178731c22e870e7ec8e2ae75e6238ff.jpg",
        images: [
          "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250709221603.092_0178731c22e870e7ec8e2ae75e6238ff.jpg",
          "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250709221603.092_0178731c22e870e7ec8e2ae75e6238ff.jpg",
          "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250709221603.092_0178731c22e870e7ec8e2ae75e6238ff.jpg"
        ],
        likes_count: 197,
        created_at: new Date().toISOString(),
        user: {
          user_id: "user123",
          nike_name: "温酒大人",
          avatar_url: "https://zhuluoji.cn-sh2.ufileos.com/user-avatar/user2/20250709014825.709_87400c539bf8b66c93d82cbb3bfa85e3.jpg"
        },
        beads: [
          {
            id: "bead1",
            name: "绿莹石",
            element: "木",
            effect: "稳定情绪",
            image: "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250709221603.092_0178731c22e870e7ec8e2ae75e6238ff.jpg",
            color: "#90EE90"
          },
          {
            id: "bead2", 
            name: "绿莹石",
            element: "木",
            effect: "稳定情绪",
            image: "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250709221603.092_0178731c22e870e7ec8e2ae75e6238ff.jpg",
            color: "#90EE90"
          }
        ]
      };
      
      setDetail(mockDetail);
    } catch (error) {
      console.error('获取灵感详情失败:', error);
      Taro.showToast({
        title: '获取详情失败',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSwipe = (direction: 'left' | 'right') => {
    if (!detail?.images) return;
    
    if (direction === 'left' && currentImageIndex < detail.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (direction === 'right' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleUserClick = () => {
    if (!detail?.user) return;
    
    Taro.navigateTo({
      url: `/pages/user-profile/index?userId=${detail.user.user_id}`
    });
  };

  const handleMakeSameStyle = () => {
    if (!detail) return;
    
    Taro.navigateTo({
      url: `/pages-design/custom-design/index?templateId=${detail.work_id}`
    });
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

  return (
    <CrystalContainer showBack={true}>
      <ScrollView className={styles.container} scrollY>
        {/* 主图片区域 */}
        <View className={styles.imageSection}>
          <LazyImage
            src={detail.images?.[currentImageIndex] || detail.cover_url}
            className={styles.mainImage}
            mode="aspectFill"
          />
          
          {/* 图片指示器 */}
          {detail.images && detail.images.length > 1 && (
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
          )}
          
          {/* 图片切换按钮 */}
          {detail.images && detail.images.length > 1 && (
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
          )}
        </View>

        {/* 珠子信息区域 */}
        <View className={styles.beadSection}>
          {detail.beads.map((bead) => (
            <View key={bead.id} className={styles.beadCard}>
              <View className={styles.beadImageContainer}>
                <View 
                  className={styles.beadImage}
                  style={{ backgroundColor: bead.color }}
                />
              </View>
              <View className={styles.beadContent}>
                <Text className={styles.beadName}>{bead.name}「{bead.element}」</Text>
                <View className={styles.beadEffect}>
                  <View className={styles.beadEffectLine} />
                  <Text className={styles.beadEffectText}>{bead.effect}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 内容区域 */}
        <View className={styles.contentSection}>
          {/* 标题区域 */}
          <View className={styles.titleSection}>
            <View className={styles.titleContainer}>
              <Text className={styles.title}>{detail.title}</Text>
              <Text className={styles.workNumber}>{detail.number}</Text>
            </View>
            <View className={styles.likeContainer}>
              <Text className={styles.starIcon}>⭐</Text>
              <Text className={styles.likeCount}>{detail.likes_count}</Text>
            </View>
          </View>

          {/* 正文区域 */}
          <View className={styles.descriptionSection}>
            <Text className={styles.description}>{detail.description}</Text>
            
            {/* 作者和时间 */}
            <View className={styles.authorTimeSection}>
              <View className={styles.authorContainer} onClick={handleUserClick}>
                <LazyImage
                  src={detail.user.avatar_url}
                  className={styles.authorAvatar}
                  mode="aspectFill"
                />
                <Text className={styles.authorName}>{detail.user.nike_name}</Text>
              </View>
              <View className={styles.divider} />
              <Text className={styles.publishTime}>{formatTime(detail.created_at)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className={styles.bottomBar}>
        <View className={styles.separator} />
        <View className={styles.makeButton} onClick={handleMakeSameStyle}>
          <View className={styles.buttonGroup}>
            <View className={styles.buttonReflection} />
            <View className={styles.buttonContent}>
              <Text className={styles.editIcon}>📝</Text>
              <Text className={styles.buttonText}>制作同款</Text>
            </View>
          </View>
        </View>
      </View>
    </CrystalContainer>
  );
};

export default InspirationDetailPage; 