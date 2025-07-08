import { useState, useEffect } from "react";
import { View, Input, Button, Text, Image } from "@tarojs/components";
import Taro, { navigateTo, showToast } from "@tarojs/taro";
import styles from "./index.module.scss";
import { MerchantAuthManager } from "@/utils/auth-merchant";
import MerchantHeader from "@/components/MerchantHeader";
import { pageUrls } from "@/config/page-urls";
import { LinkUtils } from "@/utils/linkUtils";

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
    <View className={styles.loginPage}>
      <MerchantHeader title="商家管理后台" />
      <View className={styles.loginContainer}>
        <View className={styles.loginHeader}>
          <Text className={styles.loginTitle}>商家管理后台</Text>
          <Text className={styles.loginSubtitle}>请使用手机号登录</Text>
        </View>

        <View className={styles.loginForm}>
          <View className={styles.formItem}>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="请输入手机号"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
              maxlength={11}
            />
          </View>

          <View className={styles.formItem}>
            <Input
              className={styles.formInput}
              password
              placeholder="请输入密码"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <Button
            className={styles.loginBtn}
            onClick={handleLogin}
            loading={loading}
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </View>

        <View
          className={styles.loginFooter}
          onClick={() =>
            LinkUtils.openExternalUrl(
              "https://wcny9i0iojri.feishu.cn/share/base/form/shrcnORTv1xvukgDCYwa5IsNJgf",
              "商家注册"
            )
          }
        >
          <Text className={styles.footerText}>没有账号？点击注册</Text>
        </View>
      </View>
    </View>
  );
}
