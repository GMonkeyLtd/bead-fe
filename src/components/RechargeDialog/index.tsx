import { useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { showToast, showModal } from "@tarojs/taro";
import api, { RechargeParams, WxPayParams } from "@/utils/api-merchant";
import "./index.scss";

interface RechargeDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

// 预设充值金额
const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function RechargeDialog({ 
  visible, 
  onClose, 
  onSuccess 
}: RechargeDialogProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  // 获取当前选中的金额
  const getCurrentAmount = (): number => {
    if (selectedAmount !== null) {
      return selectedAmount;
    }
    return parseFloat(customAmount) || 0;
  };

  // 微信支付
  const handleWxPay = async (wxPayParams: WxPayParams) => {
 // Taro 支付调用
    Taro.requestPayment({
      timeStamp: wxPayParams.time_stamp,  // 秒级时间戳
      nonceStr: wxPayParams.nonce_str,
      package: wxPayParams.package, // 服务端返回
      signType: wxPayParams.sign_type,
      paySign: wxPayParams.pay_sign,
      success: () => Taro.showToast({ title: '支付成功' }),
      fail: (err) => console.error('支付失败', err)
    });
  };

  // 处理充值
  const handleRecharge = async () => {
    const amount = getCurrentAmount();
    
    if (amount <= 0) {
      showToast({
        title: "请输入有效金额",
        icon: "none",
      });
      return;
    }

    setLoading(true);

    try {
      // 调用充值接口
      const rechargeParams: RechargeParams = { amount };
      const result = await api.user.recharge(rechargeParams);
      
      // 调用微信支付
      await handleWxPay(result.wx_pay_params);
      
      // 支付成功
      showToast({
        title: "充值成功",
        icon: "success",
      });

      // 通知父组件刷新余额
      onSuccess?.(amount);
      onClose();

    } catch (error: any) {
      console.error("充值失败:", error);
      
      if (error.message === "用户取消支付") {
        showToast({
          title: "支付已取消",
          icon: "none",
        });
      } else {
        showToast({
          title: error.message || "充值失败",
          icon: "none",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 输入自定义金额
  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  return (
    <View className="recharge-dialog-overlay">
      <View className="recharge-dialog">
        <View className="dialog-header">
          <Text className="dialog-title">账户充值</Text>
          <View className="close-btn" onClick={onClose}>
            ✕
          </View>
        </View>

        <View className="dialog-content">
          {/* <View className="amount-section">
            <Text className="section-title">选择充值金额</Text>
            <View className="preset-amounts">
              {PRESET_AMOUNTS.map((amount) => (
                <View
                  key={amount}
                  className={`amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                  onClick={() => handleSelectAmount(amount)}
                >
                  ¥{amount}
                </View>
              ))}
            </View>
          </View> */}

          <View className="custom-amount-section">
            <Text className="section-title">输入自定义金额</Text>
            <Input
              className="amount-input"
              type="digit"
              placeholder="请输入金额"
              value={customAmount}
              onInput={(e) => handleCustomAmountChange(e.detail.value)}
            />
          </View>

          <View className="current-amount">
            <Text className="amount-label">充值金额：</Text>
            <Text className="amount-value">¥{getCurrentAmount()}</Text>
          </View>
        </View>

        <View className="dialog-footer">
          <Button 
            className="recharge-cancel-btn" 
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button 
            className="recharge-confirm-btn" 
            onClick={handleRecharge}
            loading={loading}
          >
            立即充值
          </Button>
        </View>
      </View>
    </View>
  );
} 