const pad = (value) => String(value).padStart(2, '0');

export const formatLocalDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getCurrentDate = () => formatLocalDate(new Date());

export const getCurrentMonth = () => getCurrentDate().slice(0, 7);

export const getMonthsAgoDate = (months = 1) => {
  const today = new Date();
  const targetMonth = today.getMonth() - months;
  const start = new Date(today.getFullYear(), targetMonth, 1);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

  start.setDate(Math.min(today.getDate(), lastDay));
  return formatLocalDate(start);
};

export const getDefaultDateRange = () => ({
  startDate: getMonthsAgoDate(1),
  endDate: getCurrentDate(),
});
