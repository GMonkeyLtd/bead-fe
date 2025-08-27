import { BeadArrayCalculator } from "./BeadArrayCalculator";
import { Bead, Position } from "../../../types/crystal";
import { ImageCacheManager } from "@/utils/image-cache";
import { HistoryManager } from "./HistoryManager";

export interface BeadPositionManagerConfig {
  canvasSize: number;
  spacing: number;
  renderRatio: number;
  targetRadius?: number;
  maxWristSize: number;
  minWristSize: number;
  enableHistory?: boolean;
  maxHistoryLength?: number;
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
  private state: BeadPositionManagerState;
  private imageProcessCache: Map<string, string>;
  private positionCache: Map<string, Position[]>;
  private isProcessing: boolean = false;
  private historyManager: HistoryManager | null = null;

  constructor(config: BeadPositionManagerConfig) {
    this.calculator = new BeadArrayCalculator(config);
    this.state = {
      beads: [],
      selectedBeadIndex: -1,
      predictedLength: 0,
      beadStatus: "idle",
    };
    this.imageProcessCache = new Map();
    this.positionCache = new Map();
    
    // 初始化历史记录管理器
    if (config.enableHistory !== false) {
      this.historyManager = new HistoryManager({
        maxHistoryLength: config.maxHistoryLength || 50,
      });
    }
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
  async setBeads(beads: Bead[], skipHistory: boolean = false): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.setState({ beadStatus: "processing" }, skipHistory);

    try {
      // 处理图片
      const processedBeads = beads.map(bead => ({
        ...bead,
        ratioBeadWidth: this.calculator.calculateScaledBeadWidth(bead),
      }))
      // 计算位置，传递现有位置信息以保持uniqueKey连续性
      const beadsWithPosition = this.calculator.calculateBeadPositions(processedBeads, this.state.beads);
      
      // 计算预测长度
      const predictedLength = this.calculator.calculatePredictedLength(processedBeads);
      
      this.setState({
        beads: beadsWithPosition,
        predictedLength,
        beadStatus: "success",
      }, skipHistory);
    } catch (error) {
      console.error("设置珠子失败:", error);
      this.setState({ beadStatus: "error" }, skipHistory);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 添加珠子
   */
  async addBead(newBead: Bead): Promise<void> {
    const validation = this.calculator.validateBeadCount(this.state.beads, newBead.diameter, 'add');
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
    const validation = this.calculator.validateBeadCount(this.state.beads, targetBead.diameter, 'remove');
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const { newBeads, newSelectedIndex } = this.calculator.removeBead(
      this.state.beads,
      this.state.selectedBeadIndex
    );
    this.setState({ selectedBeadIndex: newSelectedIndex }, true); // 跳过历史记录
    await this.setBeads(newBeads);
  }

  /**
   * 移动珠子
   */
  async moveBead(direction: 'clockwise' | 'counterclockwise'): Promise<void> {
    if (this.state.selectedBeadIndex === -1) {
      // 没有选中珠子时，所有珠子都移动一位
      const newBeads = this.calculator.moveAllBeads(this.state.beads, direction);
      await this.setBeads(newBeads);
    } else {
      // 有选中珠子时，只移动选中的珠子
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

      this.setState({ selectedBeadIndex: newSelectedIndex }, true); // 跳过历史记录
      await this.setBeads(newBeads);
    }
  }

  /**
   * 选择珠子
   */
  selectBead(index: number): void {
    if (index >= 0 && index < this.state.beads.length) {
      this.setState({ selectedBeadIndex: index }, true); // 跳过历史记录
    }
  }

  /**
   * 取消选择珠子
   */
  deselectBead(): void {
    this.setState({ selectedBeadIndex: -1 }, true); // 跳过历史记录
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
    // 替换选中索引
    this.setState({ selectedBeadIndex: -1 }, true); // 跳过历史记录
    await this.setBeads(newBeads);
  }

  /**
   * 拖拽珠子到新位置（支持重排序）
   */
  async dragBeadToPosition(beadIndex: number, newX: number, newY: number): Promise<{ success: boolean; message: string }> {
    if (beadIndex < 0 || beadIndex >= this.state.beads.length) {
      throw new Error("无效的珠子索引");
    }

    // 保存原始位置用于回退
    const originalBeads = [...this.state.beads];
    console.log('开始拖拽计算 => 拖拽index，原始位置', beadIndex, originalBeads);
    const originalSelectedIndex = this.state.selectedBeadIndex;

    try {
      
      // 验证拖拽位置
      const validation = this.calculator.validateDragPosition(this.state.beads, beadIndex, newX, newY);
      
      
      if (validation.isValid && validation.shouldInsert && validation.insertIndex !== undefined) {
        
        // 情况1：可以插入到两个珠子之间
        const reorderedBeads = this.calculator.reorderBeads(this.state.beads, beadIndex, validation.insertIndex);
        
        
        // 重新计算位置 - 使用专门的方法保持Position属性完整
        const newPositions = this.calculator.recalculatePositions(reorderedBeads);
        
        console.log("🔄 重排序后的珠子", newPositions);
        // 计算新的选中索引
        // let newSelectedIndex = validation.insertIndex;
              
        this.setState({
          beads: newPositions,
          selectedBeadIndex: -1,
          predictedLength: this.calculator.calculatePredictedLength(reorderedBeads),
          beadStatus: "success",
        });

        return {
          success: true,
          message: validation.message || "珠子位置已调整"
        };
      } else {
        console.log("❌ 无法插入，恢复原位置", { 
          isValid: validation.isValid, 
          shouldInsert: validation.shouldInsert, 
          insertIndex: validation.insertIndex 
        });
        
        // 情况2：拖拽失败，恢复原位置
        this.setState({
          beads: originalBeads,
          selectedBeadIndex: originalSelectedIndex,
          beadStatus: "success",
        });

        return {
          success: false,
          message: validation.message || "拖拽失败，珠子已恢复原位置"
        };
      }
    } catch (error) {
      // 发生错误时恢复原状态
      this.setState({
        beads: originalBeads,
        selectedBeadIndex: originalSelectedIndex,
        beadStatus: "error",
      }, true);

      console.error("拖拽处理失败:", error);
      return {
        success: false,
        message: "拖拽处理失败，珠子已恢复原位置"
      };
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
   * 预览插入位置（用于拖拽时的实时预览）
   */
  previewInsertionPosition(
    beadIndex: number, 
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
    return this.calculator.previewInsertionPosition(this.state.beads, beadIndex, newX, newY);
  }

  /**
   * 设置状态
   */
  private setState(partialState: Partial<BeadPositionManagerState>, skipHistory: boolean = false): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    // 如果启用了历史记录且状态发生了变化且不跳过历史记录，记录历史
    if (this.historyManager && !skipHistory && this.hasStateChanged(oldState, this.state)) {
      // 检查是否在新分支上
      const wasOnNewBranch = this.historyManager.isOnNewBranch();
      
      this.historyManager.addHistory(this.state, this.generateHistoryDescription(oldState, this.state));
      
      // 如果之前在新分支上，现在创建了新的历史记录，记录日志
      if (wasOnNewBranch) {
        console.log('在历史分支上创建了新的历史记录，旧分支已被清理');
      }
    }
  }

  /**
   * 检查状态是否发生变化
   */
  private hasStateChanged(oldState: BeadPositionManagerState, newState: BeadPositionManagerState): boolean {
    // 检查珠子数组是否发生变化
    if (oldState.beads.length !== newState.beads.length) return true;
    // 检查珠子内容是否发生变化
    for (let i = 0; i < oldState.beads.length; i++) {
      if (oldState.beads[i].sku_id !== newState.beads[i].sku_id) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 生成历史记录描述
   */
  private generateHistoryDescription(oldState: BeadPositionManagerState, newState: BeadPositionManagerState): string {
    if (oldState.beads.length < newState.beads.length) {
      return `添加珠子 (${newState.beads.length}个)`;
    } else if (oldState.beads.length > newState.beads.length) {
      return `删除珠子 (${newState.beads.length}个)`;
    } else if (oldState.beads.length > 0 && newState.beads.length > 0) {
      // 检查是否有珠子被替换
      for (let i = 0; i < oldState.beads.length; i++) {
        if (oldState.beads[i].id !== newState.beads[i].id) {
          return `替换珠子`;
        }
      }
      return `移动珠子`;
    }
    return `修改手串`;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.imageProcessCache.clear();
    this.positionCache.clear();
    this.isProcessing = false;
  }

  /**
   * 历史记录相关方法
   */
  
  /**
   * 撤销操作
   */
  undo(): BeadPositionManagerState | null {
    if (!this.historyManager) return null;
    
    const previousState = this.historyManager.undo();
    if (previousState) {
      // 直接设置状态，跳过历史记录
      this.state = { ...previousState };
      return this.state;
    }
    return null;
  }

  /**
   * 重做操作
   */
  redo(): BeadPositionManagerState | null {
    if (!this.historyManager) return null;
    
    const nextState = this.historyManager.redo();
    if (nextState) {
      // 直接设置状态，跳过历史记录
      this.state = { ...nextState };
      return this.state;
    }
    return null;
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.historyManager ? this.historyManager.canUndo() : false;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.historyManager ? this.historyManager.canRedo() : false;
  }

  /**
   * 获取历史记录信息
   */
  getHistoryInfo(): { currentIndex: number; historyLength: number } {
    if (!this.historyManager) {
      return { currentIndex: -1, historyLength: 0 };
    }
    return {
      currentIndex: this.historyManager.getCurrentIndex(),
      historyLength: this.historyManager.getHistoryLength(),
    };
  }

  /**
   * 获取分支信息
   */
  getBranchInfo(): {
    isOnNewBranch: boolean;
    remainingSteps: number;
    totalSteps: number;
  } {
    if (!this.historyManager) {
      return { isOnNewBranch: false, remainingSteps: 0, totalSteps: 0 };
    }
    return this.historyManager.getBranchInfo();
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    if (this.historyManager) {
      this.historyManager.clear();
    }
  }
}
