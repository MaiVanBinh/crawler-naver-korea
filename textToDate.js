exports.textToDate = (text) => {
  if (!text) return;
  let dateTime = "";
  const arr = text.split(" ");
  const date = arr[0].replace(/\./gi, "-").slice(0, -1);
  const time = arr[2]
    .split(":")
    .map((e, i) => {
      if (arr[1] == "오후" && i === 0) {
        return parseInt(e) + 12;
      }
      return e;
    })
    .join(":");
  dateTime = date + "T" + time;
  return dateTime;
};
