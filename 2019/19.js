
const _ = require('lodash');
const { runProgram, runControlledProgram } = require('./lib/intcode');

const scanBeam = (programInput, shouldStop, onEnd) => {
  const scanPosition = (x, y) => {
    const runner = runProgram(programInput, () => {});
    runner.next();    
    runner.next(x);
    const { value } = runner.next(y);
    return value;
  }

  let size0 = 0;
  const scanMap = [[1]];
  while (true) {
    if (shouldStop(scanMap)) {
      return onEnd(scanMap);
    }

    const size1 = size0 + 1;
    
    scanMap[size1] = [];

    const firstX = _.indexOf(scanMap[size0], 1) - 2;
    const lastX = _.lastIndexOf(scanMap[size0], 1);
    const firstY = _.indexOf(scanMap.map(r => r[lastX]), 1) - 2;

    if (size0 < 10 || size1 > firstY) {
      const y = size1;
      const start = size0 > 10? firstX : 0;
      let started = false;
      let ended = false;
      _.range(start, size1 + 1).forEach(x => {
        if (!started || !ended) {
          scanMap[y][x] = scanPosition(x, y);
          started = started || scanMap[y][x] === 1;
          ended = started && scanMap[y][x] === 0;
        } 
      });
    }
    
    if (size0 < 10 || size1 > firstX) {
      const x = size1;
      const start = size0 > 10? firstY : 0;
      _.range(start, size1 + 1).forEach(y => {
        scanMap[y][x] = scanPosition(x, y);
      });
    }

    size0 = size1;
  }
}

scanBeam(
  require('./inputs/19'),
  (scanMap) => {
    return scanMap.length >= 50;
  },
  (scanMap) => {
    console.log(scanMap.map(r => r.join('')).join('\n'))
    console.log(_.flatMap(scanMap).filter(t => t === 1).length)
  }
);

const squareSize = 100;

const { fillSparse } = require('./lib/utils');

const printSquareMap = (scanMap) => {
  const lowerLeftX = _.last(scanMap).indexOf(1);
  const lowerLeftY = scanMap.length - 1;
  const upperRightX = lowerLeftX + squareSize - 1;
  const upperRightY = lowerLeftY - squareSize + 1;

  if (lowerLeftX === -1 || lowerLeftY === -1) {
    return;
  }
  
  const scanMap2 = fillSparse(scanMap).map(r => fillSparse(r));
  
  _.range(lowerLeftX, upperRightX + 1).map(x => {
    _.range(lowerLeftY, upperRightY + 1).map(y => {
      scanMap2[y][x] = 9;
    });
  });
  
  const scanMap3 = scanMap2.map((r, ri) => [ri].concat(r.map(t => {
    return t === 0? '.' : t === 1? '#' : t === 9? 'O' : '?';
  })));

  console.log(scanMap3.map(r => r.join('')).join('\n'))
}

const start = new Date().valueOf();
scanBeam(
  require('./inputs/19'),
  (scanMap) => {
    if (scanMap.length < squareSize) {
      return false;
    }
    const lowerLeftX = _.last(scanMap).indexOf(1);
    const lowerLeftY = scanMap.length - 1;
    const upperRightX = lowerLeftX + squareSize - 1;
    const upperRightY = lowerLeftY - squareSize + 1;

    if (lowerLeftX === -1 || lowerLeftY === -1) {
      return false;
    }
    return (
      scanMap[upperRightY] && 
      scanMap[upperRightY][upperRightX] === 1
    );
  },
  (scanMap) => {
    const lowerLeftX = _.last(scanMap).indexOf(1);
    const lowerLeftY = scanMap.length - 1;
    const upperRightX = lowerLeftX + squareSize - 1;
    const upperRightY = lowerLeftY - squareSize + 1;

    printSquareMap(scanMap);
    console.log(lowerLeftX * 10000 + upperRightY);

    return lowerLeftX * 10000 + upperRightY;
  }
)

const end = new Date().valueOf();
console.log('time', (end - start)/1000)