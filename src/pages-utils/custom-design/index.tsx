import Taro from "@tarojs/taro";
import CustomDesignRing from "@/components/CustomDesignRing";
import { useEffect, useState } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { useDesign } from "@/store/DesignContext";
import { generateUUID } from "@/utils/uuid";
import { pageUrls } from "@/config/page-urls";


const CustomDesign = () => {
  const [designData, setDesignData] = useState<any[]>([]);
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const { beadData, addBeadData } = useDesign();

  const {beadDataId} = Taro.getCurrentInstance()?.router?.params || {};
  console.log(Taro.getCurrentInstance()?.router?.params, 'custom-design')

  useEffect(() => {

    beadsApi.getBeadList().then((res) => {
      const resData = res.data;
      setAllBeadList(resData);
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
      setDesignData(_beadData)
    }
  }, []);

  const onCreate = (imageUrl: string, editedBeads: any[]) => {
    if (!imageUrl) {
      return;
    }
    console.log(editedBeads,allBeadList, 'editedBeads')
    const beadDataId = "bead-" + generateUUID();
    addBeadData({
      image_url: imageUrl,
      bead_list: editedBeads.map((item) => {
        const _beadData = allBeadList?.find((_item) => _item.id === item.id);
        return {
          ..._beadData,
          bead_diameter: item.radius
        }
      }),
      bead_data_id: beadDataId,
    });

    Taro.redirectTo({
      url: pageUrls.quickDesign + "?beadDataId=" + beadDataId,
    });
};

  return (
    <PageContainer>
      <CustomDesignRing
        beads={designData?.bead_list?.map((item) => ({
          id: item.id,
          image_url: item.image_url,
          radius: item.bead_diameter,
        }))}
        size={300}
        beadTypeMap={beadTypeMap}
        onOk={onCreate}
      />
    </PageContainer>
  );
};

export default CustomDesign;
