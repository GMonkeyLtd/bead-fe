import PageContainer from "@/components/PageContainer";
import { View, Image, Text } from "@tarojs/components";
import merchantMatching from "@/assets/icons/merchant-matching.svg";
import "./index.scss";
import { useState } from "react";
import BraceletInfo from "@/components/BraceletInfo";
import CrystalButton from "@/components/CrystalButton";
import { MERCHANT_MATCHING_IMAGE_URL } from "@/config";
import BudgetDialog from "@/components/BudgetDialog";
import Taro from "@tarojs/taro";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";

const OrderDispatching = () => {
  const [totalCustomers, setTotalCustomers] = useState(999);
  const [successOrders, setSuccessOrders] = useState(888);
  const [showEditPrice, setShowEditPrice] = useState(false);

  const { orderId, designBackendId } =
    Taro.getCurrentInstance().router?.params || {};

  // 使用轮询 hook
  const { isPolling, orderInfo } = useOrderPolling({
    orderId: orderId,
    interval: 3000, // 3秒轮询间隔
    onStatusChange: (newStatus) => {
      console.log("订单状态变化:", newStatus);
      // 可以在这里添加状态变化时的额外逻辑
    },
  });

  const handleCancelOrder = () => {
    api.userHistory.cancelOrder(orderId || "").then((res) => {
      Taro.navigateBack();
    });
  };

  return (
    <PageContainer>
      <View className="order-dispatching-container">
        <View className="merchant-matching-container">
          <View className="dispatching-image-container">
            <Image
              src={MERCHANT_MATCHING_IMAGE_URL}
              className="dispatching-rotate-image"
            />
            {orderInfo?.design_info?.image_url && (
              <Image
                src={orderInfo?.design_info?.image_url}
                className="ring-image"
              />
            )}
            <Image src={merchantMatching} className="merchant-matching-image" />
          </View>
          <View className="cancel-order-container" onClick={handleCancelOrder}>
            <View className="cancel-order-text">取消订单</View>
          </View>
        </View>
        <View className="text-container">
          <Text className="main-title">正在为你寻找优质商家</Text>
          <View className="sub-title">
            <Text>累计</Text>
            <Text className="number-black">{totalCustomers}</Text>
            <Text>人派单，已成功匹配</Text>
            <Text className="number-primary">{successOrders}</Text>
            <Text>单</Text>
          </View>
        </View>

        <View className="order-container">
          {orderInfo && (
            <BraceletInfo
              orderNumber={orderInfo?.order_uuid}
              productName={orderInfo?.design_info?.word_info?.bracelet_name}
              productNumber={orderInfo?.design_info?.design_id}
              quantity={orderInfo?.design_info?.beads_number}
              price={orderInfo?.price}
              productImage={orderInfo?.design_info?.image_url}
              style={{
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                padding: "24px",
                backgroundColor: "#fff",
                borderRadius: "16px 20px",
                boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
              }}
            />
          )}
        </View>
        <View className="order-dispatching-tips">
          找到商家后，我们将通过"微信-服务通知"告诉你
        </View>

        <View className="order-dispatching-button">
          <CrystalButton
            text="查看订单"
            onClick={() =>
              Taro.redirectTo({
                url: pageUrls.orderList,
              })
            }
            isPrimary
            style={{ width: "200px" }}
          />
        </View>

        {/* 开发调试用：显示轮询状态 */}
        {/* {process.env.NODE_ENV === 'development' && (
          <View style={{ marginTop: '10px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
            轮询状态: {isPolling ? '进行中' : '已停止'}
          </View>
        )} */}
      </View>
      {showEditPrice && (
        <BudgetDialog
          visible={showEditPrice}
          onClose={() => setShowEditPrice(false)}
          title="夏日睡莲"
          designNumber="0001"
          onConfirm={(budget) => {
            console.log(budget);
            setShowEditPrice(false);
          }}
        />
      )}
    </PageContainer>
  );
};

export default OrderDispatching;
