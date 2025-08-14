import { BeadArrayCalculator, Bead, Position } from "./BeadArrayCalculator";
import { ImageCacheManager } from "@/utils/image-cache";
import Taro from "@tarojs/taro";

export interface BeadPositionManagerConfig {
  canvasSize: number;
  spacing: number;
  renderRatio: number;
  targetRadius?: number;
  maxWristSize: number;
  minWristSize: number;
}

export interface BeadPositionManagerState {
  beads: Position[];
  selectedBeadIndex: number;
  predictedLength: number;
  beadStatus: "idle" | "processing" | "success" | "error";
}

/**
 * 珠子位置管理器
 * 负责珠子的状态管理、操作和位置计算
 */
export class BeadPositionManager {
  private calculator: BeadArrayCalculator;
  private config: BeadPositionManagerConfig;
  private state: BeadPositionManagerState;
  private imageProcessCache: Map<string, string>;
  private positionCache: Map<string, Position[]>;
  private isProcessing: boolean = false;

  constructor(config: BeadPositionManagerConfig) {
    this.config = config;
    this.calculator = new BeadArrayCalculator(config);
    this.state = {
      beads: [],
      selectedBeadIndex: -1,
      predictedLength: 0,
      beadStatus: "idle",
    };
    this.imageProcessCache = new Map();
    this.positionCache = new Map();
  }

  /**
   * 获取当前状态
   */
  getState(): BeadPositionManagerState {
    return { ...this.state };
  }

  /**
   * 设置珠子数组
   */
  async setBeads(beads: Bead[]): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.setState({ beadStatus: "processing" });

