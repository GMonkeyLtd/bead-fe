import { View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import { BRACELET_BG_IMAGE_URL } from "@/config";
import { useEffect, useState } from "react";
import apiSession, { BraceletDraft } from "@/utils/api-session";

export const BraceletDraftCard = ({ sessionId, draftId, draftData }: { sessionId?: string, draftId?: string, draftData?: BraceletDraft }) => {
  const [draft, setDraft] = useState<BraceletDraft | null>(null);

  useEffect(() => {
    if (draftData) {
      setDraft(draftData);
      return;
    }
    if (!sessionId || !draftId) {
      return;
    }
    apiSession.getDesignDraft({ session_id: sessionId, draft_id: draftId }).then((res) => {
      console.log(res.data, 'draft');
      setDraft(res.data);
    });
  }, [sessionId, draftId, draftData]);

  if (!draft) {
    return null;
  }


  return (
    <View className={styles.braceletDraftCard}>
      <View className={styles.braceletDraftCardImage}>
        <Image src={BRACELET_BG_IMAGE_URL} />
      </View>
    </View>
  );
}
