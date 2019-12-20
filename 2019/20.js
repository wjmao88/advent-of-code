
const _ = require('lodash');
const { createDistanceMap, findPathBetween } = require('./lib/maze');

const isMe = a => a === '@';
const isWall = a => a === '#';
const isSpace = a => a === '.';
const isWaypoint = a => !isWall(a) && !isSpace(a) && a.toLowerCase() === a;
const isBlocker = a => !isWall(a) && !isSpace(a) && !isMe(a) && a.toUpperCase() === a;

const splitMaze = (maze, wallX, wallY) => {
  return [
    maze.slice(0, wallY + 1).map(r => r.slice(0, wallX + 1)),
    maze.slice(0, wallY + 1).map(r => r.slice(wallX)),
    maze.slice(wallY).map(r => r.slice(0, wallX + 1)),
    maze.slice(wallY).map(r => r.slice(wallX)),
  ]
}

const checkHasPortal = (maze, x0, y0) => {
  const adjacent = [
    [ [x0, y0+1], [x0, y0+2], [x0, y0+3] ],
    [ [x0, y0-2], [x0, y0-1], [x0, y0-3] ],
    [ [x0+1, y0], [x0+2, y0], [x0+3, y0] ],
    [ [x0-2, y0], [x0-1, y0], [x0-3, y0] ],
  ];
  
  const portal = adjacent.filter(([ [x1, y1], [x2, y2] ]) => {
    if (!maze[y1] || !maze[y2] || !maze[y1][x1] || !maze[y2][x2]) {
      return false;
    }
    return (maze[y1][x1] + maze[y2][x2]).match(/[A-Z][A-Z]/);
  })[0];
  
  if (!portal) {
    return null;
  }

  const [ [x1, y1], [x2, y2], [ cx, cy ] ] = portal;
  if (maze[cy] && maze[cy][cx]) {
    return maze[y1][x1] + maze[y2][x2] + '-I';
  } else {
    return maze[y1][x1] + maze[y2][x2] + '-O';
  }
}

const preprocessMaze = (maze) => {
  const waypoints = _.mapValues(_.keyBy(
    _.flatMap(maze, (row, y) => {
      return row.map((tile, x) => {
        if (tile !== '.') {
          return [null];
        }
        const portal = checkHasPortal(maze, x, y);
        return [ portal, [x,y] ];
      });
    }).filter(([portal]) => !!portal), 
    ([p]) => p
  ), (([ _p, c ]) => c));

  const waypointBases = _.uniq(_.keys(waypoints).map(k => k.split('-')[0]))

  const toWaypointDistanceMaps = _.mapValues(waypoints, ([x,y]) => {
    return createDistanceMap(maze, x, y, t => t === '.');
  });

  const waypointPathMap = _.mapValues(waypoints, ([x,y], wp0) => {
    const notSelf = _.pickBy(waypoints, (_c, wp1) => wp1 !== wp0);
    return _.pickBy(
      _.mapValues(notSelf, (_c, wp1) => {
        const dMap = toWaypointDistanceMaps[wp1];
        return findPathBetween(dMap, x, y);
      }),
      (path) => !!path
    );
  });

  waypointBases.forEach(wp => {
    if (waypointPathMap[wp + '-I']) {
      waypointPathMap[wp + '-I'][wp + '-O'] = [[-1, -1]];
      waypointPathMap[wp + '-O'][wp + '-I'] = [[-1, -1]]
    }
  });

  return {
    waypoints: Object.keys(waypoints),
    waypointPathMap,
  };
};

const findShortestPath = (maze, useLevelChange) => {
  const {
    waypoints,
    waypointPathMap
  } =  preprocessMaze(maze);

  
  const levelChange = (wp0, wp1) => {
    if (!useLevelChange) {
      return 0;
    }
    const [ base0, type0 ] = wp0.split('-');
    const [ base1, type1 ] = wp1.split('-');
    if (base0 !== base1) {
      return 0;
    } else if (type0 === 'I') {
      return 1;
    } else {
      return -1;
    }
  };

  const pathLength = (positions) => {
    const wps = positions.map(pos => pos.split(':')[0]);
    return wps.slice(0,-1).reduce((total, from, index) => {
      const to = wps[index+1];
      if (
        to === 'DEAD_END' || 
        to === 'TOO_DEEP' || from === 'TOO_DEEP'
      ) {
        return Infinity;
      } else if (from === to) {
        return total;
      } else {
        const path = waypointPathMap[from][to];
        return total + path.length;
      }
    }, 0);
  };

  const cache = {};
  const cacheKey = (pos0, wpBefore) => {
    return pos0 + '+' + wpBefore.length;
  }

  const findShortestPath = (pos0, wpBefore, visited) => {
    visited[pos0] = true;
    if (cache[cacheKey(pos0, wpBefore)]) {
      return cache[cacheKey(pos0, wpBefore)];
    }

    const [ wp0, level ] = pos0.split(':');

    if (wp0 === 'ZZ-O' && +level === 0) {    
      return [pos0];
    }

    if (level < 0) {
      return ['DEAD_END:'];
    } else if (wpBefore.length > 250 || level > 45) {
      return ['TOO_DEEP:'];
    }
    
    const wpReachable = waypoints.filter((wp1) => {
      return waypointPathMap[wp0][wp1];
    }).filter(wp1 => {
      if (+level !== 0) {
        return wp1 !== 'ZZ-O' && wp1 !== 'AA-O';
      } else {
        return true;
      }
    }).map(wp1 => {
      const newLevel = +level + +levelChange(wp0, wp1);
      return wp1 + ':' + newLevel;
    }).filter(pos1 => {
      return !visited[pos1];
    });

    if (wpReachable.length === 0) {
      return ['DEAD_END:'];
    }
    
    const endingPaths = wpReachable.map((pos1) => {
      return findShortestPath(pos1, wpBefore.concat(pos0), {...visited});
    });

    const fullPaths = endingPaths.map(p => [pos0].concat(p));
    
    const result = _.minBy(fullPaths, pathLength);
    
    cache[cacheKey(pos0, wpBefore)] = result;
    return result;
  };

  const start = 'AA-O:0';
  const shortestPaths = findShortestPath(start, [], {});
  console.log('path', shortestPaths.join(','))

  return pathLength([start].concat(shortestPaths));
}

const runMaze1 = (mazeString, useLevelChange) => {
  const maze = mazeString.split('\n').map(r => r.split(''));
  const shortest = findShortestPath(maze, useLevelChange);
  console.log('whole shortest', shortest);
}

runMaze1(require('./inputs/20'), false);
runMaze1(require('./inputs/20'), true);