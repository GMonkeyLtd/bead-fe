import React, { useState, useEffect } from "react";
import { View, Text, Image, Input } from "@tarojs/components";
import { showToast } from "@tarojs/taro";
import styles from "./index.module.scss";
import closeIcon from "@/assets/icons/close.svg";
import merchantApi from "@/utils/api-merchant";

interface WayBillFormProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  submitCallback?: () => void;
}

const WayBillForm: React.FC<WayBillFormProps> = ({
  visible,
  orderId,
  onClose,
  submitCallback,
}) => {
  const [wayBillNumber, setWayBillNumber] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // 当弹窗显示时，获取商家信息并填充发件人手机号
  useEffect(() => {
    if (visible) {
      // 清空快递单号，但保留手机号（如果已有的话）
      setWayBillNumber("");
      loadMerchantPhone();
    }
  }, [visible]);

  const loadMerchantPhone = async () => {
    try {
      setLoading(true);
      const res = await merchantApi.user.getMerchantInfo();
      if (res?.data?.phone) {
        setSenderPhone(res.data.phone);
      }
    } catch (error) {
      console.error("获取商家信息失败:", error);
      // 静默失败，不影响用户操作
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return null;
  }

  // 联系微信用户
  const handleSubmit = () => {
    if (!wayBillNumber) {
      showToast({
        title: "快递单号不能为空",
        icon: "none",
      });
      return;
    }
    if (!senderPhone) {
      showToast({
        title: "发件人手机号不能为空",
        icon: "none",
      });
      return;
    }
    merchantApi.user.submitWayBillId(orderId, wayBillNumber, senderPhone).then((res) => {
      if (res.code === 200) {
        showToast({
          title: "提交成功",
          icon: "success",
        });
        submitCallback?.();
        onClose();
      }
    }).catch((err) => {
      showToast({
        title: "提交失败" + err.message,
        icon: "none",
      });
    });
  };

  return (
    <View className={styles.contactDialogOverlay}>
      <View className={styles.contactDialog}>
        {/* 头部区域 */}
        <View className={styles.contactDialogContent}>
          <View className={styles.contactDialogHeader}>
            <View className={styles.contactDialogHeaderTitle}>
              <View className={styles.contactDialogTitleText}>
                填写快递单号
              </View>
              <Image
                src={closeIcon}
                style={{ width: "20px", height: "20px" }}
                onClick={onClose}
              />
            </View>
            {/* <Text className={styles.subtitleText}>给商家的一句话，商家手册</Text> */}
          </View>

          <View className={styles.contactDialogContent}>
            <Text className={styles.contactDialogTitleText}>快递单号</Text>
            <Input
              // placeholder="请输入快递单号"
              value={wayBillNumber || ""}
              type='text'
              focus
              onInput={(e) => setWayBillNumber(e.detail.value)}
              style={{
                backgroundColor: '#F5F5F5',
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
              }}
              maxlength={-1}
            />
          </View>
          <View className={styles.contactDialogContent}>
            <View className={styles.contactDialogTitleText}>发件人手机号</View>
            <Input
              // placeholder="请输入发件人手机号"
              value={senderPhone}
              type='text'
              onInput={(e) => setSenderPhone(e.detail.value)}
              style={{
                backgroundColor: '#F5F5F5',
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
              }}
              maxlength={-1}
            />
          </View>
        </View>

        {/* 底部按钮 */}
        <View className={styles.contactDialogFooter}>
          <View className={styles.contactDialogReturnBtn} onClick={onClose}>
            <Text className={styles.contactDialogReturnText}>返回</Text>
          </View>
            <View
              className={styles.contactDialogCallBtn}
              onClick={handleSubmit}
            >
              <Text className={styles.contactDialogReturnText}>提交</Text>
            </View>
        </View>
      </View>
    </View>
  );
};

export default WayBillForm;
