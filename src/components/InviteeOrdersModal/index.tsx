import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { InviteeOrder } from '@/utils/api';
import payApi from '@/utils/api-pay';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { OrderStatusMap } from '@/utils/orderUtils';

interface InviteeOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const InviteeOrdersModal: React.FC<InviteeOrdersModalProps> = ({
  visible,
  onClose,
  userId,
  userName,
}) => {
  const [orders, setOrders] = useState<InviteeOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const res = await payApi.getInviteeOrders(userId);
          setOrders(res?.data?.orders || []);
        } catch (error) {
          console.error('获取订单列表失败:', error);
          Taro.showToast({ title: '加载失败', icon: 'none' });
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [visible, userId]);

  if (!visible) return null;

  return (
    <View className={styles.modalOverlay} onClick={onClose}>
      <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <View className={styles.header}>
          <View className={styles.title}>{userName} 的订单</View>
          <View className={styles.closeButton} onClick={onClose}>×</View>
        </View>

        <ScrollView scrollY className={styles.list}>
          {loading ? (
            <View className={styles.emptyText}>加载中...</View>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <View key={order.order_uuid} className={styles.orderItem}>
                <View className={styles.orderTop}>
                  {/* <Text>订单号: {order.order_uuid.slice(-8)}</Text> */}
                  <Text>{formatDate(order.created_at)}</Text>
                </View>
                <View className={styles.orderBottom}>
                  <Text className={`${styles.orderStatus} ${order.order_status === 1 ? styles.paid : ''}`}>
                    {OrderStatusMap[order.order_status] || '未知状态'}
                  </Text>
                  <Text className={styles.orderAmount}>
                    ¥{(order.order_amount / 100).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyText}>暂无订单记录</View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default InviteeOrdersModal;

