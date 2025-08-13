import React, { useCallback } from "react";
import { View } from "@tarojs/components";
import CrystalButton from "../CrystalButton";
import "./styles/RingOperationControls.scss";

interface RingOperationControlsProps {
  selectedBeadIndex: number;
  onClockwiseMove: () => void;
  onCounterclockwiseMove: () => void;
  onDelete: () => void;
}

/**
 * 圆环操作控制组件
 * 负责珠子的移动、删除等操作控制
 */
const RingOperationControls: React.FC<RingOperationControlsProps> = ({
  selectedBeadIndex,
  onClockwiseMove,
  onCounterclockwiseMove,
  onDelete,
}) => {
  const handleClockwiseMove = useCallback(() => {
    onClockwiseMove();
  }, [selectedBeadIndex, onClockwiseMove]);

  const handleCounterclockwiseMove = useCallback(() => {
    onCounterclockwiseMove();
  }, [selectedBeadIndex, onCounterclockwiseMove]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [selectedBeadIndex, onDelete]);

  return (
    <View className="ring-operation-controls">
      <CrystalButton 
        onClick={handleCounterclockwiseMove} 
        text="右移" 
        style={{ height: "36px" }} 
      />
      <CrystalButton 
        onClick={handleClockwiseMove} 
        text="左移" 
        style={{ height: "36px" }} 
      />
      <CrystalButton 
        onClick={handleDelete} 
        text="删除" 
        style={{ height: "36px" }} 
      />
    </View>
  );
};

export default React.memo(RingOperationControls);
