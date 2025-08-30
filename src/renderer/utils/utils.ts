export const formatILS = (n: number) =>
  n.toLocaleString("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
  });
