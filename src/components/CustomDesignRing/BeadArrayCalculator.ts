import { computeBraceletLength, calculateBeadArrangementBySize } from "@/utils/cystal-tools";

/**
 * 生成唯一的珠子key
 * 格式: bead_{timestamp}_{index}_{random}
 */
export function generateUniqueBeadKey(index: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `bead_${timestamp}_${index}_${random}`;
}

export interface Bead {
  id?: string | number;
  image_url: string;
  render_diameter: number; // 渲染直径
  diameter: number; // 珠子直径
}

export interface Position extends Bead {
  x: number;
  y: number;
  angle: number;
  radius: number;
  imageData?: string; // 可选，因为可能还没有处理图片
  uniqueKey: string; // 唯一标识符，用于React key和精确识别珠子
}

export interface BeadArrayCalculatorConfig {
  canvasSize: number;
  spacing: number;
  renderRatio: number;
  targetRadius?: number;
  maxWristSize: number;
  minWristSize: number;
}

/**
 * 珠子数组计算工具类
 * 负责珠子的位置计算、长度预测、数组操作等逻辑
 */
export class BeadArrayCalculator {
  private config: BeadArrayCalculatorConfig;

  constructor(config: BeadArrayCalculatorConfig) {
    this.config = config;
  }

  /**
   * 计算手围长度
   */
  calculatePredictedLength(beads: Bead[]): number {
    if (beads.length === 0) return 0;
    // 转换为computeBraceletLength期望的格式
    const beadsForCalculation = beads.map(bead => ({
      diameter: bead.diameter,
      render_diameter: bead.render_diameter,
    })) as any; // 临时类型断言，避免类型不匹配
    return computeBraceletLength(beadsForCalculation, "diameter");
  }

  /**
   * 动态计算圆环半径
   */
  calculateRingRadius(beads: Bead[]): number {
    if (!beads.length) return 0;

    const { canvasSize, spacing } = this.config;

    // 计算所有珠子的总直径和总间距
    const totalBeadDiameter = beads.reduce(
      (sum, b) => sum + b.render_diameter,
      0
    );
    const totalSpacing = beads.length * spacing; // n个珠子需要n个间距
    const totalArcLen = totalBeadDiameter + totalSpacing;

    // 基础圆环半径
    const baseRadius = totalArcLen / (2 * Math.PI);

    // 确保最小半径，避免珠子过度拥挤
    const maxBeadRadius = Math.max(...beads.map((b) => b.render_diameter / 2));
    const minRingRadius = maxBeadRadius * 2; // 至少是最大珠子直径的1倍

    // 限制最大半径，避免在小画布上显示过大
    const maxRingRadius = canvasSize * 0.4; // 不超过画布的40%

    return Math.max(minRingRadius, Math.min(maxRingRadius, baseRadius));
  }

  /**
   * 计算每个珠子的圆心坐标
   * @param beads 珠子数组
   * @param existingPositions 现有的位置数组（用于保持uniqueKey的连续性）
   */
  calculateBeadPositions(beads: Bead[], existingPositions?: Position[]): Position[] {
    if (!beads.length) return [];
    const ringRadius = this.config.targetRadius || this.calculateRingRadius(beads);
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    
    const positions = calculateBeadArrangementBySize(
      ringRadius,
      beads.map(bead => bead.diameter),
      center,
      false
    );

    return beads.map((bead, index) => {
      // 确保 render_diameter 存在且有效
      const validRenderDiameter = bead.render_diameter || bead.diameter * (this.config.renderRatio || 2);
      const validDiameter = bead.diameter || 10; // 默认直径
      
      // 尝试从现有位置中找到匹配的珠子（基于id和image_url匹配）
      const existingPosition = existingPositions?.find(
        pos => pos.id === bead.id && pos.image_url === bead.image_url
      );
      
      const position = {
        ...bead,
        render_diameter: validRenderDiameter,
        diameter: validDiameter,
        x: positions[index]?.x || 0,
        y: positions[index]?.y || 0,
        angle: positions[index]?.angle || 0,
        radius: positions[index]?.radius || validRenderDiameter / 2,
        imageData: bead.image_url, // 使用image_url作为初始值
        uniqueKey: existingPosition?.uniqueKey || generateUniqueBeadKey(index), // 优先使用现有key，否则生成新key
      };
      
      // console.log(`📍 珠子位置计算 ${index}`, {
      //   original: bead,
      //   calculated: position,
      //   reusingKey: !!existingPosition?.uniqueKey
      // });
      
      return position;
    });
  }

