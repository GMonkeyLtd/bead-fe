import { useEffect, useState } from "react";
import { View, Text, Input, Button, Image, Checkbox } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "@/components/PageContainer";
import {
  DEFAULT_PHONE_IMAGE_URL,
  SELECTED_PHONE_IMAGE_URL,
  DEFAULT_WECHAT_IMAGE_URL,
  SELECTED_WECHAT_IMAGE_URL,
  SERVICE_DOC_PDF_URL,
  PRIVACY_POLICY_PDF_URL,
} from "@/config";
import "./index.scss";
import CrystalButton from "@/components/CrystalButton";
import api, { userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import LinkUtils from "@/utils/linkUtils";

type ContactMethod = "phone" | "wechat";

const ContactPreference = () => {
  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [wechatNumber, setWechatNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const { budget, designId } = Taro.getCurrentInstance()?.router?.params || {};

  const getUserInfo = async () => {
    try {
      const res = await userApi.getUserInfo();
      const { default_contact, phone, wechat_id } = res?.data || {};
      if (default_contact === 0) {
        setSelectedMethod("phone");
      } else if (default_contact === 1) {
        setSelectedMethod("wechat");
      }
      phone && setPhoneNumber(phone);
      wechat_id && setWechatNumber(wechat_id);
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  }

  useEffect(() => {
    getUserInfo();
  }, []);

  // 保存联系方式
  const handleSave = async ({ phoneCode, selectedMethod }: { phoneCode?: string, selectedMethod?: ContactMethod }) => {
    if (!isAgreed) {
      Taro.showToast({
        title: "请先同意服务条款和隐私政策",
        icon: "none",
      });
      return;
    }

    if (selectedMethod === "phone" && !phoneCode) {
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
        default_contact: selectedMethod === "phone" ? 0 : 1,
        phone_code: selectedMethod === "phone" ? phoneCode : "",
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
        Taro.redirectTo({
          url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
        });
        return;
      }

      getUserInfo();
      // 保存成功后的跳转逻辑
      setTimeout(() => {
        if (Taro.getCurrentPages().length === 1) {
          Taro.navigateTo({
            url: pageUrls.home,
          });
        } else {
          Taro.navigateBack();
        }
      }, 1500);
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({
        title: "保存失败",
        icon: "none",
      });
    }
  };


  const getPhoneNumber = (e) => {
    if (!isAgreed) {
      Taro.showToast({
        title: "请先同意服务条款和隐私政策",
        icon: "none",
      });
      return;
    }
    if (e.detail.code) {
      setPhoneCode(e.detail.code);
      handleSave({ phoneCode: e.detail.code, selectedMethod: "phone" });
    }
  };

  const previewDoc = async (url: string) => {
    try {
      // 1. 显示加载状态
      Taro.showLoading({ title: '加载协议中...' });

      // 2. 下载 PDF 文件
      const { tempFilePath } = await Taro.downloadFile({
        url
      });

      // 3. 关闭加载状态
      Taro.hideLoading();

      // 4. 使用微信原生预览打开
      await Taro.openDocument({
        filePath: tempFilePath,
        fileType: 'pdf',
        showMenu: true // 显示右上角菜单（分享/保存等）
      });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '协议加载失败',
        icon: 'error',
        duration: 2000
      });
      console.error('协议预览失败:', error);
    }
  };

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
        {selectedMethod === "phone" && phoneNumber && (
          <View className="contact-preference-form">
            {/* 手机号码输入 */}
              <View className="current-phone-number">
                <Text className="current-phone-number-label">当前手机号：</Text>
                <Text className="current-phone-number-value">{phoneNumber}</Text>
              </View>
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
        {selectedMethod === "phone" ?(
          <button
            openType={isAgreed ? "getPhoneNumber" : undefined}
            onGetPhoneNumber={getPhoneNumber}
            className="figma-customize-button primary"
            onClick={() => {
              if (!isAgreed) {
                Taro.showToast({
                  title: "请先同意服务条款和隐私政策",
                  icon: "none",
                });
              }
            }}
          >
            <Text className="figma-button-text primary">{!phoneNumber ? "一键获取手机号" : "一键更换手机号"}</Text>
          </button>
        ) : (
          <CrystalButton
            onClick={() => handleSave({ selectedMethod: selectedMethod, phoneCode: phoneCode })}
            text="保存"
            isPrimary={true}
            style={{ width: "220px" }}
          />
        )}
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
        <View className="agreement-checkbox" onClick={() => setIsAgreed(prev => !prev)}>
          {/* <View
            className={`checkbox ${isAgreed ? "" : "unchecked"}`}
            onClick={() => setIsAgreed(prev => !prev)}
          >
            {isAgreed && (
              <img src={checkIcon} alt="已同意" className="check-icon" />
            )}
          </View> */}
          <Checkbox checked={isAgreed}  />
          <Text className="agreement-text">
            已阅读并同意
            <Text
              className="link"
              onClick={(e) => {
                // 打开用户协议页面
                e.stopPropagation();
                previewDoc(SERVICE_DOC_PDF_URL);
              }}
            >
              {" "}
              服务条款{" "}
            </Text>
            和
            <Text
              className="link"
              onClick={(e) => {
                e.stopPropagation();
                // 打开隐私政策页面
                previewDoc(PRIVACY_POLICY_PDF_URL)
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
