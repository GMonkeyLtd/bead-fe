import { View, Button } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalBeads from "@/components/CrystalBeads";
import api from "@/utils/api";
import CircleRing from "@/components/CircleRing";
import { calculateDotCount } from "@/utils/cystal-tools";

const ALL_CRYSTAL_IMAGES = [
  "https://crystal-ring.cn-sh2.ufileos.com/images/000.png",
  "https://crystal-ring.cn-sh2.ufileos.com/images/11.png",
  "https://crystal-ring.cn-sh2.ufileos.com/images/22.png",
  "https://crystal-ring.cn-sh2.ufileos.com/images/33.png",
  "https://crystal-ring.cn-sh2.ufileos.com/images/44.png",
  "https://crystal-ring.cn-sh2.ufileos.com/images/111.png",
];
const DOT_RADIUS = 16; // 小圆珠子的半径
const DOT_DISTANCE = 110;

const Predict = () => {
  const [crystalImagePaths, setCrystalImagePaths] = useState<string[]>([]);

  useEffect(() => {
    startPrediction();
  }, []);

  const startPrediction = () => {
    const dotCount = calculateDotCount(DOT_RADIUS, DOT_DISTANCE, 0.9);
    const randomCrystalPaths: string[] = [];
    const indexes: number[] = [];
    for (let i = 0; i < dotCount; i++) {
      const randomIndex =
        Math.floor(Math.random() * 100) % ALL_CRYSTAL_IMAGES.length;
      randomCrystalPaths.push(ALL_CRYSTAL_IMAGES[randomIndex]);
      indexes.push(randomIndex);
    }
    console.log(indexes, "randomCrystalPaths");
    setCrystalImagePaths(randomCrystalPaths);
  };

  return (
    <View className="predict-container">
      <View className="predict-content">
        {/* 水晶珠动效组件 */}
        <CircleRing
          dotRadius={DOT_RADIUS}
          dotDistance={DOT_DISTANCE}
          dotsBgImagePath={crystalImagePaths}
        />
        <View className="action-container">
          <Button className="btn-start" onClick={startPrediction}>
            开始测算
          </Button>
        </View>
      </View>
    </View>
  );
};

export default Predict;
