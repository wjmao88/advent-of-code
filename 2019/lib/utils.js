const { map } = require('lodash');

module.exports.fillSparse = fillSparse;
function fillSparse(list) {
  return [...list.keys()].map(k => list[k]);
}

module.exports.mapToArrays = mapToArrays;
function mapToArrays(tileMap) {
  const yOffset = -Math.min(...Object.keys(tileMap).map(n => +n));
  const xOffset = -Math.min(
    ...map(tileMap, (row) => {
      return Math.min(...Object.keys(row).map(n => +n))
    })
  );

  const tileArrays = [];
  for (y in tileMap) {
    for (x in tileMap[y]) {
      tileArrays[+y + yOffset] = tileArrays[+y + yOffset] || [];
      tileArrays[+y + yOffset][+x + xOffset] = tileMap[y][x];
    }
  }

  return {
    tileArrays: fillSparse(tileArrays).map((row) => fillSparse(row || [])),
    xOffset,
    yOffset,
  };
}

module.exports.flatten = function flatten(list) {
  return list.reduce((s,n) => s.concat(n), []);
}

module.exports.printMap = function printMap(tileMap, printTile) {
  const { tileArrays, xOffset, yOffset, } = mapToArrays(tileMap);
  return tileArrays.map((row, y) => {
    return row.map((t, x) => printTile(t, +x - xOffset, +y - yOffset)).join('');
  }).join('\n');
}