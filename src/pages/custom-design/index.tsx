import { View, Image } from "@tarojs/components";
import testData from "./test.json";
import CustomDesignRing from "@/components/CustomDesignRing";
import { useEffect, useState } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";

const CustomDesign = () => {
  const [beadList, setBeadList] = useState<any[]>([]);
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});

  useEffect(() => {
    beadsApi.getBeadList().then((res) => {
      console.log(res, "res");
      const resData = res.data;
      setBeadList(resData);
      setBeadTypeMap(
        resData.reduce((acc, item) => {
          const wuxingList = (item.wuxing || "  ").split("、");
          wuxingList.forEach((wuxingValue) => {
            wuxingValue = wuxingValue.trim()[0];
            if (acc[wuxingValue]) {
              acc[wuxingValue].push(item);
            } else {
              acc[wuxingValue] = [item];
            }
          });
          return acc;
        }, {})
      );
    });
  }, []);

  return (
    <PageContainer keyboardVisible={false}>
      <CustomDesignRing
        beads={testData.data.recommendations?.map((item, index) => ({
          image: item.image_url,
          radius: item.radius,
          name: `bead-${index}`,
        }))}
        size={300}
        beadTypeMap={beadTypeMap}
      />
    </PageContainer>
  );
};

export default CustomDesign;
