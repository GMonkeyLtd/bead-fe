import Taro from "@tarojs/taro";
import CustomDesignRing, { CustomDesignRingRef } from "@/components/CustomDesignRing";
import { useCallback, useEffect, useState, useRef } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { useDesign } from "@/store/DesignContext";
import { pageUrls } from "@/config/page-urls";
import apiSession, { BeadItem } from "@/utils/api-session";
import { usePollDraft } from "@/hooks/usePollDraft";
import { CUSTOM_RENDER_RATIO } from "@/config/beads";

const CustomDesign = () => {
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const { draft, startPolling } = usePollDraft({ showLoading: true });

  const { draftId, sessionId } = Taro.getCurrentInstance()?.router?.params || {};
  console.log(draft, 'draft')

  // 使用ref获取子组件状态
  const customDesignRef = useRef<CustomDesignRingRef>(null);

  useEffect(() => {
    if (draftId && sessionId) {
      startPolling(sessionId, draftId);
    }
  }, [draftId]);

  useEffect(() => {
    beadsApi.getBeadList({ showLoading: true }).then((res) => {
      const resData = res.data;
      setAllBeadList(resData);
      setBeadTypeMap(
        resData.reduce((acc, item) => {
          (item.wuxing || []).forEach((wuxingValue) => {
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

  const checkDeadsDataChanged = (_oldBeads: any[], _newBeads: any[]) => {
    if (!_oldBeads || !_newBeads || _oldBeads?.length !== _newBeads?.length) {
      return true;
    }
    const oldBeads = _oldBeads?.map((item) => {
      const diameter = item.bead_diameter || item.diameter;
      return {
        id: item.id || item.bead_id,
        bead_diameter: diameter,
      };
    });
    const newBeads = _newBeads?.map((item) => {
      return {
        id: item.id,
        bead_diameter: item.bead_diameter,
      };
    });
    return JSON.stringify(oldBeads) !== JSON.stringify(newBeads);
  }

  const backToChatDesign = (session_id: string) => {
    Taro.redirectTo({
      url: `${pageUrls.chatDesign}?session_id=${session_id}`,
    });
  }

  const onCreate = (imageUrl: string, editedBeads: any[], isSaveAndBack: boolean = false) => {
    if (!imageUrl || !sessionId || !draftId) {
      return;
    }
    const beads = editedBeads.map((item) => {
      const _beadData = allBeadList?.find((_item) => _item.id == item.id);
      return {
        ..._beadData,
        diameter: item.bead_diameter || item.diameter,
        bead_id: item.id,
      };
    })

    
      apiSession.saveDraft({
        session_id: sessionId,
        beads,
      }).then((res) => {
        const { draft_id, session_id } = res?.data || {};
        if (isSaveAndBack) {
          backToChatDesign(session_id);
        } else {
          Taro.redirectTo({
            url: `${pageUrls.quickDesign}?sessionId=${session_id}&draftId=${draft_id}&imageUrl=${encodeURIComponent(imageUrl)}`,
          });
        }
      })
  };

  const onSaveAndBack = (image_url: string | undefined, beads: BeadItem[]) => {
    if (!image_url) {
      return;
    }
    onCreate(image_url, beads, true);
  }

  const handleBack = () => {
    const { image_url, beads } = getCustomDesignState();
    if (!checkDeadsDataChanged(draft?.beads || [], beads || [])) {
      sessionId && backToChatDesign(sessionId);
      return;
    }
    Taro.showActionSheet({
      itemList: ['保存并返回', '直接返回'],
      success: function (res) {
        if (res.tapIndex === 0) {
          onSaveAndBack(image_url, beads);
        } else {
          sessionId && backToChatDesign(sessionId);
        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })
  }

  // 在需要获取状态时调用ref方法
  const getCustomDesignState = useCallback(() => {
    if (customDesignRef.current) {
      const state = customDesignRef.current.getState();
      return {
        image_url: state.imageUrl,
        beads: state.beads,
      }
    }
    return {};
  }, []);

  return (
    <PageContainer onBack={handleBack}>
      <CustomDesignRing
        ref={customDesignRef}
        beads={draft?.beads?.map((item) => {
          return {
            id: item.bead_id,
            image_url: item.image_url,
            render_diameter: item.diameter * CUSTOM_RENDER_RATIO,
            bead_diameter: item.diameter,
          };
        })}
        beadTypeMap={beadTypeMap}
        // 移除onChange回调
        // onChange={onChange}
        onOk={onCreate}
        renderRatio={3}
      />
    </PageContainer>
  );
};

export default CustomDesign;
