const _ = require('lodash');

module.exports.createDistanceMap = (tileMap, x0, y0, canPassThrough = t => t !== '#') => {
  const distMap = { [y0]: { [x0]: 0 }};
  let bfs = [ [+x0, +y0, 0] ];
  while (bfs.length) {
    const [ x, y, dist ] = bfs.shift();
    const newChecks = [
      [x, y+1, dist+1],
      [x, y-1, dist+1],
      [x-1, y, dist+1],
      [x+1, y, dist+1],
    ].filter(([x,y]) => {
      const tile = tileMap[y][x];
      return (
        !distMap[y] || distMap[y][x] === void 0
      ) && (
        canPassThrough(tile)
      );
    })
    newChecks.forEach(([x,y,d]) => {
      distMap[y] = distMap[y] || {};
      distMap[y][x] = d;
    });
    bfs = bfs.concat(newChecks);
  }
  return distMap;
};

const leastAdjacent = (distanceMap, x0, y0) => {
  const adjacent = [
    [x0, y0+1],
    [x0, y0-1],
    [x0+1, y0],
    [x0-1, y0],
  ];
  const validAdjacent = adjacent.filter(([x, y]) => {
    return distanceMap[y] && distanceMap[y][x] !== void 0;
  });
  return _.minBy(validAdjacent, ([ x, y ]) => distanceMap[y][x]);
}

module.exports.findPathBetween = (distanceMap, x0, y0) => {
  if (!distanceMap[y0] || !distanceMap[y0][x0]) {
    return null;
  }
  let [ x, y ] = [ x0, y0 ];
  const path = [];
  while (distanceMap[y][x] !== 0) {
    [ x, y ] = leastAdjacent(distanceMap, x, y);
    path.push([x,y]);
  }
  return path;
};