  /**
   * 添加珠子到数组
   */
  addBead(beads: Bead[], newBead: Bead, selectedIndex: number = -1): Bead[] {
    const newBeads = [...beads];
    
    if (selectedIndex === -1) {
      // 添加到末尾
      newBeads.push({
        ...newBead,
        render_diameter: newBead.diameter * this.config.renderRatio,
        diameter: newBead.diameter,
      });
    } else {
      // 替换选中的珠子
      newBeads[selectedIndex] = {
        ...newBead,
        render_diameter: newBead.diameter * this.config.renderRatio,
        diameter: newBead.diameter,
      };
    }
    
    return newBeads;
  }

  /**
   * 删除珠子
   */
  removeBead(beads: Bead[], selectedIndex: number): { newBeads: Bead[]; newSelectedIndex: number } {
    if (selectedIndex === -1 || selectedIndex >= beads.length) {
      return { newBeads: beads, newSelectedIndex: selectedIndex };
    }

    const newBeads = [...beads];
    newBeads.splice(selectedIndex, 1);
    
    // 调整选中索引
    const newSelectedIndex = newBeads.length > 0 
      ? Math.min(selectedIndex, newBeads.length - 1) 
      : -1;

    return { newBeads, newSelectedIndex };
  }

  /**
   * 移动珠子位置
   */
  moveBead(beads: Bead[], selectedIndex: number, direction: 'clockwise' | 'counterclockwise'): Bead[] {
    if (selectedIndex === -1 || beads.length <= 1) return beads;

    const newBeads = [...beads];
    const selectedBead = newBeads[selectedIndex];
    
    if (direction === 'clockwise') {
      const nextIndex = (selectedIndex + 1) % newBeads.length;
      newBeads[selectedIndex] = newBeads[nextIndex];
      newBeads[nextIndex] = selectedBead;
    } else {
      const prevIndex = (selectedIndex - 1 + newBeads.length) % newBeads.length;
      newBeads[selectedIndex] = newBeads[prevIndex];
      newBeads[prevIndex] = selectedBead;
    }
    
    return newBeads;
  }

  /**
   * 验证珠子数量限制
   */
  validateBeadCount(beads: Bead[], newBeadDiameter: number): { isValid: boolean; message?: string } {
    const currentLength = this.calculatePredictedLength(beads);
    const newLength = currentLength + newBeadDiameter * 0.1;

    if (newLength > this.config.maxWristSize) {
      return { 
        isValid: false, 
        message: "哎呀，珠子有点多啦！一般手围建议不超过23cm噢。" 
      };
    }

    if (newLength < this.config.minWristSize) {
      return { 
        isValid: false, 
        message: "哎呀，珠子有点少啦！一般手围建议不少于12cm噢。" 
      };
    }

    return { isValid: true };
  }

