
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

const preprocessMaze = (maze) => {
  const waypoints = _.fromPairs(
    _.flatMap(maze, (row, y) => {
      return row.map((tile, x) => [ tile, [x,y] ]);
    }).filter(([tile]) => isWaypoint(tile))
  );

  const toWaypointDistanceMaps = _.mapValues(waypoints, ([x,y]) => {
    return createDistanceMap(maze, x, y);
  });

  const waypointPathMap = _.mapValues(waypoints, ([x,y], wp0) => {
    const notSelf = _.pickBy(waypoints, (_c, wp1) => wp1 !== wp0);
    return _.mapValues(notSelf, (_c, wp1) => {
      const dMap = toWaypointDistanceMaps[wp1];
      return findPathBetween(dMap, x, y);
    });
  });
  
  const waypointBlockerMap = _.mapValues(waypointPathMap, (pMap) => {
    return _.mapValues(pMap, (path) => {
      return path.map(([x,y]) => maze[y][x]).filter(isBlocker);
    });
  });

  return {
    waypoints: Object.keys(waypoints),
    waypointPathMap,
    waypointBlockerMap,
  };
};

const findShortestPath = (mazes) => {
  const mazeConfigs = mazes.map(preprocessMaze);
  const waypoints = _.uniq(
    mazeConfigs.map(c => c.waypoints).reduce((acc, wps) => acc.concat(wps), [])
  );

  const pathLength = (wps, index) => {
    const waypointPathMap = mazeConfigs[index].waypointPathMap;

    return wps.slice(0,-1).reduce((total, from, index) => {
      const to = wps[index+1];
      if (from === to) {
        return total;
      } else {
        const path = waypointPathMap[from][to];
        return total + path.length;
      }
    }, 0);
  };
  
  const positionPathLength = (positionPath) => {
    return _.sum(mazes.map((_m, index) => {
      const path = positionPath.map(position => position[index]);
      return pathLength(path, index)
    }));
  };

  const cache = {};
  const cacheKey = (wps, waypointsLeft) => {
    return wps.join('-') + '-' + _.orderBy(waypointsLeft).join(',');
  }

  const findShortestPath = (position0, waypointsLeft, posSoFar) => {
    if (cache[cacheKey(position0, waypointsLeft)]) {
      return cache[cacheKey(position0, waypointsLeft)];
    }
    
    const positionsReachable = mazeConfigs.map(({
      waypointPathMap,
      waypointBlockerMap,
    }, mazeIndex) => {
      const wp0 = position0[mazeIndex];
      return waypointsLeft
        .filter((wp1) => {
          return waypointPathMap[wp0][wp1];
        })
        .filter((wp1) => {
          const blockers = waypointBlockerMap[wp0][wp1];
          return blockers.length === 0 ||
            _.every(blockers, b => waypointsLeft.indexOf(b.toLowerCase()) === -1);
        });
    });

    const endingPositionPaths = _.flatMap(positionsReachable, (wpReachables, mazeIndex) => {
      return wpReachables.map((wp1) => {
        const position1 = position0.slice();
        position1[mazeIndex] = wp1;
        const waypointsStillLeft = _.without(waypointsLeft, wp1);
        if (waypointsStillLeft.length === 0) {
          return [position1];
        } else {
          const ending = findShortestPath(position1, waypointsStillLeft, posSoFar.concat([ position1 ]));
          return [position1].concat(ending);
        }
      });
    });

    const fullPositionPaths = endingPositionPaths.map(p => [position0].concat(p));
    
    const result = _.minBy(fullPositionPaths, positionPathLength).slice(1);
    
    cache[cacheKey(position0, waypointsLeft)] = result;
    
    return result;
  };

  const start = _.range(mazes.length).map(() => '@');
  const shortestPositionPath = findShortestPath(start, _.without(waypoints, '@'), start);
  console.log(shortestPositionPath)

  return positionPathLength([start].concat(shortestPositionPath));
}

const runMaze1 = (mazeString) => {
  const maze = mazeString.split('\n').map(r => r.split(''));
  const shortest = findShortestPath([maze]);
  console.log('whole shortest', shortest);
}

const runMaze2 = (mazeString) => {
  const maze = mazeString.split('\n').map(r => r.split(''));
  const mazes = splitMaze(maze, Math.floor(maze[0].length/2), Math.floor(maze.length/2));
  const shortest = findShortestPath(mazes);
  console.log('split shortest', shortest);
}

runMaze1(require('./inputs/18-1'));
runMaze2(require('./inputs/18-2'))
