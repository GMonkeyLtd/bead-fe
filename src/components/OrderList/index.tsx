import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Button, Image, ScrollView } from "@tarojs/components";
import Taro, { showToast, showModal, requirePlugin } from "@tarojs/taro";
import styles from "./index.module.scss";
import StatusBadge from "../StatusBadge";
import {
  formatOrderStatus,
  getStatusBadgeType,
  OrderStatus,
  AfterSaleStatus,
} from "@/utils/orderUtils";
import BeadOrderDialog from "@/components/BeadOrderDialog";
import ContactUserDialog from "@/components/ContactUserDialog";
import phoneIcon from "@/assets/icons/phone.svg";
import merchantApi from "@/utils/api-merchant";
import { pageUrls } from "@/config/page-urls";
import copyIcon from "@/assets/icons/copy.svg";
import ProductPriceForm from "../ProductPriceForm";
import ProductImageUpload from "../ProductImageUpload";
import WayBillForm from "../WayBillForm";
import ProductImageGenerator from "../ProductImageGenerator";
import { imageToBase64 } from "@/utils/imageUtils";
import apiSession from "@/utils/api-session";
import { ImageLoadQueue } from "@/utils/image-queue";

export interface Order {
  order_uuid: string;
  order_status: OrderStatus;
  price: number;
  create_time: string;
  design_info: any;
  remark: string;
  created_at: string;
  updated_at: string;
  user_info?: {
    default_contact: number; // 0: 电话, 1: 微信
    phone?: string;
    wechat_id?: string;
    nick_name?: string;
    avatar_url?: string;
  };
  after_sale_info?: {
    after_sale_status: string;
    after_sale_status_text: string;
    pre_sales_status: string;
  };
  beadsData?: any[];
  order_details?: any;
}

export interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
  onOrderAction?: (action: string, order: Order) => void;
  showActions?: boolean;
  emptyText?: string;
  className?: string;
  style?: React.CSSProperties;
  isGrab?: boolean;
}

// 图片生成队列管理器
class OrderImageGenerator {
  private queue: ImageLoadQueue;
  private generatingSet = new Set<string>();
  private maxConcurrent = 2; // 限制同时生成的图片数量

  constructor() {
    this.queue = new ImageLoadQueue(this.maxConcurrent);
  }

  async generateImage(designId: string, task: () => Promise<void>): Promise<void> {
    if (this.generatingSet.has(designId)) {
      console.warn(`设计 ${designId} 正在生成中，跳过重复请求`);
      return;
    }

    this.generatingSet.add(designId);

    try {
      await this.queue.add(task);
    } finally {
      this.generatingSet.delete(designId);
    }
  }

  isGenerating(designId: string): boolean {
    return this.generatingSet.has(designId);
  }

  getStatus() {
    return {
      ...this.queue.getStatus(),
      generating: Array.from(this.generatingSet),
    };
  }

  destroy() {
    this.queue.destroy();
    this.generatingSet.clear();
  }
}

