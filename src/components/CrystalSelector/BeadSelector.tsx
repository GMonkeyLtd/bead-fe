import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Image, Text } from "@tarojs/components";
import "./styles/BeadSelector.scss";
import CategorySelector from "./CategorySelector";
import BeadItem from "./BeadItem";
import {
  AccessoryType,
  AccessoryItem,
  AccessoryFormatMap,
  BeadItem as BeadItemType,
} from "@/utils/api-session";
import LoadingIcon from "../LoadingIcon";
import { SPU_TYPE } from "@/pages-design/custom-design/index";



export interface BeadType {
  name: string;
  image_url: string;
  beadList: BeadItemType[];
  beadSizeList: number[];
}

interface BeadSelectorProps {
  beadTypeMap: Record<string, BeadType[]>;
  accessoryTypeMap: Record<AccessoryType, BeadType[]>;
  currentWuxing: string;
  currentAccessoryType: AccessoryType | "";
  renderRatio: number;
  predictedLength: number;
  styleHeight: string;
  onWuxingChange: (wuxing: string) => void;
  onAccessoryTypeChange: (accessoryType: BeadType) => void;
  onBeadClick: (bead: BeadType, action: "add" | "replace" | "select") => void;
  currentSelectedBead: BeadItemType;
}

const BeadSelector: React.FC<BeadSelectorProps> = ({
  beadTypeMap,
  accessoryTypeMap,
  currentWuxing,
  currentAccessoryType,
  renderRatio,
  predictedLength,
  styleHeight,
  onWuxingChange,
  onAccessoryTypeChange,
  onBeadClick,
  currentSelectedBead,
}) => {
  const [curType, setCurType] = useState<"crystal" | "accessories">("crystal");
  const allWuxing = useMemo(() => {
    const wuxingKeys = Object.keys(beadTypeMap);
    // 添加"精选"作为第一个选项
    return [...wuxingKeys];
  }, [beadTypeMap]);

  const handleBeadClick = useCallback(
    (bead: BeadType, action: "add" | "replace" | "select") => {
      onBeadClick({
        ...bead
      }, action);
    },
    [onBeadClick]
  );

  const handleWuxingChange = useCallback(
    (wuxing: string) => {
      if (wuxing === "精选") {
        // 精选模式：显示所有珠子
        onWuxingChange("all");
      } else {
        onWuxingChange(wuxing);
      }
    },
    [onWuxingChange]
  );

  const renderBeads = () => {
    let typeBeads;
    if (currentWuxing === "all" || currentWuxing === "精选") {
      // 精选模式：显示所有珠子
      typeBeads = Object.values(beadTypeMap).flat();
    } else {
      typeBeads = beadTypeMap[currentWuxing] || [];
    }

    if (!typeBeads || typeBeads.length === 0) return null;

    return (
      <View
        key={currentWuxing}
        className="bead-selector-content hide-scrollbar"
      >
        {typeBeads?.map((typeBead: BeadType) => (
          <View key={`${typeBead.name}`} className="bead-type-section">
            <BeadItem
              imageUrl={typeBead.image_url}
              name={typeBead.name}
              specifications={typeBead.beadSizeList.join(", ")}
              onAddClick={() => handleBeadClick(typeBead, "add")}
              onReplaceClick={() => handleBeadClick(typeBead, "replace")}
              showReplaceButton={currentSelectedBead && currentSelectedBead?.name !== typeBead.name}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderAccessoryBeads = () => {
    if (!currentAccessoryType) return null;
    const accessoryBeads = accessoryTypeMap[currentAccessoryType] || [];
    console.log('accessoryBeads', accessoryBeads);
    if (!accessoryBeads || accessoryBeads.length === 0) return null;
    return (
      <View
        key={currentAccessoryType}
        className="bead-selector-content hide-scrollbar"
      >
        {accessoryBeads?.map((accessory: BeadType) => (
          <View key={`${accessory.name}`} className="bead-type-section">
          <BeadItem
            imageUrl={accessory.image_url}
            name={accessory.name}
            specifications={accessory.beadSizeList.join(", ")}
            onAddClick={() => handleBeadClick(accessory, "add")}
            onReplaceClick={() => handleBeadClick(accessory, "replace")}
            showReplaceButton={currentSelectedBead && currentSelectedBead?.name !== accessory.name}
          />
        </View>
        ))}
      </View>
    );
  };

  const renderCrystalTypes = () => {
    return (
      <View className="wuxing-tabs">
        {allWuxing.map((wuxing) => {
          const isActive =
            (wuxing === "精选" && currentWuxing === "all") ||
            (wuxing === currentWuxing && wuxing !== "精选");
          const beadCount =
            wuxing === "精选"
              ? Object.values(beadTypeMap).reduce(
                (total, beads) => total + beads.length,
                0
              )
              : beadTypeMap[wuxing]
                ? beadTypeMap[wuxing].length
                : 0;

          return (
            <View
              key={wuxing}
              className={`wuxing-tab ${isActive ? "active" : ""}`}
              onClick={() => handleWuxingChange(wuxing)}
            >
              {wuxing}
              {beadCount > 0 && (
                <Text className="bead-count">({beadCount})</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderAccessoryTypes = () => {
    return (
      <View className="wuxing-tabs">
        {Object.keys(accessoryTypeMap || {}).map((accType) => {

          const isActive = accType == currentAccessoryType;
          const beadCount = accessoryTypeMap[accType]
            ? accessoryTypeMap[accType].length
            : 0;
          return (
            <View
              key={accType}
              className={`wuxing-tab ${isActive ? "active" : ""}`}
              onClick={() => onAccessoryTypeChange(accType as AccessoryType)}
            >
              {AccessoryFormatMap[accType]}
              {beadCount > 0 && (
                <Text className="bead-count">({beadCount})</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View className="bead-selector-container" style={{ height: styleHeight }}>
      {/* 水平Tab选择器 */}
      <View className="bead-selector-tabs-container">
        {curType === "crystal" && renderCrystalTypes()}
        {curType === "accessories" && renderAccessoryTypes()}
        {curType === "crystal" && renderBeads()}
        {curType === "accessories" && renderAccessoryBeads()}
      </View>
      {
        Object.keys(beadTypeMap).length === 0 && Object.keys(accessoryTypeMap).length === 0 ? (
          <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <LoadingIcon /> 
          </View>
        ) : (
            <CategorySelector
              selectedCategory={curType}
              onCategoryChange={(categoryKey) => {
                if (categoryKey === "crystal") {
                  onWuxingChange(allWuxing[0]);
                } else {
                  onAccessoryTypeChange(AccessoryType.GeHuan);
                }
                setCurType(categoryKey as "crystal" | "accessories");
              }}
            />
          )
      }
    </View>
  );
};

export default React.memo(BeadSelector);
