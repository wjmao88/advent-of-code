
function gcd(a,b) {
  if (a === b) {
    return a;
  } else if (a === 0) {
    return b;
  } else if (b === 0) {
    return a;
  } else if (a > b) {
    return gcd(a - b, b);
  } else {
    return gcd(a, b - a);
  }
}

function range(n) {
  return [...new Array(n).keys()];
}

function getIntersections([ x0, y0 ], [ x1, y1 ]) {
  const xSlope = x1 - x0;
  const ySlope = y1 - y0;
  const steps = gcd(Math.abs(xSlope), Math.abs(ySlope));
  const xStepSize = xSlope/steps;
  const yStepSize = ySlope/steps;
  
  return range(steps).map(n => [    
    x0 + (n + 1) * xStepSize,
    y0 + (n + 1) * yStepSize,
  ]);
}

function canSeeFromTo(asteroidsMap, from, to) {
  const intersections = getIntersections(from, to); 
  return intersections.slice(0, -1).filter(([x, y]) => {
    return asteroidsMap[y][x] === '#';
  }).length === 0;
}

function countViews(asteroidsMap, [ x0, y0 ]) {
  return asteroidsMap.reduce((acc, row, y) => {
    return row.reduce((sum, symbol, x) => {
      if (x0 === x && y0 === y) {
        return sum;
      } else if (symbol === '#' && canSeeFromTo(asteroidsMap, [x0,y0], [x,y])) {
        return sum + 1;
      } else{
        return sum;
      }
    }, acc);
  }, 0);
}

function toAsteroidsMap(text) {
  return text.split('\n').map(row => row.split(''));
}

function getVisibilityMap(asteroidsMap) {
  return asteroidsMap.map((row, y) => {
    return row.map((symbol, x) => {
      if (symbol === '#') {
        return countViews(asteroidsMap, [x, y]);
      } else{
        return 0;
      }
    });
  });
}

function findBestStation(text) {
  const asteroidsMap = toAsteroidsMap(text);
  const visibilityMap = getVisibilityMap(asteroidsMap);
  return visibilityMap.reduce((acc, row, y) => {
    return row.reduce(([bestViews, bestX, bestY], views, x) => {
      if (bestViews < views) {
        return [ views, x, y ];
      } else {
        return [bestViews, bestX, bestY];
      }
    }, acc);
  }, [0,0,0]);
}