    try {
      // 处理图片
      const processedBeads = await this.processImages(beads);
      
      // 计算位置
      const positions = this.calculator.calculateBeadPositions(processedBeads);
      
      // 计算预测长度
      const predictedLength = this.calculator.calculatePredictedLength(processedBeads);
      
      this.setState({
        beads: positions,
        predictedLength,
        beadStatus: "success",
      });
    } catch (error) {
      console.error("设置珠子失败:", error);
      this.setState({ beadStatus: "error" });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 添加珠子
   */
  async addBead(newBead: Bead): Promise<void> {
    const validation = this.calculator.validateBeadCount(this.state.beads, newBead.diameter);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const newBeads = this.calculator.addBead(this.state.beads, newBead, this.state.selectedBeadIndex);
    await this.setBeads(newBeads);
  }

  /**
   * 删除珠子
   */
  async removeBead(): Promise<void> {
    if (this.state.selectedBeadIndex === -1) {
      throw new Error("请先选择要删除的珠子");
    }
    const targetBead = this.state.beads[this.state.selectedBeadIndex];
    const validation = this.calculator.validateBeadCount(this.state.beads, targetBead.diameter);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const { newBeads, newSelectedIndex } = this.calculator.removeBead(
      this.state.beads,
      this.state.selectedBeadIndex
    );

    this.setState({ selectedBeadIndex: newSelectedIndex });
    await this.setBeads(newBeads);
  }

  /**
   * 移动珠子
   */
  async moveBead(direction: 'clockwise' | 'counterclockwise'): Promise<void> {
    if (this.state.selectedBeadIndex === -1) {
      throw new Error("请先选择要移动的珠子");
    }

    const newBeads = this.calculator.moveBead(
      this.state.beads,
      this.state.selectedBeadIndex,
      direction
    );

    // 调整选中索引
    let newSelectedIndex = this.state.selectedBeadIndex;
    if (direction === 'clockwise') {
      newSelectedIndex = (this.state.selectedBeadIndex + 1) % this.state.beads.length;
    } else {
      newSelectedIndex = (this.state.selectedBeadIndex - 1 + this.state.beads.length) % this.state.beads.length;
    }

    this.setState({ selectedBeadIndex: newSelectedIndex });
    await this.setBeads(newBeads);
  }

  /**
   * 选择珠子
   */
  selectBead(index: number): void {
    if (index >= 0 && index < this.state.beads.length) {
      this.setState({ selectedBeadIndex: index });
    }
  }

  /**
   * 取消选择珠子
   */
  deselectBead(): void {
    this.setState({ selectedBeadIndex: -1 });
  }

  /**
   * 替换珠子
   */
  async replaceBead(newBead: Bead): Promise<void> {
    if (this.state.selectedBeadIndex === -1) {
      throw new Error("请先选择要替换的珠子");
    }

    const newBeads = this.calculator.addBead(
      this.state.beads,
      newBead,
      this.state.selectedBeadIndex
    );

    await this.setBeads(newBeads);
  }

  /**
   * 拖拽珠子到新位置
   */
  async dragBeadToPosition(beadIndex: number, newX: number, newY: number): Promise<void> {
    if (beadIndex < 0 || beadIndex >= this.state.beads.length) {
      throw new Error("无效的珠子索引");
    }

    // 验证拖拽位置
    const validation = this.calculator.validateDragPosition(this.state.beads, beadIndex, newX, newY);
    
    if (!validation.isValid) {
      if (validation.adjustedPosition) {
        // 使用调整后的位置
        newX = validation.adjustedPosition.x;
        newY = validation.adjustedPosition.y;
        
        // 显示调整提示
        Taro.showToast({
          title: validation.message || "位置已自动调整",
          icon: "none",
          duration: 2000,
        });
      } else {
        throw new Error(validation.message || "拖拽位置无效");
      }
    }

    // 调整所有珠子的位置，保持圆环形状
    const adjustedBeads = this.calculator.adjustBeadPositionsAfterDrag(
      this.state.beads,
      beadIndex,
      newX,
      newY
    );

    // 更新状态
    this.setState({
      beads: adjustedBeads,
      beadStatus: "success",
    });
  }

  /**
   * 重新计算珠子位置以保持圆环形状
   */
  private async recalculateBeadPositions(beads: Position[]): Promise<void> {
    try {
      // 使用计算器重新计算所有珠子的位置
      const recalculatedPositions = this.calculator.calculateBeadPositions(beads);
      
      // 计算预测长度
      const predictedLength = this.calculator.calculatePredictedLength(beads);
      
      this.setState({
        beads: recalculatedPositions,
        predictedLength,
        beadStatus: "success",
      });
    } catch (error) {
      console.error("重新计算珠子位置失败:", error);
      this.setState({ beadStatus: "error" });
    }
  }

  /**
   * 获取珠子信息
   */
  getBeadArrayInfo() {
    return this.calculator.getBeadArrayInfo(this.state.beads);
  }

  /**
   * 处理图片
   */
  private async processImages(beads: Bead[]): Promise<Bead[]> {
    const cacheKey = beads
      .map(item => `${item.image_url}_${item.render_diameter}_${item.diameter}_${item.id}`)
      .join(",");

    if (this.imageProcessCache.has(cacheKey)) {
      const cachedData = this.imageProcessCache.get(cacheKey);
      return JSON.parse(cachedData || "[]");
    }

    try {
      const processedPaths = await ImageCacheManager.processImagePaths(
        beads.map(item => item.image_url)
      );

      const beadsWithImageData = beads.map(bead => ({
        ...bead,
        imageData: processedPaths.get(bead.image_url) || bead.image_url,
      }));

      // 缓存结果
      this.imageProcessCache.set(cacheKey, JSON.stringify(beadsWithImageData));

      // 限制缓存大小
      if (this.imageProcessCache.size > 50) {
        const firstKey = this.imageProcessCache.keys().next().value;
        this.imageProcessCache.delete(firstKey);
      }

      return beadsWithImageData;
    } catch (error) {
      console.error("图片处理失败:", error);
      throw error;
    }
  }

  /**
   * 设置状态
   */
  private setState(partialState: Partial<BeadPositionManagerState>): void {
    this.state = { ...this.state, ...partialState };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.imageProcessCache.clear();
    this.positionCache.clear();
    this.isProcessing = false;
  }
}
