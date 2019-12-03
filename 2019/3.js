
function steps(n) {
  return [ ...new Array(n).keys() ].map(n => n + 1);
}

function instructionMath(current, instruction){
  const direction = instruction[0];
  const length = +instruction.slice(1);
  switch(direction) {
    case 'U': return steps(length).map(y => [ current[0], current[1] + y ]);
    case 'D': return steps(length).map(y => [ current[0], current[1] - y ]);
    case 'L': return steps(length).map(x => [ current[0] - x, current[1] ]);
    case 'R': return steps(length).map(x => [ current[0] + x, current[1] ]);
    default: throw 'invalid direction ' + direction
  }
}

function getCoords(instructions) {
  let current = [0,0];
  return instructions.flatMap(instruction => {
    coords = instructionMath(current, instruction);
    current = coords[coords.length - 1];
    return coords;
  });
}

function coordsToMap(coords) {
  let steps = 0
  return coords.reduce((acc, [ x, y ]) => {
    steps += 1;
    acc[x] = acc[x] || {};
    acc[x][y] = steps;
    return acc;
  }, {})
}

function getIntersectionsMap(map1, map2) {
  const intersections = [];
  for (let x in map1) {
    if (map2[x]) {
      for (let y in map1[x]) {
        if (map2[x][y]) {
          intersections.push([ x, y, map1[x][y] + map2[x][y] ]);
        }
      }
    }
  }
  return intersections;
}

function distanceToOrigin(coord) {
  return Math.abs(coord[0]) + Math.abs(coord[1]);
}

function getClosestToOrigin(coords) {
  return coords.reduce((closest, coord) => {
    if (distanceToOrigin(closest) > distanceToOrigin(coord)) {
      return coord;
    } else {
      return closest;
    }
  }, [Infinity, Infinity])
}

function getLeastStepsToOrigin(coords) {
  return coords.reduce((closest, coord) => {
    if (closest[2] > coord[2]) {
      return coord;
    } else {
      return closest;
    }
  }, [Infinity, Infinity, Infinity])
}


function parse(s) {
  return s.split('\n').slice(0,2).map(s => s.split(','))
}

function getAnswer(s) {
  const [ coords1, coords2 ] = parse(s).map(getCoords).map(coordsToMap);
  const inters = getIntersectionsMap(coords1, coords2);
  return {
    dist: getClosestToOrigin(inters),
    steps: getLeastStepsToOrigin(inters, coords1, coords2),
  };
}