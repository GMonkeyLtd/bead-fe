import { BeadItem } from "@/utils/api-session";


export interface Position extends BeadItem {
    x: number;
    y: number;
    angle: number;
    scale_height: number;
    scale_width: number;
    index: number;
    uniqueKey: string;
    // 新增：穿线点位置（用于拖拽计算）
    threadX?: number;
    threadY?: number;
    // 新增：穿线高度比例
    passHeightRatio?: number;
}

export interface BeadWithPosition extends BeadItem {
    x: number;
    y: number;
    angle: number;
    scale_height: number;
    scale_width: number;
    index: number;
    uniqueKey: string;
    // 新增：穿线点位置（用于拖拽计算）
    threadX?: number;
    threadY?: number;
    // 新增：穿线高度比例
    passHeightRatio?: number;
}