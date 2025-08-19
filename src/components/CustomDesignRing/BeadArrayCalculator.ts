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
  height: number;
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
    console.log(beads, 'beads')
    const beadsForCalculation = beads.map(bead => ({
      diameter: bead.diameter,
      render_diameter: bead.width || bead.diameter,
    })) as any; // 临时类型断言，避免类型不匹配
    return computeBraceletLength(beadsForCalculation, "render_diameter");
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
      beads.map(bead => ({ width: bead.render_diameter, height: bead.diameter })),
      center,
      false
    );

    return beads.map((bead, index) => {
      // 确保 render_diameter 存在且有效
      const validRenderDiameter = bead.render_diameter || bead.render_diameter * (this.config.renderRatio || 2);
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
        height: positions[index]?.height || validDiameter,
        radius: positions[index]?.radius || validRenderDiameter / 2,
        imageData: bead.image_url, // 使用image_url作为初始值
        uniqueKey: generateUniqueBeadKey(index), // 优先使用现有key，否则生成新key
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
        diameter: newBead.diameter,
      });
    } else {
      // 替换选中的珠子
      newBeads[selectedIndex] = {
        ...newBead,
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
    // const newSelectedIndex = newBeads.length > 0
    //   ? Math.min(selectedIndex, newBeads.length - 1)
    //   : -1;
    // 删除后置空选中态
    const newSelectedIndex = -1;

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
   * 检测拖拽的珠子应该插入的位置（智能双策略算法）
   * 策略1：如果拖拽点接近现有珠子，插入到最近的两个相邻珠子之间
   * 策略2：如果拖拽点在圆环内的空旷区域，基于扇形区域计算插入位置
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

    // 过滤掉被拖拽的珠子，获取其他珠子
    const otherBeads = beads
      .map((bead, index) => ({ ...bead, originalIndex: index }))
      .filter((_, index) => index !== dragBeadIndex);

    if (otherBeads.length < 1) {
      console.log("❌ 珠子数量不足");
      return { shouldInsert: false, message: "珠子数量不足，无法插入" };
    }

    // 计算画布中心和圆环参数
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    const ringRadius = this.config.targetRadius || this.calculateRingRadius(beads);

    // 计算拖拽点与所有珠子的距离
    const distances = otherBeads.map(bead => ({
      bead,
      distance: Math.sqrt(Math.pow(newX - bead.x, 2) + Math.pow(newY - bead.y, 2))
    })).sort((a, b) => a.distance - b.distance);

    const closestBead = distances[0].bead;
    const closestDistance = distances[0].distance;

    // 定义判断阈值
    const beadProximityThreshold = Math.max(closestBead.radius * 1.5, 40); // 珠子邻近阈值
    const dragFromCenterDistance = Math.sqrt(Math.pow(newX - center.x, 2) + Math.pow(newY - center.y, 2));

    console.log("🎯 拖拽分析", {
      closestDistance,
      beadProximityThreshold,
      dragFromCenterDistance,
      ringRadius,
      closestBeadIndex: closestBead.originalIndex
    });

    // 策略选择：根据拖拽点位置决定使用哪种计算方式
    if (closestDistance <= beadProximityThreshold) {
      // 策略1：拖拽点接近现有珠子，使用最近珠子插入算法
      console.log("🔍 使用策略1：最近珠子插入");
      return this.calculateNearestBeadInsertion(beads, dragBeadIndex, newX, newY, otherBeads, distances);
    } else if (dragFromCenterDistance <= ringRadius * 1.3) {
      // 策略2：拖拽点在圆环内但不接近珠子，使用扇形区域插入算法
      console.log("🔍 使用策略2：扇形区域插入");
      return this.calculateSectorBasedInsertion(beads, dragBeadIndex, newX, newY, center, otherBeads);
    } else {
      // 拖拽点超出有效范围
      return { shouldInsert: false, message: "拖拽位置超出有效范围" };
    }
  }

  /**
   * 策略1：基于最近珠子的插入计算
   */
  private calculateNearestBeadInsertion(
    beads: Position[],
    dragBeadIndex: number,
    _newX: number,
    _newY: number,
    otherBeads: any[],
    distances: any[]
  ): { shouldInsert: boolean; insertIndex?: number; message?: string } {

    if (otherBeads.length < 2) {
      // 如果只有一个其他珠子，直接插入到它前面或后面
      const targetBead = otherBeads[0];
      let insertIndex = targetBead.originalIndex;

      // 如果拖拽的珠子原本在目标位置之前，需要调整插入索引
      if (dragBeadIndex < insertIndex) {
        insertIndex--;
      }

      return {
        shouldInsert: true,
        insertIndex,
        message: `珠子将插入到第${insertIndex}个位置`
      };
    }

    const closestBead = distances[0].bead;
    const secondClosestBead = distances[1].bead;

    // 检查最近的两个珠子是否相邻
    const originalArrayLength = beads.length;
    const lastOriginalIndex = originalArrayLength - 1;
    const isAdjacent = Math.abs(closestBead.originalIndex - secondClosestBead.originalIndex) === 1 ||
      (Math.max(closestBead.originalIndex, secondClosestBead.originalIndex) === lastOriginalIndex &&
        Math.min(closestBead.originalIndex, secondClosestBead.originalIndex) === 0);

    if (!isAdjacent) {
      // 如果最近的两个珠子不相邻，选择距离最近的珠子，插入到它的邻近位置
      const targetBead = closestBead;
      let insertIndex = targetBead.originalIndex;

      // 简单策略：插入到最近珠子的后面
      insertIndex = targetBead.originalIndex + 1;
      if (dragBeadIndex < insertIndex) {
        insertIndex--;
      }

      return {
        shouldInsert: true,
        insertIndex,
        message: `珠子将插入到第${insertIndex}个位置（靠近最近珠子）`
      };
    }

    // 计算插入位置（相邻珠子之间）
    const isFirstLastAdjacent = (closestBead.originalIndex === 0 && secondClosestBead.originalIndex === lastOriginalIndex) ||
      (secondClosestBead.originalIndex === 0 && closestBead.originalIndex === lastOriginalIndex);

    let insertIndex: number;

    if (isFirstLastAdjacent) {
      insertIndex = 0;
      if (dragBeadIndex === 0) {
        return { shouldInsert: false, message: "珠子已在目标位置" };
      }
    } else {
      const firstIndex = Math.min(closestBead.originalIndex, secondClosestBead.originalIndex);
      insertIndex = firstIndex + 1;

      if (dragBeadIndex < insertIndex) {
        insertIndex--;
      }
    }

    return {
      shouldInsert: true,
      insertIndex,
      message: `珠子将插入到第${insertIndex}个位置（相邻珠子间）`
    };
  }

  /**
   * 策略2：基于扇形区域的插入计算
   */
  private calculateSectorBasedInsertion(
    _beads: Position[],
    dragBeadIndex: number,
    newX: number,
    newY: number,
    center: { x: number; y: number },
    otherBeads: any[]
  ): { shouldInsert: boolean; insertIndex?: number; message?: string } {

    // 计算拖拽点相对于圆心的角度
    const dragAngle = Math.atan2(newY - center.y, newX - center.x);

    // 标准化角度到 [0, 2π) 范围
    const normalizeDragAngle = dragAngle >= 0 ? dragAngle : dragAngle + 2 * Math.PI;

    // 计算每个珠子的角度并按角度排序
    const beadAngles = otherBeads.map(bead => {
      const beadAngle = Math.atan2(bead.y - center.y, bead.x - center.x);
      const normalizedBeadAngle = beadAngle >= 0 ? beadAngle : beadAngle + 2 * Math.PI;
      return {
        ...bead,
        angle: normalizedBeadAngle
      };
    }).sort((a, b) => a.angle - b.angle);

    // 找到拖拽点应该插入的扇形区域
    let insertIndex = 0;

    for (let i = 0; i < beadAngles.length; i++) {
      const currentBead = beadAngles[i];
      const nextBead = beadAngles[(i + 1) % beadAngles.length];

      const currentAngle = currentBead.angle;
      let nextAngle = nextBead.angle;

      // 处理跨越0度的情况
      if (nextAngle < currentAngle) {
        nextAngle += 2 * Math.PI;
      }

      // 检查拖拽角度是否在当前扇形区域内
      let dragInSector = false;
      if (i === beadAngles.length - 1) {
        // 最后一个扇形区域，可能跨越0度
        dragInSector = (normalizeDragAngle >= currentAngle) || (normalizeDragAngle <= nextBead.angle);
      } else {
        dragInSector = (normalizeDragAngle >= currentAngle && normalizeDragAngle <= nextAngle);
      }

      if (dragInSector) {
        // 找到对应的原始索引位置
        insertIndex = nextBead.originalIndex;

        // 如果拖拽的珠子原本在插入位置之前，需要调整插入索引
        if (dragBeadIndex < insertIndex) {
          insertIndex--;
        }

        break;
      }
    }

    // 特殊处理：如果没有找到合适的扇形，插入到角度最接近的位置
    if (insertIndex === 0 && beadAngles.length > 0) {
      let minAngleDiff = Infinity;
      let bestInsertIndex = 0;

      for (let i = 0; i < beadAngles.length; i++) {
        const beadAngle = beadAngles[i].angle;
        let angleDiff = Math.abs(normalizeDragAngle - beadAngle);

        // 考虑圆形的连续性
        angleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);

        if (angleDiff < minAngleDiff) {
          minAngleDiff = angleDiff;
          bestInsertIndex = beadAngles[i].originalIndex;
        }
      }

      insertIndex = bestInsertIndex;
      if (dragBeadIndex < insertIndex) {
        insertIndex--;
      }
    }

    return {
      shouldInsert: true,
      insertIndex,
      message: `珠子将插入到第${insertIndex}个位置（基于扇形区域）`
    };
  }

  /**
   * 预览插入位置（用于拖拽过程中的实时预览）
   * 返回插入位置信息和预览光标的坐标
   */
  previewInsertionPosition(
    beads: Position[],
    dragBeadIndex: number,
    newX: number,
    newY: number
  ): {
    isValid: boolean;
    insertIndex?: number;
    cursorX?: number;
    cursorY?: number;
    insertionType?: 'nearest-beads' | 'sector-based';
    message?: string;
  } {

    if (dragBeadIndex < 0 || dragBeadIndex >= beads.length) {
      return { isValid: false, message: "无效的珠子索引" };
    }

    // 使用现有的插入检测算法
    const insertionResult = this.detectInsertionBetweenBeads(beads, dragBeadIndex, newX, newY);

    if (!insertionResult.shouldInsert || insertionResult.insertIndex === undefined) {
      return { isValid: false, message: insertionResult.message };
    }

    // 计算光标位置：在插入点显示预览
    const cursorPosition = this.calculateInsertionCursorPosition(
      beads,
      dragBeadIndex,
      insertionResult.insertIndex
    );

    return {
      isValid: true,
      insertIndex: insertionResult.insertIndex,
      cursorX: cursorPosition.x,
      cursorY: cursorPosition.y,
      insertionType: insertionResult.message?.includes('扇形') ? 'sector-based' : 'nearest-beads',
      message: insertionResult.message
    };
  }

  /**
   * 计算插入光标的显示位置（直接指向 insertIndex 位置）
   */
  private calculateInsertionCursorPosition(
    beads: Position[],
    dragBeadIndex: number,
    insertIndex: number
  ): { x: number; y: number } {

    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };

    if (beads.length <= 1) {
      return center;
    }
    const targetBead = beads[insertIndex];
    return {
      x: targetBead.x,
      y: targetBead.y
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
      positions.map(pos => ({ width: pos.render_diameter, height: pos.diameter })),
      center,
      false
    );

    return positions.map((position, index) => ({
      ...position,
      x: newCoordinates[index]?.x || 0,
      y: newCoordinates[index]?.y || 0,
      angle: newCoordinates[index]?.angle || 0,
      height: newCoordinates[index]?.height || position.height,
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