  /**
   * 检测拖拽的珠子是否落在两个珠子之间
   */
  detectInsertionBetweenBeads(
    beads: Position[], 
    dragBeadIndex: number, 
    newX: number, 
    newY: number
  ): { 
    shouldInsert: boolean; 
    insertIndex?: number; 
    message?: string;
  } {
    
    if (dragBeadIndex < 0 || dragBeadIndex >= beads.length) {
      console.log("❌ 无效的珠子索引");
      return { shouldInsert: false, message: "无效的珠子索引" };
    }

    // const dragBead = beads[dragBeadIndex]; // 暂时不需要
    
    // 过滤掉被拖拽的珠子，获取其他珠子
    const otherBeads = beads
      .map((bead, index) => ({ ...bead, originalIndex: index }))
      .filter((_, index) => index !== dragBeadIndex);
    
    // console.log("📍 其他珠子数量", otherBeads.length);
    
    if (otherBeads.length < 2) {
      console.log("❌ 珠子数量不足");
      return { shouldInsert: false, message: "珠子数量不足，无法插入" };
    }

    // 简化策略：找到离拖拽位置最近的两个珠子
    const distances = otherBeads.map(bead => ({
      bead,
      distance: Math.sqrt(Math.pow(newX - bead.x, 2) + Math.pow(newY - bead.y, 2))
    })).sort((a, b) => a.distance - b.distance);

    const closestBead = distances[0].bead;
    const secondClosestBead = distances[1].bead;
    
    // console.log("🎯 最近的两个珠子", {
    //   closest: { index: closestBead.originalIndex, distance: distances[0].distance },
    //   secondClosest: { index: secondClosestBead.originalIndex, distance: distances[1].distance }
    // });

    // 检查这两个珠子是否相邻（在数组中的索引相差1，或者一个是0一个是最后一个）
    const originalArrayLength = beads.length; // 原始数组长度
    const lastOriginalIndex = originalArrayLength - 1;
    const isAdjacent = Math.abs(closestBead.originalIndex - secondClosestBead.originalIndex) === 1 ||
      (Math.max(closestBead.originalIndex, secondClosestBead.originalIndex) === lastOriginalIndex &&
       Math.min(closestBead.originalIndex, secondClosestBead.originalIndex) === 0);
    
    if (!isAdjacent) {
      console.log("❌ 最近的两个珠子不相邻");
      return { shouldInsert: false, message: "请拖拽到相邻的两个珠子之间" };
    }

    // 检查拖拽位置是否足够靠近 - 放宽距离要求
    const maxAllowedDistance = 50; // 放宽距离阈值
    
    // 如果最近的珠子距离太远，说明拖拽位置不合理
    if (distances[0].distance > maxAllowedDistance) {
      console.log("❌ 拖拽位置距离最近的珠子太远", {
        distance: distances[0].distance,
        maxAllowed: maxAllowedDistance
      });
      return { shouldInsert: false, message: "请拖拽到更接近珠子的位置" };
    }
    
    // 检查前两个珠子的距离总和是否合理
    const totalDistance = distances[0].distance + distances[1].distance;
    const maxTotalDistance = 300; // 总距离阈值
    if (totalDistance > maxTotalDistance) {
      console.log("❌ 拖拽位置距离两个珠子总距离太远", {
        totalDistance,
        maxTotalDistance
      });
      return { shouldInsert: false, message: "请拖拽到两个珠子之间的区域" };
    }

    // 计算插入位置
    // 特殊情况：如果两个珠子分别是第一个（0）和最后一个，插入到第0个位置
    const isFirstLastAdjacent = (closestBead.originalIndex === 0 && secondClosestBead.originalIndex === lastOriginalIndex) ||
                               (secondClosestBead.originalIndex === 0 && closestBead.originalIndex === lastOriginalIndex);
    
    let insertIndex: number;
    
    if (isFirstLastAdjacent) {
      // console.log("🔄 检测到第一个和最后一个珠子相邻，插入到第0个位置");
      insertIndex = 0;
      // 如果拖拽的珠子原本就在第0个位置，不需要移动
      if (dragBeadIndex === 0) {
        return { shouldInsert: false, message: "珠子已在目标位置" };
      }
    } else {
      // 正常情况：插入到两个相邻珠子之间
      const firstIndex = Math.min(closestBead.originalIndex, secondClosestBead.originalIndex);
      insertIndex = firstIndex + 1;
      
      // 如果拖拽的珠子原本在插入位置之前，需要调整插入索引
      if (dragBeadIndex < insertIndex) {
        insertIndex--;
      }
    }
    
    // console.log("✅ 检测到可插入位置", {
    //   insertIndex,
    //   between: [closestBead.originalIndex, secondClosestBead.originalIndex],
    //   dragBeadIndex,
    //   isFirstLastAdjacent
    // });
    
    const message = `珠子将插入到第${insertIndex}个位置`;
    console.log("插入的位置：", insertIndex);
    
    return {
      shouldInsert: true,
      insertIndex: insertIndex,
      message
    };
  }

  /**
   * 重新排列珠子数组（拖拽重排序）
   */
  reorderBeads(beads: Position[], fromIndex: number, toIndex: number): Position[] {
    if (fromIndex < 0 || fromIndex >= beads.length || toIndex < 0 || toIndex >= beads.length) {
      return beads;
    }

    const newBeads = [...beads];
    const [movedBead] = newBeads.splice(fromIndex, 1);
    newBeads.splice(toIndex, 0, movedBead);
    
    return newBeads;
  }

  /**
   * 重新计算已有Position数组的坐标（保持其他属性不变）
   */
  recalculatePositions(positions: Position[]): Position[] {
    if (!positions.length) return [];
    
    const ringRadius = this.config.targetRadius || this.calculateRingRadius(positions);
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    
    const newCoordinates = calculateBeadArrangementBySize(
      ringRadius,
      positions.map(pos => pos.diameter),
      center,
      false
    );

    return positions.map((position, index) => ({
      ...position,
      x: newCoordinates[index]?.x || 0,
      y: newCoordinates[index]?.y || 0,
      angle: newCoordinates[index]?.angle || 0,
      radius: newCoordinates[index]?.radius || position.radius,
    }));
  }

