
const _ = require('lodash');

const parseMapString = (s) => s.split('\n').map(r => r.split(''));

const countBugs = (map) => _.flatten(map).filter(a => a === '#').length;

const countAdjacentBugs = (bugMaps, level, x0, y0) => {
  const levelMap = bugMaps[level];
  return _.sum([
    [ x0, y0 + 1 ],
    [ x0, y0 - 1 ],
    [ x0 + 1, y0 ],
    [ x0 - 1, y0 ],
  ].map(([ x, y ]) => {
    const tile = levelMap[y] && levelMap[y][x];
    if (tile === '#') {
      return 1;
    } else if (tile === '.'){
      return 0;
    } else if (tile === '?') {
      const innerMap = bugMaps[+level + 1];
      if (!innerMap) {
        return 0;
      } else if (x0 === x && y0 > y) { //y0 is below
        return countBugs(innerMap[innerMap.length - 1]);
      } else if (x0 === x && y0 < y) { //y0 is above
        return countBugs(innerMap[0]);
      } else if (y0 === y && x0 > x) { //x0 is on the right
        return countBugs(innerMap.map(r => r[r.length - 1]));
      } else if (y0 === y && x0 < x) { //x0 is on the left
        return countBugs(innerMap.map(r => r[0]));
      }
    } else {
      const outerMap = bugMaps[+level - 1];
      if (!outerMap) {
        return 0;
      } else if (x < 0) {
        return outerMap[2][1] === '#'? 1 : 0;
      } else if (x > levelMap.length - 1) {
        return outerMap[2][3] === '#'? 1 : 0;
      } else if (y < 0) {
        return outerMap[1][2] === '#'? 1 : 0;
      } else if (y > levelMap.length - 1) {
        return outerMap[3][2] === '#'? 1 : 0;
      }
      return 0;
    }
  }));
}

const step = (bugMaps) => {
  return _.mapValues(bugMaps, (levelMap, level) => {
    return levelMap.map((row, y) => {
      return row.map((tile, x) => {
        const count = countAdjacentBugs(bugMaps, level, x, y);

        if (tile === '#' && count !== 1) {
          return '.';
        }
        if (tile === '.' && (count === 1 || count === 2)) {
          return '#';
        }
        return tile;
      });
    });
  });
};

const toMemoKey = (bugMaps) => {
  return JSON.stringify(
    _.pickBy(bugMaps, levelMap => {
      return countBugs(levelMap) > 0;
    })
  );
}

const blankMap = `.....
.....
..?..
.....
.....`;

const findFirstRepeat = (startingMap, rec) => {
  const memo = {};
  let currentMaps = { 0: startingMap };
  let min = 0;
  let max = 0;

  let count = 0;
  while(count < 200 || !rec) {
    count += 1;
    memo[toMemoKey(currentMaps)] = true;

    if (rec && countBugs(currentMaps[min])) {
      min -= 1;
      currentMaps[min] = parseMapString(blankMap);
    }

    if (rec && countBugs(currentMaps[max])) {
      max += 1;
      currentMaps[max] = parseMapString(blankMap);
    }

    currentMaps = step(currentMaps);

    if (!rec && memo[toMemoKey(currentMaps)]) {
      console.log(count, memo);
      return currentMaps;
    }
  }

  return currentMaps;
};

const calculateBioD = (bugMap) => {
  return _.sum(_.flatten(bugMap).map((tile, index) => {
    if (tile === '#') {
      return Math.pow(2, index);
    } else {
      return 0;
    }
  }));
};

const calculateNumBugs = (bugMaps) => {
  return _.flatMap(bugMaps, levelMap => _.flatten(levelMap))
    .filter(t => t === '#').length;
};

const runSimulation1 = (bugMap) => {
  const repeatedMaps = findFirstRepeat(bugMap);
  // console.log(repeatedMaps[0].map(r => r.join('')).join('\n'));
  console.log(calculateBioD(repeatedMaps[0]));
};

const runSimulation2 = (bugMap) => {
  const repeatedMaps = findFirstRepeat(bugMap, true);
  // _.forEach(repeatedMaps, (rm, l) => {
  //   console.log('level', l);
  //   console.log(
  //     rm.map(r => r.join('')).join('\n')
  //   );
  //   console.log('');
  // })
  console.log(calculateNumBugs(repeatedMaps));
};

runSimulation1(parseMapString(`.##.#
###..
#...#
##.#.
.###.`));

runSimulation2(parseMapString(`.##.#
###..
#.?.#
##.#.
.###.`));