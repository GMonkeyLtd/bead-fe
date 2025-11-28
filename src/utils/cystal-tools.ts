import { SPU_TYPE } from "@/pages-design/custom-design";
import { BeadItem } from "./api-session";

// 简单的位置类型，用于内部计算
export interface SimplePosition {
  x: number;
  y: number;
  angle: number;
  scale_width: number;
  scale_height: number;
  index: number;
  threadX?: number;
  threadY?: number;
  passHeightRatio?: number;
}


export const calculateDotLocation = (
  index: number,
  dotCount: number,
  dotDistance: number,
  centerX: number,
  centerY: number
) => {
  // 从正上方(-π/2)开始排列
  const angle = (index / dotCount) * Math.PI * 2 - Math.PI / 2;
  const x = centerX + dotDistance * Math.cos(angle);
  const y = centerY + dotDistance * Math.sin(angle);
  return { x, y };
};

export const calculateBeadPositionsByTargetRadius = (
  beads: { scale_width: number, scale_height: number, passHeightRatio?: number }[],
  targetRadius: number,
  center: { x: number, y: number }
) => {
  // 修复：角度应该基于弧长计算，弧长 = 半径 × 角度(弧度)，所以角度(度) = (弧长 / 半径) × (180/π)
  const angles = beads.map(d => (d.scale_width / targetRadius) * (180 / Math.PI));
  // 修复：直接使用targetRadius作为半径，因为targetRadius就是我们想要的圆环半径
  const radius = targetRadius;            // 使用目标半径
  const positions: SimplePosition[] = [];
  const firstHalfAngle = angles[0] / 2;
  let currentDeg = -90 - firstHalfAngle;     // 调整起始角度
  beads.forEach((d, i) => {
    const halfAngle = angles[i] / 2;
    const midDeg = currentDeg + halfAngle;
    const rad = midDeg * Math.PI / 180;
    
    // 计算穿线点在圆环上的位置
    const threadX = center.x + radius * Math.cos(rad);
    const threadY = center.y + radius * Math.sin(rad);
    
    // 计算珠子的显示位置，考虑passHeightRatio
    const passHeightRatio = d.passHeightRatio || 0.5; // 默认从中心穿过
    const heightOffset = (passHeightRatio - 0.5) * d.scale_height; // 相对于中心的偏移
    
    // 计算垂直于圆环切线方向的单位向量（指向圆心内侧）
    const normalX = -Math.cos(rad); // 指向圆心的法向量
    const normalY = -Math.sin(rad);
    
    // 珠子的实际显示位置 = 穿线位置 + 法向量 * 高度偏移
    const displayX = threadX + normalX * heightOffset;
    const displayY = threadY + normalY * heightOffset;
    
    positions.push({
      scale_width: d.scale_width / 2,
      scale_height: d.scale_height / 2,
      x: displayX,
      y: displayY,
      angle: rad,
      index: i as any,
      // 保存穿线点位置，用于后续计算
      threadX,
      threadY,
      passHeightRatio,
    });
    currentDeg += angles[i];
  });
  return positions;
}

// 计算每个珠子的圆心坐标 - 使用渲染直径（和CustomDesignRing保持一致）
export const calcPositionsWithRenderDiameter = (
  renderDiameterList: { render_width: number, scale_width: number, render_diameter: number, scale_height: number, passHeightRatio?: number }[],
  // 圆心坐标
  center: { x: number, y: number }
) => {
  // 1. 总周长 = 所有珠子直径之和
  const circumference = renderDiameterList.reduce((s, d) => s + d.scale_width, 0);
  if (circumference === 0) return []; // 避免除以零

  // 2. 根据周长求大圆直径
  const bigDiameter = circumference / Math.PI;
  const radius = bigDiameter / 2; // 大圆半径

  // 3. 计算每颗珠子所占角度
  const angles = renderDiameterList.map(d => d.scale_width / circumference * 360);

  // 4. 计算每颗珠子位置
  const positions: SimplePosition[] = [];
  
  // 计算起始角度，让第一个珠子的中心在正上方(-90度)
  const firstHalfAngle = angles[0] / 2;
  let currentDeg = -90 - firstHalfAngle;

  renderDiameterList.forEach((d, i) => {
    const halfAngle = angles[i] / 2;
    const midDeg = currentDeg + halfAngle; // 珠子中心角度
    const rad = midDeg * Math.PI / 180;    // 转弧度
    
    // 穿孔点必须精确位于大圆上（这是关键修正点）
    const threadX = center.x + radius * Math.cos(rad);
    const threadY = center.y + radius * Math.sin(rad);
    
    // 获取穿孔比例，默认为中心
    const passHeightRatio = d.passHeightRatio ?? 0.5;
    
    // 计算珠子中心相对于穿孔点的偏移量
    // 偏移方向：从穿孔点指向珠子中心，即径向向外（与半径方向相同）
    // 偏移距离：珠子高度的一半乘以(0.5 - passHeightRatio)
    const offsetDistance = (0.5 - passHeightRatio) * d.scale_height;
    
    // 计算珠子中心坐标（穿孔点加上径向偏移）
    const displayX = threadX + Math.cos(rad) * offsetDistance;
    const displayY = threadY + Math.sin(rad) * offsetDistance;
    
    positions.push({
      scale_width: d.scale_width / 2,
      scale_height: d.scale_height / 2,
      x: displayX,
      y: displayY,
      angle: rad,
      index: i as any,
      // 保存穿线点位置，确保在大圆上
      threadX,
      threadY,
      passHeightRatio,
    });
    
    currentDeg += angles[i]; // 累加到下一颗珠子的起始角度
  });
  
  return positions;
}

