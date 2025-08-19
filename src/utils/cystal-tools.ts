// 动态计算珠子数量 - 使用更精确的几何计算
export const calculateDotCount = (
  dotRadius: number,
  dotDistance: number,
  spacingFactor: number
) => {
  // 方法1: 基于弦长的精确计算
  // 当两个珠子相切时，它们中心之间的距离应该是 2 * dotRadius * spacingFactor
  const requiredChordLength = 2 * dotRadius * spacingFactor;

  // 利用弦长公式：chord = 2 * R * sin(θ/2)，其中R是大圆半径，θ是圆心角
  // 所以：θ = 2 * arcsin(chord / (2 * R))
  const halfAngle = Math.asin(
    Math.min(1, requiredChordLength / (2 * dotDistance))
  );
  const anglePerDot = 2 * halfAngle;

  // 计算能放置的珠子数量
  let calculatedCount = Math.floor((2 * Math.PI) / anglePerDot);

  // 方法2: 基于弧长的简化计算（作为备用）
  if (calculatedCount <= 0 || !isFinite(calculatedCount)) {
    const circumference = 2 * Math.PI * dotDistance;
    const requiredArcLength = 2 * dotRadius * spacingFactor;
    calculatedCount = Math.floor(circumference / requiredArcLength);
  }

  // 确保数量合理（至少3个，最多100个）
  const finalCount = Math.max(3, Math.min(100, calculatedCount));

  return finalCount;
};

export const calculateDotLocation = (
  index: number,
  dotCount: number,
  dotDistance: number,
  centerX: number,
  centerY: number
) => {
  const angle = (index / dotCount) * Math.PI * 2;
  const x = centerX + dotDistance * Math.cos(angle);
  const y = centerY + dotDistance * Math.sin(angle);
  return { x, y };
};

export const getDotRingData = (
  dotList: string[],
  dotDistance: number,
  centerX: number,
  centerY: number
) => {
  const dotCount = dotList.length;
  const dotRingData: any[] = [];
  for (let i = 0; i < dotCount; i++) {
    const { x, y } = calculateDotLocation(
      i,
      dotCount,
      dotDistance,
      centerX,
      centerY
    );
    dotRingData.push({
      x,
      y,
      index: i,
      angle: (i / dotCount) * Math.PI * 2,
      arcLength: (2 * Math.PI * dotDistance) / dotCount,
      bgImage: dotList[i],
      size: dotDistance,
    });
  }
  return dotRingData;
};

interface Bead {
  x: number;
  y: number;
  radius: number;
  angle: number;
  index: number;
}


interface Position {
  x: number;
  y: number;
  angle: number;
  radius: number;
  height: number;
  index?: string | number;
}
// 计算每个珠子的圆心坐标 - 使用渲染直径（和CustomDesignRing保持一致）
export const calcPositionsWithRenderDiameter = (
  renderDiameterList: {width: number, height: number}[],
  // 圆心坐标
  center: { x: number, y: number }
) => {


  // 1. 总周长 = 所有珠子直径之和
  const circumference = renderDiameterList.reduce((s, d) => s + d.width, 0);

  // 2. 根据周长求大圆直径
  const bigDiameter = circumference / Math.PI;

  // 3. 计算每颗珠子所占角度
  const angles = renderDiameterList.map(d => d.width / circumference * 360);

  // 4. 计算每颗珠子圆心坐标
  const positions: Position[] = [];
  let currentDeg = 0;                // 当前累计角度
  const radius = bigDiameter / 2;    // 大圆半径

  renderDiameterList.forEach((d, i) => {
    const halfAngle = angles[i] / 2;          // 珠子占角的一半
    const midDeg = currentDeg + halfAngle;    // 珠子中心角度
    const rad = midDeg * Math.PI / 180;       // 转弧度
    positions.push({
      radius: d.width / 2,
      height: d.height / 2,
      x: center.x + radius * Math.cos(rad),
      y: center.y + radius * Math.sin(rad),
      angle: rad,
      index: i,
    });
    currentDeg += angles[i];                  // 累加到下一颗起点
  });
  return positions;
}

// 计算每个珠子的圆心坐标 - 老版本（保留备用）
export const calcPositionsWithBeadSize = (
  dots: number[],
  spacing: number,
  ringRadius: number,
  // 圆心坐标
  center: { x: number, y: number }
) => {

  let currentAngle = 0;
  const positions: Position[] = [];

  for (let i = 0; i < dots.length; i++) {
    const j = (i + 1) % dots.length;
    const r1 = dots[i]; // 直接使用半径，不再除以2
    const r2 = dots[j]; // 直接使用半径，不再除以2
    const L = r1 + r2 + spacing;

    // 确保不会出现无效的计算
    const sinValue = Math.min(1, L / (2 * ringRadius));
    const theta = 2 * Math.asin(sinValue);

    // 记录当前小圆的位置
    positions.push({
      radius: r1,
      x: center.x + ringRadius * Math.cos(currentAngle),
      y: center.y + ringRadius * Math.sin(currentAngle),
      angle: currentAngle,
      index: i,
    });

    // 更新角度
    currentAngle += theta;
  }

  return positions;
}

export const calculateBeadArrangementBySize = (
  ringRadius: number,
  beadSizeList: {width: number, height: number}[],
  center: { x: number, y: number },
  needScale: boolean = true
) => {
  // 参考CustomDesignRing的calcRingRadius计算方式
  // 先计算所有珠子的渲染直径总和
  const totalRenderDiameter = beadSizeList.reduce((sum, size) => sum + size.width, 0); // 按1.5倍计算渲染直径

  // 基于总渲染直径计算环半径（和CustomDesignRing保持一致）
  const calculatedRingRadius = totalRenderDiameter / (2 * Math.PI);

  // 计算缩放比例，使计算出的环半径适应目标ringRadius
  const targetRingRadius = needScale ? ringRadius * 0.8 : ringRadius; // 使用80%的半径，留出边距
  const sizeRatio = targetRingRadius / calculatedRingRadius;

  // 计算缩放后的渲染直径列表
  const scaledRenderDiameterList = beadSizeList.map((size) => ({width: size.width * sizeRatio, height: size.height * sizeRatio}));

  // 使用和CustomDesignRing相同的计算逻辑
  const positions = calcPositionsWithRenderDiameter(scaledRenderDiameterList, center);

  return positions;
};

export const calculateBeadArrangement = (
  ringRadius: number,
  beadCount: number,
) => {
  // 计算小圆珠的半径
  // 当n个小圆围成大圆时，小圆半径计算公式：
  // r = R / (1 + 1/sin(π/n))
  // 其中R是大圆半径，n是小圆个数，r是小圆半径
  const beadRadius = ringRadius / (1 + 1 / Math.sin(Math.PI / beadCount));

  // 计算每个小圆的位置
  const beads: Bead[] = [];
  for (let i = 0; i < beadCount; i++) {
    // 计算当前小圆的角度
    const angle = (i / beadCount) * Math.PI * 2;

    // 计算小圆中心的位置
    // 小圆中心到大圆中心的距离是 ringRadius - beadRadius
    const distance = ringRadius - beadRadius;
    const x = ringRadius + distance * Math.cos(angle);
    const y = ringRadius + distance * Math.sin(angle);

    beads.push({
      x,
      y,
      radius: beadRadius,
      angle,
      index: i,
    });
  }

  return beads;
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
