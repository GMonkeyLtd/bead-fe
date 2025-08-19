export interface Bead {
    id: string | number;
    image_url: string;
    diameter: number; // 珠子直径
    width: number; // 珠子宽度
    render_diameter?: number; // 渲染直径
}

export interface Position extends Bead {
    x: number;
    y: number;
    angle: number;
    radius: number;
    scale_height: number;
    width: number;    // 手串上渲染宽度
    diameter: number;
    imageData?: string; // 可选，因为可能还没有处理图片
    uniqueKey?: string; // 唯一标识符，用于React key和精确识别珠子
    index?: string | number; // 索引
}