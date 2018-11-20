function distinctByKey(key) {
  let valueSet = new Set();
  return (item) => !valueSet.has(item[key])
    && valueSet.add(item[key]);
}

function sortByKey() {
  // sort priority
  let keys = ["name", "type", "defaultValue", "isRequired"];
  return (o1, o2) => {
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value1 = o1[key] || "";
      let value2 = o2[key] || "";
      if (value1 !== value2) {
        if (key === "type" || key === "isRequired") {
          return value1 < value2 ? 1 : -1;
        } else {
          return value1 > value2 ? 1 : -1;
        }
      }
    }
    return 0;
  };
}

exports.distinctByKey = distinctByKey;
exports.sortByKey = sortByKey;