  /**
   * 验证拖拽位置是否有效（更新后的版本）
   */
  validateDragPosition(
    beads: Position[], 
    dragBeadIndex: number, 
    newX: number, 
    newY: number
  ): { 
    isValid: boolean; 
    message?: string; 
    shouldInsert?: boolean;
    insertIndex?: number;
    adjustedPosition?: { x: number; y: number };
  } {
    if (dragBeadIndex < 0 || dragBeadIndex >= beads.length) {
      return { isValid: false, message: "无效的珠子索引" };
    }

    // 首先检查是否可以插入到两个珠子之间
    const insertionResult = this.detectInsertionBetweenBeads(beads, dragBeadIndex, newX, newY);
    if (insertionResult.shouldInsert) {
      return {
        isValid: true,
        shouldInsert: true,
        insertIndex: insertionResult.insertIndex,
        message: insertionResult.message
      };
    }

    // 如果不能插入，则检查基本的边界和重叠验证
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    const maxRadius = this.config.canvasSize * 0.4;
    const minRadius = Math.max(...beads.map(b => b.render_diameter / 2)) * 1.5;

    // 计算新位置相对于圆心的距离
    const deltaX = newX - center.x;
    const deltaY = newY - center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 检查是否在合理范围内
    if (distance < minRadius || distance > maxRadius) {
      return {
        isValid: false,
        message: "拖拽失败：位置不在有效范围内，珠子已恢复原位置"
      };
    }

    // 检查是否与其他珠子重叠（但不在插入范围内）
    for (let i = 0; i < beads.length; i++) {
      if (i === dragBeadIndex) continue;
      
      const bead = beads[i];
      const beadDistance = Math.sqrt(
        Math.pow(newX - bead.x, 2) + Math.pow(newY - bead.y, 2)
      );
      
      const minDistance = (beads[dragBeadIndex].render_diameter + bead.render_diameter) / 2 + this.config.spacing;
      
      if (beadDistance < minDistance) {
        return {
          isValid: false,
          message: "拖拽失败：位置与其他珠子重叠，珠子已恢复原位置"
        };
      }
    }

    // 如果到达这里，说明位置有效但不是插入操作，这种情况下也认为是失败
    return {
      isValid: false,
      message: "拖拽失败：珠子只能插入到其他珠子之间，已恢复原位置"
    };
  }

  /**
   * 调整拖拽后的珠子位置，保持圆环形状
   */
  adjustBeadPositionsAfterDrag(
    beads: Position[], 
    dragBeadIndex: number, 
    newX: number, 
    newY: number
  ): Position[] {
    if (dragBeadIndex < 0 || dragBeadIndex >= beads.length) {
      return beads;
    }

    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    
    // 计算拖拽珠子的新角度
    const deltaX = newX - center.x;
    const deltaY = newY - center.y;
    const newAngle = Math.atan2(deltaY, deltaX);
    
    // 创建新的珠子数组
    const newBeads = [...beads];
    const draggedBead = { ...newBeads[dragBeadIndex] };
    
    // 更新拖拽珠子的位置
    draggedBead.x = newX;
    draggedBead.y = newY;
    draggedBead.angle = newAngle;
    newBeads[dragBeadIndex] = draggedBead;

    // 重新计算其他珠子的位置，保持圆环形状
    const otherBeads = beads.filter((_, index) => index !== dragBeadIndex);
    
    // 将Position转换为Bead格式进行计算
    const otherBeadsForCalculation = otherBeads.map(bead => ({
      id: bead.id,
      image_url: bead.image_url,
      render_diameter: bead.render_diameter,
      diameter: bead.diameter,
    }));
    
    // 计算其他珠子的新位置
    const otherPositions = this.calculateBeadPositions(otherBeadsForCalculation);
    
    // 将其他珠子的新位置应用到数组中，保持原有的imageData等属性
    otherPositions.forEach((pos, index) => {
      const originalIndex = index >= dragBeadIndex ? index + 1 : index;
      if (originalIndex < newBeads.length) {
        newBeads[originalIndex] = { 
          ...newBeads[originalIndex], 
          x: pos.x,
          y: pos.y,
          angle: pos.angle,
          radius: pos.radius,
        };
      }
    });

    return newBeads;
  }

  /**
   * 获取珠子状态信息
   */
  getBeadArrayInfo(beads: Bead[]) {
    return {
      count: beads.length,
      predictedLength: this.calculatePredictedLength(beads),
      totalDiameter: beads.reduce((sum, bead) => sum + bead.diameter, 0),
      averageDiameter: beads.length > 0 ? beads.reduce((sum, bead) => sum + bead.diameter, 0) / beads.length : 0,
    };
  }
}