export default function OrderList({
  orders,
  loading = false,
  onRefresh,
  onOrderAction,
  showActions = true,
  emptyText = "暂无订单",
  className = "",
  isGrab = false,
  style,
}: OrderListProps) {
  // 创建图片生成管理器
  const imageGeneratorRef = useRef<OrderImageGenerator | null>(null);
  if (!imageGeneratorRef.current) {
    imageGeneratorRef.current = new OrderImageGenerator();
  }

  // 跟踪已上传成功的设计 ID
  const [uploadedDesigns, setUploadedDesigns] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<Order | null>(null);
  const [contactDialogVisible, setContactDialogVisible] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<
    Order["user_info"] | null
  >(null);
  const [orderActionDialog, setOrderActionDialog] = useState<any>(null);
  const logisticsPlugin = requirePlugin("logisticsPlugin");

  // 组件卸载时清理图片生成队列
  useEffect(() => {
    return () => {
      if (imageGeneratorRef.current) {
        console.log('OrderList 组件卸载，清理图片生成队列');
        imageGeneratorRef.current.destroy();
        imageGeneratorRef.current = null;
      }
    };
  }, []);
  console.log(orders, 'orders')
  const handleClose = () => {
    setDetailData(null);
  };

  const handleCloseContactDialog = () => {
    setContactDialogVisible(false);
    setCurrentUserInfo(null);
  };

  const handleCancelOrder = (order: Order) => {
    // 跳转到取消订单页面，传递订单信息
    merchantApi.user
      .cancelOrder(order.order_uuid)
      .then((res: any) => {
        if (res.code === 200) {
          showToast({
            title: "取消订单成功",
            icon: "success",
          });
          onRefresh?.();
        }
      })
      .catch((err: any) => {
        showToast({
          title: err.message || "取消订单失败",
          icon: "error",
        });
      });
  };

  const handleOrderDetail = (order: Order) => {
    const beadsData = order?.design_info?.items?.reduce(
      (acc: any[], item: any) => {
        const existingBead = acc.find((bead) => bead.sku_id === item?.sku_id);
        if (existingBead) {
          existingBead.quantity += item?.quantity || 1;
        } else {
          acc.push({
            sku_id: item?.sku_id,
            name: item?.name,
            size: item?.diameter + "mm",
            quantity: item?.quantity || 1,
            costPrice: item?.cost_price / 100 || 0,
            referencePrice: item?.reference_price / 100 || 0,
          });
        }
        return acc;
      },
      []
    );
    setDetailData({
      ...order,
      // @ts-ignore
      beadsData,
    });
  };

  const handleCopyOrderNumber = (orderNumber: string) => {
    Taro.setClipboardData({
      data: orderNumber,
    });
  };

  // 脱敏处理函数
  const maskContactInfo = (contact: string, type: "phone" | "wechat") => {
    if (!contact) return "";

    if (type === "phone") {
      // 手机号脱敏：前3位 + **** + 后4位
      if (contact.length >= 7) {
        return `${contact.substring(0, 3)}****${contact.substring(
          contact.length - 4
        )}`;
      }
      return contact;
    } else {
      // 微信号脱敏：前3位 + **** + 后4位
      if (contact.length >= 7) {
        return `${contact.substring(0, 3)}****${contact.substring(
          contact.length - 4
        )}`;
      }
      return contact;
    }
  };

  const renderConnectInfo = (order: Order) => {
    let info = "",
      copyData = "";
    if (order.user_info?.default_contact === 0) {
      const phone = order.user_info?.phone || "";
      const maskedPhone = phone;//maskContactInfo(phone, "phone");
      info = `电话：${maskedPhone}`;
      copyData = phone; // 复制时使用原始数据
    } else {
      const wechat = order.user_info?.wechat_id || "";
      const maskedWechat = wechat;//maskContactInfo(wechat, "wechat");
      info = `微信：${maskedWechat}`;
      copyData = wechat; // 复制时使用原始数据
    }
    return (
      <View
        className={styles.connectInfo}
        onClick={() => handleCopyOrderNumber(copyData)}
      >
        <Text>{info}</Text>
        <Image src={copyIcon} mode="aspectFit" className={styles.copyIcon} />
      </View>
    );
  };

  const onAgreeRefund = (order: Order) => {
    merchantApi.user
      .agreeRefund(order.order_uuid)
      .then((res: any) => {
        if (res.code === 200) {
          showToast({
            title: "同意退款成功",
            icon: "success",
          });
          onRefresh?.();
        }
      })
      .catch((err: any) => {
        showToast({
          title: "同意退款失败" + err.message,
          icon: "none",
        });
      });
  };

  const submitPriceCb = () => {
    Taro.requestSubscribeMessage({
      tmplIds: ["IbbEPC2Jy7uSZn2TGuBj6Tu2KAMBHlDEAEiEztW8weM"],
      success: (res) => {
        Taro.showToast({
          title: "订阅成功",
          icon: "success",
        });
        onRefresh?.();
      },
    });
  };

  const viewChatDetail = (order: Order) => {
    const sessionId = order.design_info?.session_id;
    console.log("merchant sessionId", sessionId);
    if (!sessionId) {
      showToast({
        title: "该订单未查到沟通记录",
        icon: "none",
      });
      return;
    }
    Taro.navigateTo({
      url: `${pageUrls.chatDesign}?session_id=${sessionId}&is_merchant=true`,
    });
  };

  const renderActionButtons = (order: Order) => {
    if (!showActions) return null;

    // 2: 进行中、待支付
    if (
      [
        OrderStatus.Negotiating,
        OrderStatus.InProgress,
        OrderStatus.PendingPayment,
      ].includes(order.order_status)
    ) {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View
              className={styles.callBtn}
              onClick={() => viewChatDetail(order)}
            >
              沟通记录
            </View>
            <View
              className={styles.orderCancelBtn}
              onClick={() => handleCancelOrder(order)}
            >
              取消
            </View>
          </View>
          <View className={styles.actionButtons}>
            {[OrderStatus.Negotiating, OrderStatus.InProgress, OrderStatus.PendingPayment].includes(
              order.order_status
            ) && (
                <View
                  className={styles.completeBtn}
                  onClick={() => {
                    setOrderActionDialog(
                      <ProductPriceForm
                        visible={true}
                        orderNumber={order.order_uuid}
                        productName={
                          order.design_info?.name || ""
                        }
                        beadsInfo={order.design_info?.items || []}
                        productImage={order.design_info?.image_url || ""}
                        onClose={() => setOrderActionDialog(null)}
                        onConfirm={submitPriceCb}
                        wristSize={order.design_info?.spec?.wrist_size || 15}
                        referencePrice={order.design_info?.reference_price / 100 || 0}
                      />
                    );
                  }}
                >
                  发起支付
                </View>
              )}
          </View>
        </View>
      );
    }
    if (
      [OrderStatus.PendingShipment, OrderStatus.Shipped].includes(
        order.order_status
      )
    ) {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View
              className={styles.uploadImageBtn}
              onClick={() => {
                setOrderActionDialog(
                  <ProductImageUpload
                    visible={true}
                    orderId={order.order_uuid}
                    productName={
                      order.design_info?.name || ""
                    }
                    productImage={order.design_info?.image_url || ""}
                    onClose={() => setOrderActionDialog(null)}
                    onConfirm={onRefresh}
                  />
                );
              }}
            >
              上传图片
            </View>
            <View
              className={styles.callBtn}
              onClick={() => viewChatDetail(order)}
            >
              沟通记录
            </View>
          </View>
          <View className={styles.actionButtons}>
            {order?.order_details?.address && (
              <View
                className={styles.callBtn}
                onClick={() => {
                  const addressInfo = order?.order_details?.address;
                  const addressInfoStr = `${addressInfo.user_name}\n${addressInfo.tel_number}\n${addressInfo.province_name}${addressInfo.city_name}${addressInfo.county_name}\n${addressInfo.detail_info}`;
                  Taro.showModal({
                    title: "收货地址",
                    content: addressInfoStr,
                    success: (res) => {
                      if (res.confirm) {
                        Taro.setClipboardData({
                          data: addressInfoStr,
                        });
                      }
                    },
                  });
                }}
              >
                收货地址
              </View>
            )}
            {/* {[OrderStatus.PendingShipment].includes(order.order_status) && ( */}
              <View
                className={styles.completeBtn}
                onClick={() => {
                  setOrderActionDialog(
                    <WayBillForm
                      visible={true}
                      orderId={order.order_uuid}
                      onClose={() => setOrderActionDialog(null)}
                      submitCallback={onRefresh}
                    />
                  );
                }}
              >
                填写物流
              </View>
            {/* )} */}
          </View>
        </View>
      );
    }
    if (
      [OrderStatus.AfterSale].includes(order.order_status) &&
      order.after_sale_info?.after_sale_status === "refund_reviewing"
    ) {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View
              className={styles.callBtn}
              onClick={() => onAgreeRefund(order)}
            >
              同意退款
            </View>
            <View
              className={styles.orderCancelBtn}
              onClick={() => {
                Taro.showToast({
                  title: "请联系客户撤单",
                  icon: "none",
                });
              }}
            >
              联系客户撤单
            </View>
          </View>
        </View>
      );
    }
  };

  const showWayBillInfo = (order: Order) => {
    if (
      order.order_details?.logistics_info &&
      order.order_details?.logistics_info?.logistics_no
    ) {
      return true;
    }
    return false;
  };

  const onViewLogistics = (order: Order) => {
    merchantApi.user.getWayBillToken(order.order_uuid).then((res: any) => {
      const waybill_token = res.data.waybill_token;
      logisticsPlugin?.openWaybillTracking({
        waybillToken: waybill_token,
      });
    });
  };

  const onScrollToLower = () => {
    console.log("onScrollToLower");
  };

  const formatLevel = (level: number) => {
    switch (level) {
      case 0:
        return `自定义`;
      case 1:
        return `简单穿搭`;
      case 2:
        return `品质追求`;
      case 3:
        return `高档进阶`;
    }
  };

  const handleImageGenerated = useCallback(async (imageUrl: string, designId: string) => {
    try {
      const productImageBase64 = await imageToBase64(imageUrl, true, false, 'png');
      const res = await apiSession.uploadProductImage({
        design_id: designId,
        image_base64: productImageBase64,
      });
      console.log(`设计 ${designId} 图片上传成功:`, res);

      // 标记为已上传，使组件能够卸载
      setUploadedDesigns(prev => new Set(prev).add(designId));

      // 更新列表显示
      onRefresh?.();
    } catch (error) {
      console.error(`设计 ${designId} 图片上传失败:`, error);
      Taro.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
    }
  }, [onRefresh]);

  const renderOrderItem = (order: Order) => {
    return (
      <View key={order.order_uuid} className={styles.orderCard}>
        {showWayBillInfo(order) && (
          <View
            className={styles.wayBillInfo}
            onClick={() => onViewLogistics(order)}
          >
            <View
              className={styles.wayBillNo}
            >{`快递单号：${order.order_details?.logistics_info?.logistics_no} ->`}</View>
            <View className={styles.wayBillStatus}>
              {order.order_details?.logistics_info?.waybill_status_text}
            </View>
          </View>
        )}
        <View className={styles.orderInfoContainer}>
          <View className={styles.orderHeader}>
            <View className={styles.orderStatus}>
              <StatusBadge
                type={getStatusBadgeType(order.order_status)}
                text={formatOrderStatus(
                  order.order_status,
                  order?.after_sale_info
                    ?.after_sale_status as AfterSaleStatus
                )}
              />
              <Text className={styles.orderNo}>
                订单号：{order.order_uuid}
              </Text>
            </View>
            <View
              className={styles.detailBtn}
              onClick={() => handleOrderDetail(order)}
            >
              明细
            </View>
          </View>
          {order?.order_status === OrderStatus.AfterSale &&
            order?.remark && (
              <View className={styles.remark}>
                <Text
                  className={styles.remarkText}
                >{`退款理由：${order.remark}`}</Text>
              </View>
            )}
        </View>
        <View className={styles.orderContent}>
          <View className={styles.orderInfo}>
            <Image
              className={styles.orderImage}
              src={order.design_info?.image_url || order.design_info?.draft_url}
              mode="aspectFill"
              lazyLoad
              onClick={() => {
                Taro.previewImage({
                  current: order.design_info?.image_url || order.design_info?.draft_url,
                  urls: [order.design_info?.image_url || order.design_info?.draft_url],
                });
              }}
            />
            <View className={styles.orderDetails}>
              {renderConnectInfo(order)}
              {/* {order.userInfo?.nick_name || "微信用户"} */}
              <Text className={styles.orderTime}>{order.created_at}</Text>
            </View>
          </View>
          <View className={styles.orderPriceContainer}>
            {order.community_info && (
              <View className={styles.communityTag}>
                同款
              </View>
            )}
            <Text className={styles.orderPrice}>
              ¥{order.price.toFixed(2)}
            </Text>
          </View>
        </View>
        {order.tier != -1 && <View className={styles.orderQualityContainer}>
          <View className={styles.orderQualityText}>
            品质等级:
          </View>
          <View className={styles.quanlituTag}>
            {formatLevel(order.tier)}
          </View>
        </View>}
        {renderActionButtons(order)}
        {!order.design_info?.image_url &&
          order.design_info?.background_url &&
          order.design_info?.draft_url &&
          !uploadedDesigns.has(order.design_info?.design_id) && (
            <ProductImageGenerator
              key={`image-gen-${order.design_info?.design_id}`}
              canvasId={`order-canvas-${order.design_info?.design_id}`}
              data={{
                bgImage: order.design_info?.background_url,
                braceletImage: order.design_info?.draft_url,
              }}
              onGenerated={(imageUrl) => {
                if (imageGeneratorRef.current && order.design_info?.design_id) {
                  imageGeneratorRef.current.generateImage(
                    order.design_info.design_id,
                    () => handleImageGenerated(imageUrl, order.design_info.design_id)
                  ).catch(error => {
                    console.warn('图片生成队列处理失败:', error);
                    // 如果队列失败，直接执行上传
                    handleImageGenerated(imageUrl, order.design_info.design_id);
                  });
                } else {
                  handleImageGenerated(imageUrl, order.design_info?.design_id);
                }
              }}
              showProductImage={false}
              autoDestroy={true}
            />
          )}
      </View>
    )
  }

  return (
    <View style={{ height: "100%" }}>
      <ScrollView
        className={`${styles.orderListContainer} ${className}`}
        scrollY
        onScrollToLower={onScrollToLower}
        style={style}
      >
        {orders.length === 0 || loading ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>
              {loading ? "加载中..." : emptyText}
            </Text>
          </View>
        ) : (
          orders.map((order) => renderOrderItem(order))
        )}
      </ScrollView>
      {/* 订单明细 */}
      {detailData && (
        <BeadOrderDialog
          visible
          orderNumber={detailData.order_uuid}
          productName={detailData.design_info?.name || ""}
          productCode={detailData.design_info?.design_id || ""}
          realImages={detailData.order_details?.actual_images || []}
          certificateImages={detailData.order_details?.certificate_images || []}
          budget={detailData.price.toString()}
          productImage={detailData.design_info?.image_url || detailData.design_info?.draft_url || ""}
          materials={(detailData.beadsData || []).map((item: any) => {
            return {
              name: item.name,
              spec: item.size,
              quantity: item.quantity,
              costPrice: item.costPrice,
              referencePrice: item.referencePrice,
            };
          })}
          onClose={handleClose}
          onConfirm={console.log}
          wristSize={detailData.design_info?.spec?.wrist_size || ""}
        />
      )}
      {/* 联系用户弹窗 */}
      {contactDialogVisible && currentUserInfo && (
        <ContactUserDialog
          visible={contactDialogVisible}
          userInfo={currentUserInfo}
          onClose={handleCloseContactDialog}
        />
      )}
      {orderActionDialog}
    </View>
  );
}
