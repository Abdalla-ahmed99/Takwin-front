import { useSelector } from 'react-redux';
import { t as translate } from '../i18n/translations';

export const useLanguage = () => {
  const lang = useSelector((state) => state.language.language);
  const rtl = lang === 'ar';
  const t = (key) => translate(lang, key);
  return { lang, rtl, t };
};
