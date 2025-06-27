import React from "react";
import { View } from "@tarojs/components";


const RightArrowIcon = ({ color = "#514B46" }: { color?: string }) => {
  return (  
    <View>

      <svg
        width="17"
        height="11"
        viewBox="0 0 17 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.30273 5.50012H16.2749"
          stroke={color}
          stroke-width="0.9"
          stroke-linecap="square"
        />
        <path
          d="M16.4523 5.50013C12.9217 5.50013 10.0596 4.03075 10.0596 0.500122"
          stroke={color}
          stroke-width="0.9"
          stroke-linecap="square"
        />
        <path
          d="M16.4523 5.50012C12.9217 5.50012 10.0596 6.9695 10.0596 10.5001"
          stroke={color}
          stroke-width="0.9"
          stroke-linecap="square"
        />
      </svg>
    </View>
  );
};

export default RightArrowIcon;
