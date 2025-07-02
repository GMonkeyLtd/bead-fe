import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { makePhoneCall, showToast, setClipboardData } from '@tarojs/taro';
import './index.scss';
import closeIcon from '@/assets/icons/close.svg';
import copyIcon from '@/assets/icons/copy.svg';

interface UserInfo {
  default_contact: number; // 0: 电话, 1: 微信
  phone?: string;
  wechat?: string;
}

interface ContactUserDialogProps {
  visible: boolean;
  userInfo: UserInfo;
  onClose: () => void;
}

const ContactUserDialog: React.FC<ContactUserDialogProps> = ({
  visible,
  userInfo,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  console.log(userInfo, "userInfo");

  // 格式化电话号码显示
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // 隐藏中间4位数字
    const phoneStr = phone.toString();
    if (phoneStr.length >= 7) {
      return `${phoneStr.slice(0, 3)} **** ${phoneStr.slice(-3)}`;
    }
    return phoneStr;
  };

  // 拨打电话
  const handleCallPhone = async () => {
    if (!userInfo.phone) {
      showToast({
        title: '电话号码不存在',
        icon: 'none',
      });
      return;
    }

    try {
      await makePhoneCall({
        phoneNumber: userInfo.phone.toString(),
      });
    } catch (error) {
      showToast({
        title: '拨号失败',
        icon: 'none',
      });
    }
  };

  // 复制联系方式
  const handleCopyContact = async () => {
    const contactInfo = userInfo.default_contact === 0 
      ? userInfo.phone?.toString() 
      : userInfo.wechat_id;

    if (!contactInfo) {
      showToast({
        title: '联系方式不存在',
        icon: 'none',
      });
      return;
    }

    try {
      await setClipboardData({
        data: contactInfo,
      });
      showToast({
        title: '已复制到剪贴板',
        icon: 'success',
      });
    } catch (error) {
      showToast({
        title: '复制失败',
        icon: 'none',
      });
    }
  };

  // 联系微信用户
  const handleContactWechat = () => {
    if (!userInfo.wechat_id) {
      showToast({
        title: '微信号不存在',
        icon: 'none',
      });
      return;
    }

    showToast({
      title: `请添加微信：${userInfo.wechat}`,
      icon: 'none',
      duration: 3000,
    });
  };

  const renderContactInfo = () => {
    if (userInfo.default_contact === 0) {
      // 电话联系
      return (
        <View className='contact-info-card' onClick={handleCallPhone}>
          <Text className='contact-number'>
            {formatPhoneNumber(userInfo.phone || '')}
          </Text>
          <View className='contact-dialog-copy-icon' onClick={(e) => {
            e.stopPropagation();
            handleCopyContact();
          }}>
            <Image src={copyIcon} style={{ width: '16px', height: '16px' }} />
          </View>
        </View>
      );
    } else {
      // 微信联系
      return (
        <View className='contact-info-card' onClick={handleContactWechat}>
          <Text className='contact-number'>
            微信号：{userInfo.wechat_id || '未提供'}
          </Text>
          <View className='contact-dialog-copy-icon' onClick={(e) => {
            e.stopPropagation();
            handleCopyContact();
          }}>
            <Image src={copyIcon} style={{ width: '16px', height: '16px' }} />
          </View>
        </View>
      );
    }
  };

  return (
    <View className='contact-dialog-overlay'>
      <View className='contact-dialog'>
        {/* 头部区域 */}
        <View className='contact-dialog-content'>
          <View className='contact-dialog-header'>
            <View className='contact-dialog-header-title'>
              <Text className='contact-dialog-title-text'>
                {userInfo.default_contact === 0 ? '用户手机号' : '用户微信号'}
              </Text>
              <Image src={closeIcon} style={{ width: '20px', height: '20px' }} onClick={onClose}/>
            </View>
            {/* <Text className='subtitle-text'>给商家的一句话，商家手册</Text> */}
          </View>

          {/* 联系信息区域 */}
          {renderContactInfo()}
        </View>

        {/* 底部按钮 */}
        <View className='contact-dialog-footer'>
          <View className='contact-dialog-return-btn' onClick={onClose}>
            <Text className='contact-dialog-return-text'>返回</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ContactUserDialog; 