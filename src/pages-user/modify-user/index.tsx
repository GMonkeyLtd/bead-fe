import { useEffect, useState } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "@/components/PageContainer";
import CrystalButton from "@/components/CrystalButton";
import { userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import modifyUserStyle from "./index.module.scss";
import { goBack } from "@/utils/common";
import { imageToBase64 } from "@/utils/imageUtils";
import rightArrowIcon from "@/assets/icons/right-arrow.svg";

const ModifyUser = () => {
  const [nickName, setNickName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [originalNickName, setOriginalNickName] = useState("");
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const getUserInfo = async () => {
    try {
      const res = await userApi.getUserInfo();
      const { nick_name, avatar_url } = (res as any)?.data || {};
      const displayNickName = nick_name || "";
      const displayAvatarUrl =
        avatar_url ||
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/default-avatar.png";

      setNickName(displayNickName);
      setAvatarUrl(displayAvatarUrl);
      setOriginalNickName(displayNickName);
      setOriginalAvatarUrl(displayAvatarUrl);
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  // 选择头像
  const handleChooseAvatar = async (e) => {
    const { avatarUrl: newAvatarUrl } = e.detail;
    try {
      setAvatarUrl(newAvatarUrl);
    } catch (error) {
      console.error("选择头像失败:", error);
      Taro.showToast({
        title: "选择头像失败",
        icon: "none",
      });
    }
  };

  // 检查是否有更改
  const hasChanges = () => {
    return nickName !== originalNickName || avatarUrl !== originalAvatarUrl;
  };

  // 保存用户信息
  const handleSave = async () => {
    if (!hasChanges()) {
      Taro.showToast({
        title: "没有更改需要保存",
        icon: "none",
      });
      return;
    }

    if (!nickName.trim()) {
      Taro.showToast({
        title: "请输入昵称",
        icon: "none",
      });
      return;
    }

    try {
      const data: any = {};
      if (nickName) {
        data.nick_name = nickName.trim();
      }
      if (avatarUrl !== originalAvatarUrl) {
        const base64 = await imageToBase64(avatarUrl);
        data.avatar_base64 = base64;
      }
      await userApi.updateUser(data);

      Taro.showToast({
        title: "保存成功",
        icon: "success",
      });

      // 保存成功后的跳转逻辑
      setTimeout(() => {
        goBack();
      }, 1500);
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({
        title: "保存失败",
        icon: "none",
      });
    }
  };

  const handleContactInfo = () => {
    Taro.navigateTo({
      url: pageUrls.contactPreference,
    });
  };

  return (
    <PageContainer
      headerContent={
        <Text className={modifyUserStyle.modifyUserTitle}>编辑资料</Text>
      }
    >
      {/* <View className={modifyUserStyle.modifyUserHeader}>
        <Text className={modifyUserStyle.modifyUserTitle}>编辑资料</Text>
      </View> */}
      <View className={modifyUserStyle.modifyUserContainer}>
        {/* 头像区域 */}
        <View className={modifyUserStyle.avatarSection}>
          {/* <Text className={modifyUserStyle.sectionTitle}>头像</Text> */}
          <button
            openType="chooseAvatar"
            onChooseAvatar={handleChooseAvatar}
            className={modifyUserStyle.avatarChooseButton}
          >
            <View
              className={modifyUserStyle.avatarContainer}
              // onClick={handleChooseAvatar}
            >
              <Image
                src={avatarUrl}
                className={modifyUserStyle.avatar}
                mode="aspectFill"
              />
            </View>
          </button>
        </View>

        {/* 昵称区域 */}
        <View className={modifyUserStyle.nicknameSection}>
          <Text className={modifyUserStyle.sectionTitle}>昵称</Text>
          <Input
            className={modifyUserStyle.nicknameInput}
            value={nickName}
            onInput={(e) => setNickName(e.detail.value)}
            placeholder="请输入昵称"
            maxlength={20}
            type="nickname"
          />
          <Text className={modifyUserStyle.inputHint}>昵称最多20个字符</Text>
        </View>
      </View>
      <View className={modifyUserStyle.contactInfo} onClick={handleContactInfo}>
        <View>
          联系方式
        </View>
        <View>
          <Image 
            src={rightArrowIcon}
            mode="aspectFit"
            style={{ width: "18px" }}
          />
        </View>
      </View>
      {/* 底部操作区域 */}
      <View className={modifyUserStyle.modifyUserFooter}>
        <CrystalButton
          onClick={handleSave}
          text="保存"
          isPrimary
          style={{ width: "180px" }}
        />
      </View>
    </PageContainer>
  );
};

export default ModifyUser;
