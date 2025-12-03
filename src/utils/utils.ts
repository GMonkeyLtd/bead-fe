import {
  BEAD_HAND_CIRCUMFERENCE_TEMPLATE,
  BEAD_SIZE_TEMPLATE,
  WISH_TEMPLATES,
} from "@/config/beads";
import { BeadItem } from "./api-session";

const isBeadSize = (value: string) => {
  const len = value.length;
  return value.substring(len - 2, len) === "mm";
};

const isBeadHandCircumference = (value: string) => {
  const len = value.length;
  return value.substring(len - 2, len) === "cm";
};

export const getRecommendTemplate = (wish: string) => {
  if (isBeadSize(wish)) {
    return BEAD_SIZE_TEMPLATE.replace("{size}", wish);
  }
  if (isBeadHandCircumference(wish)) {
    return BEAD_HAND_CIRCUMFERENCE_TEMPLATE.replace(
      "{hand_circumference}",
      wish
    );
  }
  const template = WISH_TEMPLATES.find((item) => item.wish === wish);
  return template?.reply || wish;
};


export const getDeduplicateBeads = (beads: BeadItem[], duplicateKey: string) => {
  const duplicateKeys = new Set();
  return beads.filter((item) => {
    if (!item?.func_summary) {
      return false;
    }
    if (duplicateKeys.has(item[duplicateKey])) {
      return false;
    }
    duplicateKeys.add(item[duplicateKey]);
    return true;
  });
  
} 

export const formatProductCategory = (category: string) => {
  switch (category) {
    case "bracelet":
      return "手链";
    case "necklace":
      return "项链";
    case "other":
      return "其他";
    default:
      return category;
  }
};