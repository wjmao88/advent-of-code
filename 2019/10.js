
function groupBy(list, getKey) {
  return list.reduce((acc, n) => {
    const k = getKey(n);
    acc[k] = acc[k] || [];
    acc[k].push(n);
    return acc;
  }, {});
}

function toAsteroidsMap(text) {
  return text.split('\n').map(row => row.split(''));
}

function getAsteroids(asteroidsMap){
  return asteroidsMap.map((row, y) => {
    return row.map((symbol, x) => {
      return symbol === '#'? [x,y] : null;
    })
  }).flatMap(row => row.filter(n => !!n));
}

function getOtherAsteroids(asteroidsMap, [x0, y0]) {
  return getAsteroids(asteroidsMap).filter(([x,y]) => x0 !== x || y0 !== y);
}

function cartesianToPolar([x,y]) {
  const radius = Math.sqrt(x*x + y*y);
  const angle = Math.atan2(y, x);
  return [angle, radius, [x,y]];
}

function offsetAndRotate(x0, y0) {
  return ([x,y]) => {
    const xOffset = x - x0;
    const yOffset = y - y0;
    return [ yOffset, -xOffset ];
  }
}

function unOffsetAndRotate(x0, y0) {
  return ([ yOffset, xOffset ]) => {
    const x = -xOffset + x0;
    const y = yOffset + y0;
    return [x,y];
  }
}

function getAsteroidsByAngle(asteroidsMap, [ x0, y0 ]) {
  const coords = getOtherAsteroids(asteroidsMap, [ x0, y0 ]);
  const offsetAndRotatedCoords = coords.map(offsetAndRotate(x0, y0));
  const undo = unOffsetAndRotate(x0, y0);
  const polarCoords = offsetAndRotatedCoords.map(cartesianToPolar)
    .map(([ a, r, cart ]) => [ a, r, undo(cart) ]);
  return groupBy(polarCoords, polar => polar[0]);
}

function getViews(asteroidsMap) {
  const asteroids = getAsteroids(asteroidsMap);
  return asteroids.map(([x,y]) => {
    return [
      Object.keys(getAsteroidsByAngle(asteroidsMap, [ x, y ])).length,
      x,
      y
    ];
  });
}

function findBestStation(text) {
  const asteroidsMap = toAsteroidsMap(text);
  const viewsList = getViews(asteroidsMap);
  return viewsList.reduce(([bestViews, bestX, bestY], [ views, x, y ]) => {
    if (bestViews < views) {
      return [ views, x, y ];
    } else {
      return [bestViews, bestX, bestY];
    }
  }, [0,0,0]);
}

function getOrderedPolarCoords(asteroidsMap, [ x0, y0 ]) {
  const asteroidsByAngle = getAsteroidsByAngle(asteroidsMap, [ x0, y0 ]);

  const angleOrders = Object.keys(asteroidsByAngle).map(n => +n);
  angleOrders.sort((a,b) => a - b);
  if (angleOrders[angleOrders.length - 1] === Math.PI) {
    angleOrders.unshift(angleOrders.pop());
  }

  const orderedPolarByAngle = angleOrders.map((angle) => {
    const coords = asteroidsByAngle[angle];
    coords.sort((c1, c2) => c1[1] - c2[1]);
    return coords;
  });

  let orderedCoords = [];
  let polarByAngleLeft = orderedPolarByAngle.slice();
  while (polarByAngleLeft.length > 0) {
    orderedCoords = orderedCoords.concat(
      polarByAngleLeft.map(polars => polars[0])
    );
    polarByAngleLeft = polarByAngleLeft
      .map(polars => polars.slice(1))
      .filter(polars => polars.length > 0);
  }
  return orderedCoords;
}

function getVaoprizedOrder(text, print) {
  const asteroidsMap = toAsteroidsMap(text);
  const [ _, x0, y0 ] = findBestStation(text);
  const orderedPolarCoords = getOrderedPolarCoords(asteroidsMap, [x0,y0]);

  if (print) {
    printToDom(asteroidsMap, orderedPolarCoords);
  }

  return orderedPolarCoords[199][2];
}

function printToDom(asteroidsMap, orderedPolarCoords) {
  const div = $('div')? $('div') : (() => {
    document.body.append(document.createElement('div'));
    return $('div');
  })();
  
  const orderMap = orderedPolarCoords.reduce((aMap, [ a, r, [ x, y ]], index) => {
    aMap[y] = aMap[y] || [];
    aMap[y][x] = index.toString().padStart(3, '_');
    return aMap;
  }, []);
 
  div.innerHTML = asteroidsMap.map((row, y) => row.map((s, x) => {
    if (x0 === x && y0 === y) {
      return ' X ';
    }
    return orderMap[y] && orderMap[y][x]? orderMap[y][x] : "___";
  })).map(row => row.join('|')).join('<br/>');
}