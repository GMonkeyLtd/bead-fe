export interface Bead {
    id: string | number;
    image_url: string;
    diameter: number; // 珠子直径
    width: number; // 珠子宽度
    render_diameter?: number; // 渲染直径
    imageWHRatio?: number; // 图片长宽比
    ratioBeadWidth?: number; // 根据图片长宽比计算珠子的显示宽度
    scale_height?: number; // 显示高度
}

export interface Position extends Bead {
    x: number;
    y: number;
    angle: number;
    scale_height: number;
    scale_width: number;
    index: number;
}

export interface BeadWithPosition extends Bead {
    x: number;
    y: number;
    angle: number;
    scale_height: number;
    scale_width: number;
    index: number;
    uniqueKey: string;
}