import api from "./api";

const quickGenerate = async (params: {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: number;
}): Promise<{
  image_url: string;
  bead_image_urls: string[];
}> => {
  const res = await api.generate.quickGenerate({
    birth_year: params.year,
    birth_month: params.month,
    birth_day: params.day,
    birth_hour: params.hour,
    is_lunar: false,
    sex: params.gender,
  });
  return res;
}

export { quickGenerate }