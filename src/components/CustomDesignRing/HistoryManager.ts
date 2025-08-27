import { BeadPositionManagerState } from "./BeadPositionManager";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  state: BeadPositionManagerState;
  description: string;
}

export interface HistoryManagerConfig {
  maxHistoryLength?: number;
}

/**
 * 历史记录管理器
 * 负责管理珠子数组的操作历史，支持撤销和重做
 */
export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistoryLength: number;

  constructor(config: HistoryManagerConfig = {}) {
    this.maxHistoryLength = config.maxHistoryLength || 50;
  }

  /**
   * 添加新的历史记录
   */
  addHistory(state: BeadPositionManagerState, description: string): void {
    // 如果当前不在历史末尾，删除当前位置之后的所有记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    const entry: HistoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      state: this.cloneState(state),
      description,
    };

    this.history.push(entry);
    this.currentIndex = this.history.length - 1;

    // 限制历史记录数量
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
      this.currentIndex = Math.max(0, this.currentIndex - 1);
    }
  }

  /**
   * 撤销操作
   */
  undo(): BeadPositionManagerState | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.cloneState(this.history[this.currentIndex].state);
    }
    return null;
  }

  /**
   * 重做操作
   */
  redo(): BeadPositionManagerState | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.cloneState(this.history[this.currentIndex].state);
    }
    return null;
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 获取当前历史记录索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 获取历史记录总数
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * 获取当前历史记录
   */
  getCurrentHistory(): HistoryEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 获取历史记录摘要
   */
  getHistorySummary(): Array<{ index: number; description: string; timestamp: number }> {
    return this.history.map((entry, index) => ({
      index,
      description: entry.description,
      timestamp: entry.timestamp,
    }));
  }

  /**
   * 检查当前是否在新分支上（即是否在历史中间点）
   */
  isOnNewBranch(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 获取当前分支信息
   */
  getBranchInfo(): {
    isOnNewBranch: boolean;
    remainingSteps: number;
    totalSteps: number;
  } {
    return {
      isOnNewBranch: this.isOnNewBranch(),
      remainingSteps: this.history.length - 1 - this.currentIndex,
      totalSteps: this.history.length,
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 深度克隆状态对象
   */
  private cloneState(state: BeadPositionManagerState): BeadPositionManagerState {
    return {
      beads: state.beads.map(bead => ({ ...bead })),
      selectedBeadIndex: state.selectedBeadIndex,
      predictedLength: state.predictedLength,
      beadStatus: state.beadStatus,
    };
  }
}
