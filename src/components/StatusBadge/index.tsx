
import { View } from "@tarojs/components";

export enum StatusBadgeType {
  Processing = "Processing",
  Success = "Success",
  Error = "Error",
}

const StatusBadge: React.FC<{
  type: StatusBadgeType;
  style?: React.CSSProperties;
  text: string;
}> = ({ type, style, text }) => {
  const getStatusBadgeStyle = () => {
    switch (type) {
      case StatusBadgeType.Processing:
        return { background: "#FFEDD8", color: "#583408" };
      case StatusBadgeType.Success:
        return { background: "#E1F5E5", color: "#1F1722" };
      case StatusBadgeType.Error:
        return { background: "#FFD7D7", color: "#A70E0E", };
    }
  };
  return (
    <View
      style={{
        borderRadius: "4px",
        padding: "2px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Noto Sans SC",
        fontWeight: 350,
        fontSize: "11px",
        lineHeight: "1.35em",
        ...getStatusBadgeStyle(),
        ...style,
      }}
    >
      {text}
    </View>
  );
};

export default StatusBadge;
