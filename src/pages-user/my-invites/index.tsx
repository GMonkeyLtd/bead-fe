import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { ReferralUser } from "@/utils/api";
import payApi from "@/utils/api-pay";
import CrystalContainer from "@/components/CrystalContainer";
import styles from "./index.module.scss";
import InviteeOrdersModal from "../../components/InviteeOrdersModal";

const MyInvitesPage: React.FC = () => {
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [totalInvited, setTotalInvited] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await payApi.getMyInvites({ showLoading: true });
        setUsers(res?.data?.invitees || []);
        setTotalInvited(res?.data?.total_invitees || 0);
      } catch (error) {
        console.error("获取邀请列表失败:", error);
        Taro.showToast({
          title: "获取数据失败",
          icon: "none",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <CrystalContainer
      showBack
      showHome={false}
      headerExtraContent={
        <View className={styles.headerExtraContent}>
          <Text className={styles.headerExtraContentText}>我的邀请</Text>
        </View>
      }
    >
      <View className={styles.container}>
        <View className={styles.header}>
          <View className={styles.statsCard}>
            <View className={styles.statsLabel}>累计邀请</View>
            <View className={styles.statsValue}>
              {totalInvited}
              <Text className={styles.unit}>人</Text>
            </View>
          </View>
        </View>

        <View className={styles.listTitle}>邀请记录</View>

        <ScrollView scrollY className={styles.userList}>
          {users.length > 0
            ? users.map((user) => (
                <View
                  key={user.user_id}
                  className={styles.userItem}
                  onClick={() =>
                    setSelectedUser({
                      id: user.user_id,
                      name: user.nick_name || "微信用户",
                    })
                  }
                >
                  <Image
                    src={
                      user.avatar_url ||
                      "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/default-avatar.png"
                    }
                    className={styles.avatar}
                    mode="aspectFill"
                  />
                  <View className={styles.userInfo}>
                    <View className={styles.nickname}>
                      {user.nick_name || "微信用户"}
                    </View>
                    <View className={styles.orderInfo}>
                      已下单 {user.order_count} 笔
                    </View>
                  </View>
                  <View className={styles.orderInfoContainer}>
                    <View className={styles.orderInfoLabel}>订单总金额</View>
                    <View className={styles.amount}>
                      ¥{(user.order_amount / 100).toFixed(2)}
                    </View>
                  </View>
                </View>
              ))
            : !loading && (
                <View className={styles.emptyText}>暂无邀请记录</View>
              )}
        </ScrollView>

        <InviteeOrdersModal
          visible={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser?.id || ""}
          userName={selectedUser?.name || ""}
        />
      </View>
    </CrystalContainer>
  );
};

export default MyInvitesPage;
