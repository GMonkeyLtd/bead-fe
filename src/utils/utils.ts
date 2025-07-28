import {
  BEAD_HAND_CIRCUMFERENCE_TEMPLATE,
  BEAD_SIZE_TEMPLATE,
  WISH_TEMPLATES,
} from "@/config/beads";

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
