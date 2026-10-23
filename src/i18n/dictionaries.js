import kkCommon from './locales/kk/common.json';
import ruCommon from './locales/ru/common.json';
import enCommon from './locales/en/common.json';

// dictionaries[locale][namespace] -> nested strings, read by createTranslator as 'namespace.some.key'.
export const dictionaries = {
  kk: { common: kkCommon },
  ru: { common: ruCommon },
  en: { common: enCommon },
};
