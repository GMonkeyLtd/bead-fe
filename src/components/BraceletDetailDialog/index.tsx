import React, { useState } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalButton from "../CrystalButton";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import { BeadDetailList } from "../BraceletInfo";

interface BraceletDetailDialogProps {
  visible: boolean;
  title?: string;
  beads?: any[];
  onClose?: () => void;
}

const BraceletDetailDialog: React.FC<BraceletDetailDialogProps> = ({
  title,
  visible,
  beads,
  onClose,
}) => {
  const { keyboardHeight } = useKeyboardHeight();

  return (
    <View
      className={`bracelet-detail-dialog-overlay ${visible ? "visible" : ""}`}
      onClick={onClose}
      style={{ height: `calc(100vh - ${keyboardHeight}px)` }}
    >
      <View className="bracelet-detail-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 标题区域 */}
        <View className="bracelet-detail-dialog-header">
          <View className="bracelet-detail-dialog-title-section">
            <View className="bracelet-detail-dialog-title-group">
              <Text className="bracelet-detail-dialog-main-title">{title}</Text>
            </View>
          </View>
        </View>

        {/* 主要内容区域 */}
        <View className="bracelet-detail-dialog-content">
          <BeadDetailList beads={beads} />
        </View>

        {/* 确认按钮 */}
        <View style={{ display: "flex", justifyContent: "center" }}>
          <CrystalButton
            style={{ width: "220px", height: "46px", margin: "36px 0 0" }}
            onClick={onClose}
            text="确定"
            // icon={
            //   <Image
            //     src={rightArrowGolden}
            //     style={{ width: "16px", height: "10px" }}
            //   />
            // }
            isPrimary
          />
        </View>
      </View>
    </View>
  );
};

export default BraceletDetailDialog;
