import { View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import testData from "./test.json";
import CustomDesignRing from "@/components/CustomDesignRing";
import { useEffect, useState } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { useDesign } from "@/store/DesignContext";


const CustomDesign = () => {
  const [beadList, setBeadList] = useState<any[]>([]);
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const { beadData } = useDesign();

  const {beadDataId} = Taro.getCurrentInstance()?.router?.params || {};
  console.log(Taro.getCurrentInstance()?.router?.params, 'custom-design')

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

    if (beadDataId) {
      const _beadData = beadData.find(
        (item) => item.bead_data_id === beadDataId
      );
      console.log(_beadData)
    }
  }, []);

  return (
    <PageContainer>
      <CustomDesignRing
        beads={testData.data.recommendations?.map((item, index) => ({
          image_url: item.image_url,
          radius: 10,
          name: `bead-${index}`,
        }))}
        size={300}
        beadTypeMap={beadTypeMap}
      />
    </PageContainer>
  );
};

export default CustomDesign;
