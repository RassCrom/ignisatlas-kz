export const getLocalizedValue = (item, field, language) => {
  if (!item) return "";

  return (
    item[`${field}_${language}`] ??
    item[field] ??
    item[`${field}_en`] ??
    item.label ??
    item.label_ru ??
    ""
  );
};
