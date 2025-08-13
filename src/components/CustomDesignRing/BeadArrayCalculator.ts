import { computeBraceletLength, calculateBeadArrangementBySize } from "@/utils/cystal-tools";

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
   */
  calculateBeadPositions(beads: Bead[]): Position[] {
    if (!beads.length) return [];
    const ringRadius = this.config.targetRadius || this.calculateRingRadius(beads);
    const center = { x: this.config.canvasSize / 2, y: this.config.canvasSize / 2 };
    
    const positions = calculateBeadArrangementBySize(
      ringRadius,
      beads.map(bead => bead.diameter),
      center,
      false
    );

    return beads.map((bead, index) => ({
      ...bead,
      x: positions[index]?.x || 0,
      y: positions[index]?.y || 0,
      angle: positions[index]?.angle || 0,
      radius: positions[index]?.radius || 0,
      imageData: bead.image_url, // 使用image_url作为初始值
    }));
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
