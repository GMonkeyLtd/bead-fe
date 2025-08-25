import { Bead, Position } from "../../types/crystal";


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

// 计算每个珠子的圆心坐标 - 使用渲染直径（和CustomDesignRing保持一致）
export const calcPositionsWithRenderDiameter = (
  renderDiameterList: { render_width: number, scale_width: number, render_diameter: number, scale_height: number }[],
  // 圆心坐标
  center: { x: number, y: number }
) => {


  // 1. 总周长 = 所有珠子直径之和
  const circumference = renderDiameterList.reduce((s, d) => s + d.scale_width, 0);

  // 2. 根据周长求大圆直径
  const bigDiameter = circumference / Math.PI;

  // 3. 计算每颗珠子所占角度
  const angles = renderDiameterList.map(d => d.scale_width / circumference * 360);

  // 4. 计算每颗珠子圆心坐标
  const positions: Position[] = [];
  // 如果没有珠子，直接返回空数组
  if (renderDiameterList.length === 0) {
    return positions;
  }
  
  // 计算起始角度，让第一个珠子的圆心在正上方(-90度)
  const firstHalfAngle = angles[0] / 2;
  let currentDeg = -90 - firstHalfAngle;     // 调整起始角度
  const radius = bigDiameter / 2;            // 大圆半径

  renderDiameterList.forEach((d, i) => {
    const halfAngle = angles[i] / 2;          // 珠子占角的一半
    const midDeg = currentDeg + halfAngle;    // 珠子中心角度
    const rad = midDeg * Math.PI / 180;       // 转弧度
    positions.push({
      scale_width: d.scale_width / 2,
      scale_height: d.scale_height / 2,
      x: center.x + radius * Math.cos(rad),
      y: center.y + radius * Math.sin(rad),
      angle: rad,
      index: i as any,
    });
    currentDeg += angles[i];                  // 累加到下一颗起点
  });
  return positions;
}

export const calculateBeadArrangementBySize = (
  ringRadius: number,
  beadSizeList: { ratioBeadWidth: number, beadDiameter: number }[],
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
  const scaledRenderDiameterList = beadSizeList.map((size) => ({ render_width: size.ratioBeadWidth, scale_width: size.ratioBeadWidth * sizeRatio, render_diameter: size.beadDiameter, scale_height: size.beadDiameter * sizeRatio }));

  // 使用和CustomDesignRing相同的计算逻辑
  const positions = calcPositionsWithRenderDiameter(scaledRenderDiameterList, center);

  return positions;
};

export const computeBraceletLength = (beads: Bead[], key: string = 'radius') => {
  const dotsLength = beads.map((dot) => dot[key]);
  // 所有珠子能围成的周长
  const allLength = dotsLength.reduce((sum, number) => sum + number, 0);
  // 围成圆的半径
  const ringRadius = allLength / (2 * Math.PI);
  // 珠子的平均半径
  const averageRadius = allLength / (2 * dotsLength.length);
  // 手围 = （围成圆的半径 - 珠子的平均半径）* 2 * PI
  const predictLength = (ringRadius - averageRadius) * 2 * Math.PI;
  return Math.ceil(predictLength / 10);
};
