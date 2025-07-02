import { useState, useEffect } from "react";
import { View, Input, Button, Text, Image } from "@tarojs/components";
import Taro, { navigateTo, showToast } from "@tarojs/taro";
import "./index.scss";  
import { MerchantAuthManager } from "@/utils/auth-merchant";
import MerchantHeader from "@/components/MerchantHeader";
import { pageUrls } from "@/config/page-urls";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isLogin = MerchantAuthManager.checkLogin();
    console.log(isLogin, "isLogin");
    if (isLogin) {
      navigateTo({
        url: pageUrls.merchantGrabOrders,
      });
    }
  }, []);

  const handleLogin = async () => {
    if (!phone) {
      showToast({
        title: "请输入手机号",
        icon: "none",
      });
      return;
    }

    if (!password) {
      showToast({
        title: "请输入密码",
        icon: "none",
      });
      return;
    }

    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      showToast({
        title: "请输入正确的手机号",
        icon: "none",
      });
      return;
    }

    setLoading(true);

    try {
      await MerchantAuthManager.login({ phone, password });

      showToast({
        title: "登录成功",
        icon: "success",
      });
      setTimeout(() => {
        navigateTo({
          url: pageUrls.merchantGrabOrders,
        });
      }, 1000);
    } catch (error) {
      console.error(error, "error");
      showToast({
        title: "登录失败，请重试",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="login-page">
      <MerchantHeader title="商家管理后台" />
      <View className="login-container">
        <View className="login-header">
          <Text className="login-title">商家管理后台</Text>
          <Text className="login-subtitle">请使用手机号登录</Text>
        </View>

        <View className="login-form">
          <View className="form-item">
            <Input
              className="form-input"
              type="number"
              placeholder="请输入手机号"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
              maxlength={11}
            />
          </View>

          <View className="form-item">
            <Input
              className="form-input"
              password
              placeholder="请输入密码"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <Button
            className="login-btn"
            onClick={handleLogin}
            loading={loading}
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </View>

        <View className="login-footer">
          <Text className="footer-text">没有账号？请联系管理员注册</Text>
        </View>
      </View>
    </View>
  );
}
