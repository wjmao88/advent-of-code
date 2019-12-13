
module.exports.fillSparse = function fillSparse(list) {
  return [...list.keys()].map(k => list[k]);
}

module.exports.flatten =function flatten(list) {
  return list.reduce((s,n) => s.concat(n), []);
}