export const calculateBeadArrangementByTargetRadius = (
  beads: { ratioBeadWidth: number, beadDiameter: number, passHeightRatio?: number }[],
  targetRadius: number,
  center: { x: number, y: number },
  displayScale: number
) => {
  const beadData = beads.map(d => {
    // 如果穿孔位置不是中心，且珠子直径大于20，则按照直径为20进行缩小渲染
    const zoomRatioByLongDiameter = d.passHeightRatio && d.passHeightRatio !== 0.5 && d.beadDiameter > 20 ? 20 / d.beadDiameter : 1;
    return {
      scale_width: d.ratioBeadWidth * displayScale * zoomRatioByLongDiameter,
      scale_height: d.beadDiameter * displayScale * zoomRatioByLongDiameter,
      passHeightRatio: d.passHeightRatio,
    }
  });
  return calculateBeadPositionsByTargetRadius(beadData, targetRadius, center);
}

export const calculateBeadArrangementBySize = (
  ringRadius: number,
  beadSizeList: { ratioBeadWidth: number, beadDiameter: number, passHeightRatio?: number }[],
  center: { x: number, y: number },
  needScale: boolean = true
) => {
  // 参考CustomDesignRing的calcRingRadius计算方式
  // 先计算所有珠子的渲染直径总和
  const totalRenderDiameter = beadSizeList.reduce((sum, size) => sum + size.ratioBeadWidth, 0); // 按1.5倍计算渲染直径

  // 基于总渲染直径计算环半径（和CustomDesignRing保持一致）
  const calculatedRingRadius = totalRenderDiameter / (2 * Math.PI);

  // 计算缩放比例，使计算出的环半径适应目标ringRadius
  const targetRingRadius = needScale ? ringRadius * 0.8 : ringRadius; // 使用80%的半径，留出边距
  const sizeRatio = targetRingRadius / calculatedRingRadius;

  // 计算缩放后的渲染直径列表
  const scaledRenderDiameterList = beadSizeList.map((size) => {
    // 如果穿孔位置不是中心，且珠子直径大于20，则按照直径为20进行缩小渲染
    const zoomRatioByLongDiameter = size.passHeightRatio && size.passHeightRatio !== 0.5 && size.beadDiameter > 20 ? 20 / size.beadDiameter : 1;

    return { 
      render_width: size.ratioBeadWidth, 
      scale_width: size.ratioBeadWidth * sizeRatio * zoomRatioByLongDiameter, 
      render_diameter: size.beadDiameter, 
      scale_height:  size.beadDiameter * sizeRatio * zoomRatioByLongDiameter, 
      passHeightRatio: size.passHeightRatio || 0.5
    }
  });

  // 使用和CustomDesignRing相同的计算逻辑
  const positions = calcPositionsWithRenderDiameter(scaledRenderDiameterList, center);

  return positions;
};

export const computeBraceletLength = (beads: BeadItem[]) => {
  const beadsWidths = beads.map((dot) => dot.width);
  console.log('beads, beads.length', beads, beads.length);
  // 所有珠子能围成的周长
  const allWidth = beadsWidths.reduce((sum, number) => sum + number, 0);
  console.log('allWidth, beads.length', allWidth, beads.length);
  if (allWidth < 100) {
    return allWidth / 10;
  }
  // 所有珠子的直径总和(排除配饰，配饰太长影响计算)
  const beadsDiameters = beads.filter((dot) => dot.spu_type !== SPU_TYPE.ACCESSORY).map((dot) => dot.diameter);
  const allDiameter = beadsDiameters.reduce((sum, number) => sum + number, 0);
  console.log('beadsDiameters.length, allDiameter', beadsDiameters.length, allDiameter);
  // 珠子的平均半径
  const averageRadius =  allDiameter / (2 * beadsDiameters.length);
  console.log('averageRadius', averageRadius);
  // 围成圆的半径
  const ringRadius = allWidth / (2 * Math.PI);
  console.log('ringRadius', ringRadius);
  // 手围 = （围成圆的半径 - 珠子的平均半径）* 2 * PI
  const predictLength = (ringRadius - averageRadius) * 2 * Math.PI;
  console.log('predictLength', predictLength);
  const rest = (Math.round(predictLength) / 10) % 1;
  console.log('rest', rest);
  if (rest < 0.5) {
    const result = Math.floor(predictLength / 10);
    console.log('result', result);
    return result;
  } else {
    const result = Math.ceil(predictLength / 10);
    console.log('result', result);
    return result;
  }
};
