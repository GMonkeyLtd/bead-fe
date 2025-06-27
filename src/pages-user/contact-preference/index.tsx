import { useState } from "react";
import { View, Text, Input, Button, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "@/components/PageContainer";
import phoneIcon from "@/assets/icons/phone.svg";
import wechatIcon from "@/assets/icons/wechat.svg";
import checkIcon from "@/assets/icons/check-white.svg";
import {
  DEFAULT_PHONE_IMAGE_URL,
  SELECTED_PHONE_IMAGE_URL,
  DEFAULT_WECHAT_IMAGE_URL,
  SELECTED_WECHAT_IMAGE_URL,
} from "@/config";
import "./index.scss";
import CrystalButton from "@/components/CrystalButton";
import api, { userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";

type ContactMethod = "phone" | "wechat";

const ContactPreference = () => {
  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isGettingCode, setIsGettingCode] = useState(false);
  const [wechatNumber, setWechatNumber] = useState("");

  const { budget, designId } = Taro.getCurrentInstance()?.router?.params || {};

  // 获取验证码
  const handleGetVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      Taro.showToast({
        title: "请输入正确的手机号码",
        icon: "none",
      });
      return;
    }

    setIsGettingCode(true);

    try {
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Taro.showToast({
        title: "验证码已发送",
        icon: "success",
      });
    } catch (error) {
      console.error("获取验证码失败:", error);
      Taro.showToast({
        title: "获取验证码失败",
        icon: "none",
      });
    } finally {
      setIsGettingCode(false);
    }
  };

  // 保存联系方式
  const handleSave = async () => {
    if (!isAgreed) {
      Taro.showToast({
        title: "请先同意用户协议和隐私政策",
        icon: "none",
      });
      return;
    }

    if (selectedMethod === "phone" && !phoneNumber) {
      Taro.showToast({
        title: "请完善手机号码",
        icon: "none",
      });
      return;
    }

    if (selectedMethod === "wechat" && !wechatNumber) {
      Taro.showToast({
        title: "请完善微信号",
        icon: "none",
      });
      return;
    }
    try {
      // 这里调用保存联系方式的API
      const data = {
        default_contact: selectedMethod === 'phone' ? 0 : 1,
        phone: selectedMethod === "phone" ? phoneNumber : "",
        wechat_id: selectedMethod === "wechat" ? wechatNumber : "",
      };

      await userApi.updateUser(data);

      Taro.showToast({
        title: "保存成功",
        icon: "success",
      });
      if (budget && designId) {
       const res = await api.userHistory.createOrder({
          design_id: parseInt(designId),
          price: parseFloat(budget),
        });
        const { order_uuid } = res?.data || {};
        Taro.navigateTo({
          url: `${pageUrls.orderDispatching}?orderId=${order_uuid}`
        });
        return;
      }

      // 保存成功后的跳转逻辑
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({
        title: "保存失败",
        icon: "none",
      });
    }
  };

  const isFormValid =
    isAgreed &&
    (selectedMethod === "wechat" || (phoneNumber && verificationCode));

  return (
    <PageContainer>
      <View className="contact-preference">
        <View className="contact-preference-container">
          {/* 标题 */}
          <Text className="contact-preference-title">
            你希望商家如何与你联系？
          </Text>

          {/* 联系方式选择 */}
          <View className="contact-preference-options">
            <View
              className={`contact-preference-option ${
                selectedMethod === "phone" ? "active" : ""
              }`}
              onClick={() => setSelectedMethod("phone")}
            >
              <Image
                src={
                  selectedMethod === "phone"
                    ? SELECTED_PHONE_IMAGE_URL
                    : DEFAULT_PHONE_IMAGE_URL
                }
                alt="电话"
                className="icon-image"
              />
              <Text className="contact-preference-option-text">电话沟通</Text>
            </View>
            <View
              className={`contact-preference-option ${
                selectedMethod === "wechat" ? "active" : ""
              }`}
              onClick={() => setSelectedMethod("wechat")}
            >
              <Image
                src={
                  selectedMethod === "wechat"
                    ? SELECTED_WECHAT_IMAGE_URL
                    : DEFAULT_WECHAT_IMAGE_URL
                }
                alt="微信"
                className="icon-image"
              />
              <Text className="contact-preference-option-text">微信沟通</Text>
            </View>
          </View>
        </View>

        {/* 表单区域 */}
        {selectedMethod === "phone" && (
          <View className="contact-preference-form">
            {/* 手机号码输入 */}
            <View className="contact-preference-form-group phone-input">
              <Text className="country-code">+86</Text>
              <View className="divider" />
              <Input
                className="phone-input-field"
                placeholder="请输入你的手机号码"
                value={phoneNumber}
                onInput={(e) => setPhoneNumber(e.detail.value)}
                type="number"
                maxlength={11}
              />
            </View>

            {/* 验证码输入 */}
            {/* <View className="contact-preference-form-group code-input">
            <Input
            className="code-input-field"
            placeholder="输入验证码"
            value={verificationCode}
            onInput={(e) => setVerificationCode(e.detail.value)}
            type="number"
            maxlength={6}
            />
            <Button
            className="get-code-btn"
            onClick={handleGetVerificationCode}
            disabled={isGettingCode || countdown > 0 || !phoneNumber}
            >
            {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </Button>
        </View> */}
          </View>
        )}
        {selectedMethod === "wechat" && (
          <View className="contact-preference-form-group phone-input">
            <View className="contact-preference-form">
              <Input
                className="phone-input-field"
                placeholder="请输入你的微信号"
                value={wechatNumber}
                onInput={(e) => setWechatNumber(e.detail.value)}
              />
            </View>
          </View>
        )}
      </View>

      {/* 底部操作区域 */}
      <View className="contact-preference-footer">
        <CrystalButton
          onClick={handleSave}
          text="保存"
          isPrimary={true}
          style={{ width: "220px" }}
        />
        {/* <Button
          className="save-button"
          onClick={handleSave}
          disabled={!isFormValid}
        >
          <View className="button-content">
            <Text className="button-text">保存</Text>
          </View>
        </Button> */}

        {/* 用户协议勾选 */}
        <View className="agreement-checkbox">
          <View
            className={`checkbox ${isAgreed ? "" : "unchecked"}`}
            onClick={() => setIsAgreed(!isAgreed)}
          >
            {isAgreed && (
              <img src={checkIcon} alt="已同意" className="check-icon" />
            )}
          </View>
          <Text className="agreement-text">
            已阅读并同意
            <Text
              className="link"
              onClick={() => {
                // 打开用户协议页面
                console.log("打开用户协议");
              }}
            >
              {" "}
              用户协议{" "}
            </Text>
            和
            <Text
              className="link"
              onClick={() => {
                // 打开隐私政策页面
                console.log("打开隐私政策");
              }}
            >
              {" "}
              隐私政策
            </Text>
          </Text>
        </View>
      </View>
    </PageContainer>
  );
};

export default ContactPreference;
