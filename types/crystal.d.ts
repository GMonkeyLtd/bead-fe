import { BeadItem } from "@/utils/api-session";


export interface Position extends BeadItem {
    x: number;
    y: number;
    angle: number;
    scale_height: number;
    scale_width: number;
    index: number;
    uniqueKey: string;
}

export interface BeadWithPosition extends BeadItem {
    x: number;
    y: number;
    angle: number;
    scale_height: number;
    scale_width: number;
    index: number;
    uniqueKey: string;
}