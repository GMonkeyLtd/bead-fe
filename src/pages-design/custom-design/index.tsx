import Taro from "@tarojs/taro";
import CustomDesignRing from "@/components/CustomDesignRing";
import { useEffect, useState } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { useDesign } from "@/store/DesignContext";
import { generateUUID } from "@/utils/uuid";
import { pageUrls } from "@/config/page-urls";
import { CircleRing } from "@/components/CircleRing";
import apiSession from "@/utils/api-session";

const CustomDesign = () => {
  const [designData, setDesignData] = useState<any[]>([]);
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const { beadData, addBeadData } = useDesign();

  const { beadDataId } = Taro.getCurrentInstance()?.router?.params || {};
  console.log(designData, 'designData')

  useEffect(() => {
    beadsApi.getBeadList().then((res) => {
      const resData = res.data;
      setAllBeadList(resData);
      setBeadTypeMap(
        resData.reduce((acc, item) => {
          (item.wuxing || []).map((wuxingValue) => {
            if (acc[wuxingValue]) {
              acc[wuxingValue].push(item);
            } else {
              acc[wuxingValue] = [item];
            }
          })
          return acc;
        }, {})
      );
    });
  }, []);

  useEffect(() => {
    if (beadDataId) {
      const _beadData = beadData.find(
        (item) => item.bead_data_id === beadDataId
      );
      setDesignData(_beadData);
    }
  }, [beadDataId, beadData]);

  const onCreate = (imageUrl: string, editedBeads: any[]) => {
    if (!imageUrl || !designData?.session_id || !designData?.draft_id) {
      return;
    }
    const beads = editedBeads.map((item) => {
      const _beadData = allBeadList?.find((_item) => _item.id == item.id);
      return {
        ..._beadData,
        bead_diameter: item.bead_diameter || item.diameter,
      };
    })

    apiSession.cloneDraft({
      session_id: designData?.session_id,
      draft_id: designData?.draft_id,
      beads,
    }).then((res) => {
      const { draft_id, session_id } = res.data || {};

      Taro.redirectTo({
        url: `${pageUrls.quickDesign}?sessionId=${session_id}&draftId=${
          draft_id
        }&imageUrl=${encodeURIComponent(imageUrl)}`,
      });
    }).catch((err) => {
      Taro.showToast({
        title: "定制失败:" + JSON.stringify(err),
        icon: "error",
      });
    })

  };

  return (
    <PageContainer>
      <CustomDesignRing
        beads={designData?.bead_list?.map((item) => {
          const diameter = item.bead_diameter || item.diameter;
          return {
            id: item.id || item.bead_id,
            image_url: item.image_url,
            render_diameter: diameter * 3,
            bead_diameter: diameter,
          };
        })}
        size={300}
        beadTypeMap={beadTypeMap}
        onOk={onCreate}
        renderRatio={3}
      />
    </PageContainer>
  );
};

export default CustomDesign;
