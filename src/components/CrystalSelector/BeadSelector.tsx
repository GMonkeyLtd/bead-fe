import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text } from "@tarojs/components";
import "./styles/BeadSelector.scss";
import CategorySelector from "./CategorySelector";
import BeadItem from "./BeadItem";
import {
  AccessoryType,
  AccessoryFormatMap,
  AccessoryDisplayOrder,
  BeadItem as BeadItemType,
} from "@/utils/api-session";
import LoadingIcon from "../LoadingIcon";



export interface BeadType {
  type: AccessoryType;
  name: string;
  image_url: string;
  beadList: BeadItemType[];
  beadSizeList: number[];
  minimalPrice: number;
}

interface BeadSelectorProps {
  beadTypeMap: Record<string, BeadType[]>;
  accessoryTypeMap: Record<AccessoryType, BeadType[]>;
  currentWuxing: string;
  currentAccessoryType: AccessoryType | "";
  styleHeight?: string;
  onWuxingChange: (wuxing: string) => void;
  onAccessoryTypeChange: (accessoryType: AccessoryType) => void;
  onBeadClick: (bead: BeadType, action: "add" | "replace" | "select") => void;
  currentSelectedBead: BeadItemType;
  onBeadImageClick: (bead: BeadType) => void;
  recommendWuxing?: string[];
}

const BeadSelector: React.FC<BeadSelectorProps> = ({
  beadTypeMap,
  accessoryTypeMap,
  currentWuxing,
  currentAccessoryType,
  styleHeight,
  onWuxingChange,
  onAccessoryTypeChange,
  onBeadClick,
  currentSelectedBead,
  onBeadImageClick,
  recommendWuxing = [],
}) => {
  const [curType, setCurType] = useState<"crystal" | "accessories">("crystal");
  const allWuxing = useMemo(() => {
    const fixedOrder = ['金', '木', '水', '火', '土'];
    if (beadTypeMap['推荐']) {
      return ['推荐', ...fixedOrder];
    }
    return fixedOrder;
  }, [beadTypeMap]);

  const hasRecommendedRef = useRef(false);

  React.useEffect(() => {
    const hasRecommended = !!beadTypeMap['推荐'];
    const prevHasRecommended = hasRecommendedRef.current;

    // Case 1: Recommended JUST appeared (Auto-select)
    if (hasRecommended && !prevHasRecommended) {
      onWuxingChange('推荐');
    }
    // Case 2: Recommended JUST disappeared (Fallback)
    else if (!hasRecommended && prevHasRecommended && currentWuxing === '推荐') {
      onWuxingChange('金');
    }

    hasRecommendedRef.current = hasRecommended;
  }, [beadTypeMap, currentWuxing, onWuxingChange]);

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
              onBeadImageClick={() => onBeadImageClick(typeBead)}
              minimalPrice={typeBead.minimalPrice}
            />
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
              imageNeedRotate={accessory.type === AccessoryType.GuaShi}
              onBeadImageClick={() => onBeadImageClick(accessory)}
              minimalPrice={accessory.minimalPrice}
            />
          </View>
        ))}
      </View>
    );
  };

  console.log(beadTypeMap, accessoryTypeMap, "beadTypeMap, accessoryTypeMap");

  const renderCrystalTypes = () => {
    const showAnnotation = beadTypeMap['推荐'] && recommendWuxing?.length > 0 && currentWuxing === '推荐';

    return (
      <View className={`wuxing-tabs-wrapper ${showAnnotation ? 'with-annotation' : 'without-annotation'}`}>
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
                className={`wuxing-tab ${isActive ? "active" : ""} ${wuxing === '推荐' ? 'wuxing-tab-recommended' : ''}`}
                onClick={() => handleWuxingChange(wuxing)}
              >
                <Text>{wuxing}</Text>
                {beadCount > 0 && (
                  <Text className="bead-count">({beadCount})</Text>
                )}
              </View>
            );
          })}
        </View>
        {showAnnotation && (
          <View className="xi-yong-annotation">
            <Text className="xi-yong-text">
              * {recommendWuxing.join('')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAccessoryTypes = () => {
    return (
      <View className="wuxing-tabs">
        <View className="wuxing-tabs-inner">
          {AccessoryDisplayOrder.map((accType) => {
            const isActive = accType == currentAccessoryType;
            const beadCount = accessoryTypeMap[accType]
              ? accessoryTypeMap[accType].length
              : 0;
            return (
              <View
                key={accType}
                className={`wuxing-tab ${isActive ? "active" : ""}`}
                onClick={() => onAccessoryTypeChange(accType)}
              >
                {AccessoryFormatMap[accType]}
                {beadCount > 0 && (
                  <Text className="bead-count">({beadCount})</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View
      className={`bead-selector-container ${styleHeight ? '' : 'bead-selector-container-flex'}`}
      style={styleHeight ? { height: styleHeight } : undefined}
    >
      {/* 水平Tab选择器 */}
      <View className="bead-selector-tabs-container">
        {curType === "crystal" && renderCrystalTypes()}
        {curType === "accessories" && renderAccessoryTypes()}
        {curType === "crystal" && renderBeads()}
        {curType === "accessories" && renderAccessoryBeads()}
      </View>
      {
        Object.keys(beadTypeMap).length === 0 && Object.keys(accessoryTypeMap).length === 0 ? (
          <View className="bead-selector-loading-container">
            <LoadingIcon />
          </View>
        ) : (
          <CategorySelector
            selectedCategory={curType}
            onCategoryChange={(categoryKey) => {
              if (categoryKey === "crystal") {
                onWuxingChange(allWuxing[0]);
              } else {
                onAccessoryTypeChange(AccessoryType.SuiXing);
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
