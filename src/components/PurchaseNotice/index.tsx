import React from "react";
import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import orderIcon from "@/assets/icons/purchase-notice/order-icon.svg";
import prepareIcon from "@/assets/icons/purchase-notice/prepare-icon.svg";
import confirmIcon from "@/assets/icons/purchase-notice/confirm-icon.svg";
import inspectIcon from "@/assets/icons/purchase-notice/inspect-icon.svg";
import deliverIcon from "@/assets/icons/purchase-notice/deliver-icon.svg";
import arrow1 from "@/assets/icons/purchase-notice/arrow-1.svg";
import arrow2 from "@/assets/icons/purchase-notice/arrow-2.svg";
import arrow3 from "@/assets/icons/purchase-notice/arrow-3.svg";
import arrow4 from "@/assets/icons/purchase-notice/arrow-4.svg";
import { MAIN_ZE_IMAGE_URL, WRIST_SIZE_IMAGE_URL } from "@/config";
import "./index.scss";

interface PurchaseNoticeProps {
  title?: string;
  notices?: string[];
  showProcess?: boolean;
}

const PurchaseNotice: React.FC<PurchaseNoticeProps> = ({
  title = "购买须知",
  notices = [
    {
      title: "实物图确认",
      content:
        "支付后请添加客服微信（客服也会主动添加您的微信，记得通过一下～），确认订单明细后排期制作，手串制作好后客服会跟您确认实物图，不满意可以临时调整，退补差价，也可以直接全额退款～",
    },
    {
      title: "证书",
      content:
        "手串实拍图确认后会及时送检，目前证书都是免费的，检验单位是北京中地检/江苏中质检，检验资质齐全",
    },
    {
      title: "退换手串",
      content: "手串发货前可以随时退款，发货后非质量问题不支持退噢",
    },
    {
      title: "手围准确",
      content:
        "下单前请务必确认手围正确，不清楚自己手围的宝子可以联系客服协助噢！",
    },
  ],
  showProcess = true,
}) => {
  const processSteps = [
    { icon: orderIcon, label: "下单" },
    { icon: prepareIcon, label: "配货" },
    { icon: confirmIcon, label: "实物确认" },
    { icon: inspectIcon, label: "送检" },
    { icon: deliverIcon, label: "发货" },
  ];

  const arrows = [arrow1, arrow2, arrow3, arrow4];

  return (
    <View className="purchase-notice-container">
      {/* 标题 */}
      <View className="purchase-notice-title">
        <Text>{title}</Text>
      </View>

      {/* 购买须知内容 */}
      <View className="purchase-notice-content">
        {notices.map((notice, index) => (
          <View key={index} style={{ lineHeight: 1}}>
            <View className="purchase-notice-item-title">{`${notice.title}：`}</View>
            <View className="purchase-notice-item-content">
              {notice.content}
            </View>
          </View>
        ))}
      </View>

      <View className="purchase-notice-wrist-size">
        <Image src={WRIST_SIZE_IMAGE_URL} mode="aspectFit" onClick={() => Taro.previewImage({
          urls: [WRIST_SIZE_IMAGE_URL],
        })} />
      </View> 
      <View className="purchase-notice-main-ze">
        <Image src={MAIN_ZE_IMAGE_URL} mode="aspectFit" onClick={() => Taro.previewImage({
          urls: [MAIN_ZE_IMAGE_URL],
        })} />
      </View>

      {/* 流程步骤 */}
      {showProcess && (
        <View className="purchase-notice-process">
          <View className="purchase-notice-process-bg">
            <View className="purchase-notice-steps">
              {processSteps.map((step, index) => (
                <React.Fragment key={index}>
                  <View className="purchase-notice-step">
                    <View className="purchase-notice-step-icon">
                      <Image src={step.icon} mode="aspectFit" />
                    </View>
                    <Text className="purchase-notice-step-label">
                      {step.label}
                    </Text>
                  </View>
                  {index < processSteps.length - 1 && (
                    <View className="purchase-notice-arrow">
                      <Image src={arrows[index]} mode="aspectFit" />
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PurchaseNotice;
