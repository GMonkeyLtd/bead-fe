import React, { useCallback, useMemo } from "react";
import { View, Image } from "@tarojs/components";
import "./styles/BeadSelector.scss";

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
  currentWuxing: string;
  renderRatio: number;
  predictedLength: number;
  onWuxingChange: (wuxing: string) => void;
  onBeadClick: (bead: Bead) => void;
}

const BeadSelector: React.FC<BeadSelectorProps> = ({
  beadTypeMap,
  currentWuxing,
  renderRatio,
  predictedLength,
  onWuxingChange,
  onBeadClick,
}) => {
  const allWuxing = useMemo(() => Object.keys(beadTypeMap), [beadTypeMap]);

  const handleBeadClick = useCallback((bead: Bead) => {
    onBeadClick(bead);
  }, [predictedLength, onBeadClick]);

  const renderBeads = () => {
    const typeBeads = beadTypeMap[currentWuxing] || [];
    if (!typeBeads || typeBeads.length === 0) return null;

    return (
      <View
        key={currentWuxing}
        className="bead-selector-content hide-scrollbar"
      >
        {typeBeads?.map((typeBead: BeadType) => (
          <View
            key={`${typeBead.name}`}
            className="bead-type-section"
          >
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

  return (
    <View className="bead-selector-container">
      {/* 左侧纵向Tab选择器 */}
      <View className="wuxing-tabs">
        {allWuxing.map((wuxing) => (
          <View
            key={wuxing}
            className={`wuxing-tab ${currentWuxing === wuxing ? 'active' : ''}`}
            onClick={() => onWuxingChange(wuxing)}
          >
            {wuxing}
            {beadTypeMap[wuxing] && beadTypeMap[wuxing].length > 0 && (
              <View className="bead-count">
                ({beadTypeMap[wuxing].length}个)
              </View>
            )}
          </View>
        ))}
      </View>
      {renderBeads()}
    </View>
  );
};

export default React.memo(BeadSelector);
