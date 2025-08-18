import React, { useCallback, useMemo, useState } from "react";
import { View, Image, Text } from "@tarojs/components";
import "./styles/BeadSelector.scss";
import CategorySelector from "./CategorySelector";
import {
  AccessoryType,
  AccessoryItem,
  AccessoryFormatMap,
} from "@/utils/api-session";

interface Bead {
  id?: string | number;
  name: string;
  image_url: string;
  diameter: number;
}

interface BeadType {
  name: string;
  beadList: Bead[];
}

interface BeadSelectorProps {
  beadTypeMap: Record<string, BeadType[]>;
  accessoryTypeMap: Record<AccessoryType, AccessoryItem[]>;
  currentWuxing: string;
  currentAccessoryType: AccessoryType | "";
  renderRatio: number;
  predictedLength: number;
  onWuxingChange: (wuxing: string) => void;
  onAccessoryTypeChange: (accessoryType: AccessoryType) => void;
  onBeadClick: (bead: Bead) => void;
}

const BeadSelector: React.FC<BeadSelectorProps> = ({
  beadTypeMap,
  accessoryTypeMap,
  currentWuxing,
  currentAccessoryType,
  renderRatio,
  predictedLength,
  onWuxingChange,
  onAccessoryTypeChange,
  onBeadClick,
}) => {
  const [curType, setCurType] = useState<"crystal" | "accessories">("crystal");
  const allWuxing = useMemo(() => {
    const wuxingKeys = Object.keys(beadTypeMap);
    // 添加"精选"作为第一个选项
    return [...wuxingKeys];
  }, [beadTypeMap]);

  const handleBeadClick = useCallback(
    (bead: Bead) => {
      onBeadClick(bead);
    },
    [predictedLength, onBeadClick]
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
            <View className="bead-list-container">
              {typeBead.beadList
                .sort((a, b) => a.diameter - b.diameter)
                .map((beadItem) => (
                  <View
                    key={`${beadItem.name}-${beadItem.diameter}`}
                    className="bead-item"
                    onClick={() => handleBeadClick(beadItem)}
                  >
                    <View className="bead-image-container">
                      <Image
                        src={beadItem.image_url}
                        className="bead-image"
                        style={{
                          width: `${beadItem.diameter * renderRatio}px`,
                          height: `${beadItem.diameter * renderRatio}px`,
                        }}
                      />
                    </View>
                    <View className="bead-name">{beadItem.name}</View>
                    <View className="bead-diameter">{beadItem.diameter}mm</View>
                  </View>
                ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAccessoryBeads = () => {
    if (!currentAccessoryType) return null;
    const accessoryBeads = accessoryTypeMap[currentAccessoryType] || [];

    if (!accessoryBeads || accessoryBeads.length === 0) return null;
    return (
      <View
        key={currentAccessoryType}
        className="accessories-selector-content hide-scrollbar"
      >
        {accessoryBeads?.map((accessory: AccessoryItem) => (
            <View
              key={`${accessory.name}-${accessory.diameter}-${accessory.width}`}
              className="bead-item"
              onClick={() => handleBeadClick(accessory)}
            >
              <View className="bead-image-container">
                <Image
                  src={accessory.image_url}
                  className="bead-image"
                  style={{
                    width: `${accessory.width * renderRatio}px`,
                    height: `${accessory.diameter * renderRatio}px`,
                  }}
                />
              </View>
              <View className="bead-name">{accessory.name}</View>
              <View className="bead-diameter">{accessory.diameter}mm</View>
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
              onClick={() => onAccessoryChange(accType as AccessoryType)}
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
    <View className="bead-selector-container">
      <CategorySelector
        selectedCategory={curType}
        onCategoryChange={(categoryKey) => {
          if (categoryKey === "crystal") {
            onWuxingChange(allWuxing[0]);
          } else {
            console.log(AccessoryType.GeHuan, 'change')
            onAccessoryTypeChange(AccessoryType.GeHuan);
          }
          setCurType(categoryKey as "crystal" | "accessories");
        }}
      />
      {/* 水平Tab选择器 */}
      {curType === "crystal" && renderCrystalTypes()}
      {curType === "accessories" && renderAccessoryTypes()}
      {curType === "crystal" && renderBeads()}
      {curType === "accessories" && renderAccessoryBeads()}
    </View>
  );
};

export default React.memo(BeadSelector);
