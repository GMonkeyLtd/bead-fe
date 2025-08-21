import { computeBraceletLength, calculateBeadArrangementBySize } from "@/utils/cystal-tools";
import { Bead, BeadWithPosition, Position } from "../../../types/crystal";

/**
 * 生成唯一的珠子key
 * 格式: bead_{timestamp}_{index}_{random}
 */
export function generateUniqueBeadKey(index: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `bead_${timestamp}_${index}_${random}`;
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
      width: bead.width,
    })) as any; // 临时类型断言，避免类型不匹配
    return computeBraceletLength(beadsForCalculation, "width");
  }
  // 根据图片比例计算在显示时的绳上宽度
  calculateScaledBeadWidth(bead: Bead): number {
    if (!bead.imageWHRatio) return bead.width;
    return bead.diameter * bead.imageWHRatio;
  }

  /**
   * 动态计算圆环半径
   */
  calculateRingRadius(beads: Bead[]): number {
    if (!beads.length) return 0;
    
    const { canvasSize, spacing } = this.config;

    if (beads.length === 10) {
      return canvasSize * 0.4;
    }

    // 计算所有珠子的总直径和总间距
    const totalBeadDiameter = beads.reduce(
      (sum, b) => sum + b.scale_width,
      0
    );
    const totalSpacing = beads.length * spacing; // n个珠子需要n个间距
    const totalArcLen = totalBeadDiameter + totalSpacing;

    // 基础圆环半径
    const baseRadius = totalArcLen / (2 * Math.PI);

    // 确保最小半径，避免珠子过度拥挤
    const maxBeadRadius = Math.max(...beads.map((b) => b.width / 2));
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
  calculateBeadPositions(beads: Bead[], _existingPositions?: Position[]): Position[] {
    if (!beads.length) return [];

    // 获取beads的image_url对应图片的长款
    const ringRadius = this.config.targetRadius || this.calculateRingRadius(beads);
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    const positions = calculateBeadArrangementBySize(
      ringRadius,
      beads.map(bead => ({ ratioBeadWidth: bead.ratioBeadWidth as number, beadDiameter: bead.diameter })),
      center,
      false
    );

    return beads.map((bead, index) => {
      const position: Position = positions[index];

      const beadWithPosition: BeadWithPosition = {
        ...bead,
        ...position,
        uniqueKey: generateUniqueBeadKey(index), // 优先使用现有key，否则生成新key
      };

      return beadWithPosition;
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
      });
    } else {
      // 替换选中的珠子
      newBeads[selectedIndex] = {
        ...newBead,
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
    // 删除后置空选中态
    // const newSelectedIndex = -1;

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
  validateBeadCount(beads: Bead[], newBeadDiameter: number, type: 'add' | 'remove' = 'add'): { isValid: boolean; message?: string   } {
    const currentLength = this.calculatePredictedLength(beads);
    const newLength = type === 'add' ? currentLength + newBeadDiameter * 0.1 : currentLength - newBeadDiameter * 0.1;

    // if (newLength > this.config.maxWristSize && type === 'add') {
    //   return {
    //     isValid: false,
    //     message: "哎呀，珠子有点多啦！一般手围建议不超过23cm噢。"
    //   };
    // }

    // if (newLength < this.config.minWristSize && type === 'remove') {
    //   return {
    //     isValid: false,
    //     message: "哎呀，珠子有点少啦！一般手围建议不少于12cm噢。"
    //   };
    // }

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
    const beadProximityThreshold = Math.max(closestBead.scale_width * 1.5, 40); // 珠子邻近阈值
    const dragFromCenterDistance = Math.sqrt(Math.pow(newX - center.x, 2) + Math.pow(newY - center.y, 2));

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
    _dragBeadIndex: number,
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
  recalculatePositions(positions: BeadWithPosition[]): BeadWithPosition[] {
    if (!positions.length) return [];
    console.log(positions, 'recalculatePositions')

    const ringRadius = this.config.targetRadius || this.calculateRingRadius(positions);
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };

    const newCoordinates = calculateBeadArrangementBySize(
      ringRadius,
      positions.map(pos => ({ ratioBeadWidth: pos.ratioBeadWidth || 0, beadDiameter: pos.diameter || 0 })),
      center,
      false
    );

    return positions.map((position, index) => {
      const newPosition = newCoordinates[index];
      return {
      ...position,
      ...newPosition,
      uniqueKey: position.uniqueKey || generateUniqueBeadKey(index)
    }});
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

    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    const maxRadius = this.config.canvasSize * 0.4;
    const minRadius = Math.max(...beads.map(b => (b.render_diameter || b.diameter) / 2)) * 1.5;

    // 计算新位置相对于圆心的距离
    const deltaX = newX - center.x;
    const deltaY = newY - center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 1. 首先检查是否在手串圆环有效范围内
    const isInRingArea = distance >= minRadius && distance <= maxRadius;
    
    // 2. 检查是否覆盖在其他珠子上
    const draggedBead = beads[dragBeadIndex];
    let isOverBead = false;
    let overBeadIndex = -1;
    
    for (let i = 0; i < beads.length; i++) {
      if (i === dragBeadIndex) continue;

      const bead = beads[i];
      const beadDistance = Math.sqrt(
        Math.pow(newX - bead.x, 2) + Math.pow(newY - bead.y, 2)
      );

      // 检查是否覆盖在珠子上（使用较大的容差来判断覆盖）
      const overlapThreshold = ((draggedBead.render_diameter || draggedBead.diameter) + (bead.render_diameter || bead.diameter)) / 4;
      if (beadDistance <= overlapThreshold) {
        isOverBead = true;
        overBeadIndex = i;
        break;
      }
    }

    // 3. 如果既不在圆环内也不覆盖珠子，则无效
    if (!isInRingArea && !isOverBead) {
      return {
        isValid: false,
        message: "拖拽失败：请将珠子拖拽到手串圆环内或其他珠子上"
      };
    }

    // 4. 如果覆盖在珠子上，检查是否可以插入到两个珠子之间
    if (isOverBead) {
      const insertionResult = this.detectInsertionBetweenBeads(beads, dragBeadIndex, newX, newY);
      if (insertionResult.shouldInsert) {
        return {
          isValid: true,
          shouldInsert: true,
          insertIndex: insertionResult.insertIndex,
          message: insertionResult.message
        };
      } else {
        // 如果覆盖在珠子上但不能插入，尝试找到最近的有效插入位置
        const nearestInsertionResult = this.findNearestValidInsertionPosition(beads, dragBeadIndex, newX, newY);
        if (nearestInsertionResult.isValid) {
          return {
            isValid: true,
            shouldInsert: true,
            insertIndex: nearestInsertionResult.insertIndex,
            message: "自动调整到最近的有效插入位置"
          };
        }
      }
    }

    // 5. 如果在圆环内，检查是否可以插入到两个珠子之间
    if (isInRingArea) {
      const insertionResult = this.detectInsertionBetweenBeads(beads, dragBeadIndex, newX, newY);
      if (insertionResult.shouldInsert) {
        return {
          isValid: true,
          shouldInsert: true,
          insertIndex: insertionResult.insertIndex,
          message: insertionResult.message
        };
      }
    }

    // 6. 检查是否在合理范围内但不能插入的情况
    if (distance < minRadius || distance > maxRadius) {
      return {
        isValid: false,
        message: "拖拽失败：位置不在有效范围内，珠子已恢复原位置"
      };
    }

    // 7. 如果到达这里，说明位置在有效范围内但不是插入操作
    return {
      isValid: false,
      message: "拖拽失败：珠子只能插入到其他珠子之间，已恢复原位置"
    };
  }

  /**
   * 找到最近的有效插入位置
   */
  findNearestValidInsertionPosition(
    beads: Position[],
    dragBeadIndex: number,
    newX: number,
    newY: number
  ): {
    isValid: boolean;
    insertIndex?: number;
    message?: string;
  } {
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    
    // 计算拖拽位置的角度
    const dragAngle = Math.atan2(newY - center.y, newX - center.x);
    let normalizedDragAngle = dragAngle < 0 ? dragAngle + 2 * Math.PI : dragAngle;

    // 找到所有可能的插入位置，并计算它们与拖拽位置的角度距离
    const insertionCandidates: Array<{
      index: number;
      angle: number;
      distance: number;
    }> = [];
    
    for (let i = 0; i <= beads.length; i++) {
      if (i === dragBeadIndex || i === dragBeadIndex + 1) continue;
      
      // 计算这个插入位置的理论角度
      const totalBeads = beads.length;
      const angleStep = (2 * Math.PI) / totalBeads;
      
      let insertAngle: number;
      if (i === 0) {
        // 插入到第一个位置
        insertAngle = 0;
      } else if (i === totalBeads) {
        // 插入到最后一个位置
        insertAngle = (totalBeads - 1) * angleStep;
      } else {
        // 插入到中间位置
        insertAngle = (i - 0.5) * angleStep;
      }
      
      // 计算角度距离
      let angleDiff = Math.abs(normalizedDragAngle - insertAngle);
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }
      
      insertionCandidates.push({
        index: i,
        angle: insertAngle,
        distance: angleDiff
      });
    }
    
    // 按角度距离排序，找到最近的位置
    insertionCandidates.sort((a, b) => a.distance - b.distance);
    
    if (insertionCandidates.length > 0) {
      const nearestCandidate = insertionCandidates[0];
      return {
        isValid: true,
        insertIndex: nearestCandidate.index,
        message: `自动调整到最近的插入位置 (位置 ${nearestCandidate.index})`
      };
    }
    
    return {
      isValid: false,
      message: "无法找到有效的插入位置"
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
      width: bead.width,
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
          scale_width: pos.scale_width,
          scale_height: pos.scale_height,
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
