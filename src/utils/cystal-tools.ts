// 动态计算珠子数量 - 使用更精确的几何计算
export const calculateDotCount = (dotRadius: number, dotDistance: number, spacingFactor: number) => {
    // 方法1: 基于弦长的精确计算
    // 当两个珠子相切时，它们中心之间的距离应该是 2 * dotRadius * spacingFactor
    const requiredChordLength = 2 * dotRadius * spacingFactor;
    
    // 利用弦长公式：chord = 2 * R * sin(θ/2)，其中R是大圆半径，θ是圆心角
    // 所以：θ = 2 * arcsin(chord / (2 * R))
    const halfAngle = Math.asin(Math.min(1, requiredChordLength / (2 * dotDistance)));
    const anglePerDot = 2 * halfAngle;
    
    // 计算能放置的珠子数量
    let calculatedCount = Math.floor(2 * Math.PI / anglePerDot);
    
    // 方法2: 基于弧长的简化计算（作为备用）
    if (calculatedCount <= 0 || !isFinite(calculatedCount)) {
        const circumference = 2 * Math.PI * dotDistance;
        const requiredArcLength = 2 * dotRadius * spacingFactor;
        calculatedCount = Math.floor(circumference / requiredArcLength);
    }
    
    // 确保数量合理（至少3个，最多100个）
    const finalCount = Math.max(3, Math.min(100, calculatedCount));
    
    return finalCount;
};

export const calculateDotLocation = (index: number, dotCount: number, dotDistance: number, centerX: number, centerY: number) => {
    const angle = (index / dotCount) * Math.PI * 2;
    const x = centerX + dotDistance * Math.cos(angle);
    const y = centerY + dotDistance * Math.sin(angle);
    return { x, y };
};

export const getDotRingData = (dotList: string[], dotDistance: number, centerX: number, centerY: number) => {
    const dotCount = dotList.length;
    const dotRingData: any[] = [];
    for (let i = 0; i < dotCount; i++) {
        const { x, y } = calculateDotLocation(i, dotCount, dotDistance, centerX, centerY);
        dotRingData.push({
            x, 
            y, 
            index: i, 
            angle: (i / dotCount) * Math.PI * 2, 
            arcLength: (2 * Math.PI * dotDistance) / dotCount, 
            bgImage: dotList[i],
            size: dotDistance
        });
    }
    return dotRingData;
};

interface Bead {
    x: number;
    y: number;
    radius: number;
    angle: number;
    index: number;
}

export const calculateBeadArrangement = (ringRadius: number, beadCount: number) => {
    // 计算小圆珠的半径
    // 当n个小圆围成大圆时，小圆半径计算公式：
    // r = R / (1 + 1/sin(π/n))
    // 其中R是大圆半径，n是小圆个数，r是小圆半径
    console.log(ringRadius, beadCount, 'ringRadius, beadCount')
    const beadRadius = ringRadius / (1 + 1/Math.sin(Math.PI/beadCount));
    
    // 计算每个小圆的位置
    const beads: Bead[] = [];
    for (let i = 0; i < beadCount; i++) {
        // 计算当前小圆的角度
        const angle = (i / beadCount) * Math.PI * 2;
        
        // 计算小圆中心的位置
        // 小圆中心到大圆中心的距离是 ringRadius - beadRadius
        const distance = ringRadius - beadRadius;
        const x = ringRadius + distance * Math.cos(angle);
        const y = ringRadius + distance * Math.sin(angle);
        
        beads.push({
            x,
            y,
            radius: beadRadius,
            angle,
            index: i
        });
    }
    
    return {
        beadRadius,
        beads
    };
};