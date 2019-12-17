const { 
  sum, 
  flatMap, 
  findIndex,
  every,
  trim
} = require('lodash');
const { runProgram, runControlledProgram } = require('./lib/intcode');

const LEFT = '<';
const RIGHT = '>';
const UP = '^';
const DOWN = 'v';

const createMap = (programInput) => {
  const runner = runProgram(programInput);
  let tileMap = '';
  while (true) {
    const { value, done } = runner.next();
    if (value) {
      tileMap += String.fromCharCode(value);
    }
    if (done) {
      return tileMap;
    }
  }
}

const numConnections = (tileMap, x, y) => {
  const connectionStatus = [
    tileMap[y+1] && tileMap[y+1][x] === '#',
    tileMap[y-1] && tileMap[y-1][x] === '#',
    tileMap[y][x+1] === '#',
    tileMap[y][x-1] === '#',
  ];
  return connectionStatus.filter(a => a).length;
}

const isIntersection = (tileMap, x, y) => {
  return numConnections(tileMap, x, y) === 4;
};

const isTerminal = (tileMap, x, y) => {
  return numConnections(tileMap, x, y) === 1;
};

const calibrate = (tileMapArr) => {
  return sum(flatMap(tileMapArr, (row, y) => {
    return row.map((_tile, x) => {
      return isIntersection(tileMapArr, x, y)? x * y : 0;
    })
  }));
};

const isBot = (t) => [LEFT, RIGHT, DOWN, UP].indexOf(t)!== -1;

const turnDiff = (from, to) => {
  return ({
    [UP]: { [LEFT]: 'L', [RIGHT]: 'R' },
    [DOWN]: { [RIGHT]: 'L', [LEFT]: 'R'},
    [LEFT]: { [DOWN]: 'L', [UP]: 'R'},
    [RIGHT]: { [UP]: 'L', [DOWN]: 'R'},
  })[from][to];
};

const calculateTurn = (tileMapArr, x, y, bot) => {
  if (tileMapArr[y+1] && tileMapArr[y+1][x] === '#' && bot !== UP) {
    return [DOWN, turnDiff(bot, DOWN)];
  } 
  if (tileMapArr[y-1] && tileMapArr[y-1][x] === '#' && bot !== DOWN) {
    return [UP, turnDiff(bot, UP)];
  } 
  if (tileMapArr[y][x+1] === '#' && bot !== LEFT) {
    return [RIGHT, turnDiff(bot, RIGHT)];
  } 
  if (tileMapArr[y][x-1] === '#' && bot !== RIGHT) {
    return [LEFT, turnDiff(bot, LEFT)];
  } 
}

const calculateDestination = (tileMapArr, x, y, bot) => {
  const step = (x, y) => {
    switch(bot) {
      case '^': return [x,y-1];
      case 'v': return [x,y+1];
      case '<': return [x-1,y];
      case '>': return [x+1,y];
    }
  }

  let x0 = x;
  let y0 = y;
  let steps = 0;
  while (true) {
    const [x1,y1] = step(x0,y0);
    if (!tileMapArr[y1] || tileMapArr[y1][x1] !== '#') {
      return [x0,y0,steps];
    }
    x0 = x1;
    y0 = y1;
    steps += 1;
  }
}

const calculateMovementSequence = (tileMapArr) => {
  let y = findIndex(tileMapArr, row => findIndex(row, isBot) !== -1);
  let x = findIndex(tileMapArr[y], isBot);
  let bot = tileMapArr[y][x];
  let steps, turn;

  let terminalReached = false;
  const instructions = [];

  let counter = 0;
  while(!terminalReached && counter < 100) {
    [ bot, turn ] = calculateTurn(tileMapArr, x, y, bot);
    [ x, y, steps ] = calculateDestination(tileMapArr, x, y, bot);
    instructions.push(`${turn}${steps}`);
    terminalReached = isTerminal(tileMapArr, x, y);
    counter += 1;
  }
  return instructions;
};

const removeLeadingDividers = (seq, dividers) => {
  let curSeq = seq;
  let changed = true;
  while(changed) {
    changed = false;
    dividers.forEach((divider) => {
      if (curSeq.slice(0, divider.length).join(',') === divider.join(',')) {
        curSeq = curSeq.slice(divider.length);
        changed = true;
      }
    });
  }
  return curSeq;
};

const orderChars = 'ABCDFGH';
const getFunctionOrder = (seq, dividers) => {
  const order = [];
  let curSeq = seq.slice();
  while(curSeq.length > 0) {
    dividers.forEach((divider, dividerIndex) => {
      if (curSeq.slice(0, divider.length).join(',') === divider.join(',')) {
        curSeq = curSeq.slice(divider.length);
        order.push(orderChars[dividerIndex]);
      }
    });
  }
  return order;
};

const groupMoveSequence = (moveSeq, dividers, maxGroups) => {
  if (maxGroups === 0) {
    return false;
  }
  let groupEnd = 1;
  while (groupEnd < moveSeq.length && groupEnd <= 10) {
    let divider = moveSeq.slice(0,groupEnd);
    const allDividers = dividers.concat([divider]);
    const nextSeq = removeLeadingDividers(moveSeq, allDividers);
    if (nextSeq.length === 0) {
      return allDividers;
    }
    const result = groupMoveSequence(nextSeq, allDividers, maxGroups - 1);
    if (result) {
      return result;
    }
    groupEnd += 1;
  }
  return false;
}

const createInputSequence = (order, sequences) => {
  const orderCharArr = order.join(',');
  
  const seqCharArrs = sequences.map(seq => {
    return seq.map((inst) => `${inst[0]},${inst.slice(1)}`).join(',')
  });

  return [orderCharArr].concat(seqCharArrs).join('\n') + '\nn\n';
}

const robotMovement = (programInput, inputChars) => {
  let output = [];
  const input = inputChars.split('');

  runControlledProgram(
    [2].concat(programInput.slice(1)),
    () => {
      return input.shift().charCodeAt(0);
    },
    (val) => {
      output.push(val);
    }
  )
  return output;
};

const runRobot = (programInput) => {
  const tileMapS = createMap(programInput);
  const tileMapArr = tileMapS.split('\n').map(r => r.split(''));
  
  console.log(calibrate(tileMapArr));
  
  const moveSequence = calculateMovementSequence(tileMapArr);
  const sequences = groupMoveSequence(moveSequence, [], 3);
  const order = getFunctionOrder(moveSequence, sequences)
  const inputChars = createInputSequence(order, sequences)
  const moveResult = robotMovement(programInput, inputChars);
  console.log(tileMapS);
  console.log(moveSequence.join(','));
  console.log(inputChars)
  console.log(moveResult.slice(-3));
}

const programInput = [1,330,331,332,109,3080,1101,0,1182,15,1101,0,1403,24,1001,0,0,570,1006,570,36,1002,571,1,0,1001,570,-1,570,1001,24,1,24,1105,1,18,1008,571,0,571,1001,15,1,15,1008,15,1403,570,1006,570,14,21101,58,0,0,1105,1,786,1006,332,62,99,21102,333,1,1,21101,0,73,0,1105,1,579,1102,0,1,572,1101,0,0,573,3,574,101,1,573,573,1007,574,65,570,1005,570,151,107,67,574,570,1005,570,151,1001,574,-64,574,1002,574,-1,574,1001,572,1,572,1007,572,11,570,1006,570,165,101,1182,572,127,101,0,574,0,3,574,101,1,573,573,1008,574,10,570,1005,570,189,1008,574,44,570,1006,570,158,1106,0,81,21102,1,340,1,1105,1,177,21102,477,1,1,1105,1,177,21102,1,514,1,21102,1,176,0,1106,0,579,99,21101,184,0,0,1105,1,579,4,574,104,10,99,1007,573,22,570,1006,570,165,1002,572,1,1182,21101,0,375,1,21102,211,1,0,1105,1,579,21101,1182,11,1,21102,1,222,0,1106,0,979,21101,0,388,1,21102,233,1,0,1105,1,579,21101,1182,22,1,21101,244,0,0,1105,1,979,21101,0,401,1,21101,255,0,0,1106,0,579,21101,1182,33,1,21101,266,0,0,1106,0,979,21101,0,414,1,21102,1,277,0,1105,1,579,3,575,1008,575,89,570,1008,575,121,575,1,575,570,575,3,574,1008,574,10,570,1006,570,291,104,10,21101,1182,0,1,21101,313,0,0,1105,1,622,1005,575,327,1101,1,0,575,21101,327,0,0,1106,0,786,4,438,99,0,1,1,6,77,97,105,110,58,10,33,10,69,120,112,101,99,116,101,100,32,102,117,110,99,116,105,111,110,32,110,97,109,101,32,98,117,116,32,103,111,116,58,32,0,12,70,117,110,99,116,105,111,110,32,65,58,10,12,70,117,110,99,116,105,111,110,32,66,58,10,12,70,117,110,99,116,105,111,110,32,67,58,10,23,67,111,110,116,105,110,117,111,117,115,32,118,105,100,101,111,32,102,101,101,100,63,10,0,37,10,69,120,112,101,99,116,101,100,32,82,44,32,76,44,32,111,114,32,100,105,115,116,97,110,99,101,32,98,117,116,32,103,111,116,58,32,36,10,69,120,112,101,99,116,101,100,32,99,111,109,109,97,32,111,114,32,110,101,119,108,105,110,101,32,98,117,116,32,103,111,116,58,32,43,10,68,101,102,105,110,105,116,105,111,110,115,32,109,97,121,32,98,101,32,97,116,32,109,111,115,116,32,50,48,32,99,104,97,114,97,99,116,101,114,115,33,10,94,62,118,60,0,1,0,-1,-1,0,1,0,0,0,0,0,0,1,20,26,0,109,4,1202,-3,1,587,20102,1,0,-1,22101,1,-3,-3,21101,0,0,-2,2208,-2,-1,570,1005,570,617,2201,-3,-2,609,4,0,21201,-2,1,-2,1106,0,597,109,-4,2106,0,0,109,5,1202,-4,1,630,20101,0,0,-2,22101,1,-4,-4,21102,0,1,-3,2208,-3,-2,570,1005,570,781,2201,-4,-3,653,20102,1,0,-1,1208,-1,-4,570,1005,570,709,1208,-1,-5,570,1005,570,734,1207,-1,0,570,1005,570,759,1206,-1,774,1001,578,562,684,1,0,576,576,1001,578,566,692,1,0,577,577,21101,0,702,0,1105,1,786,21201,-1,-1,-1,1106,0,676,1001,578,1,578,1008,578,4,570,1006,570,724,1001,578,-4,578,21102,1,731,0,1106,0,786,1105,1,774,1001,578,-1,578,1008,578,-1,570,1006,570,749,1001,578,4,578,21101,756,0,0,1105,1,786,1106,0,774,21202,-1,-11,1,22101,1182,1,1,21101,774,0,0,1105,1,622,21201,-3,1,-3,1106,0,640,109,-5,2105,1,0,109,7,1005,575,802,20101,0,576,-6,21002,577,1,-5,1106,0,814,21102,0,1,-1,21101,0,0,-5,21101,0,0,-6,20208,-6,576,-2,208,-5,577,570,22002,570,-2,-2,21202,-5,43,-3,22201,-6,-3,-3,22101,1403,-3,-3,2102,1,-3,843,1005,0,863,21202,-2,42,-4,22101,46,-4,-4,1206,-2,924,21101,0,1,-1,1106,0,924,1205,-2,873,21101,35,0,-4,1106,0,924,1201,-3,0,878,1008,0,1,570,1006,570,916,1001,374,1,374,1201,-3,0,895,1101,2,0,0,1201,-3,0,902,1001,438,0,438,2202,-6,-5,570,1,570,374,570,1,570,438,438,1001,578,558,922,20102,1,0,-4,1006,575,959,204,-4,22101,1,-6,-6,1208,-6,43,570,1006,570,814,104,10,22101,1,-5,-5,1208,-5,39,570,1006,570,810,104,10,1206,-1,974,99,1206,-1,974,1101,0,1,575,21101,0,973,0,1105,1,786,99,109,-7,2105,1,0,109,6,21101,0,0,-4,21101,0,0,-3,203,-2,22101,1,-3,-3,21208,-2,82,-1,1205,-1,1030,21208,-2,76,-1,1205,-1,1037,21207,-2,48,-1,1205,-1,1124,22107,57,-2,-1,1205,-1,1124,21201,-2,-48,-2,1106,0,1041,21102,1,-4,-2,1106,0,1041,21102,1,-5,-2,21201,-4,1,-4,21207,-4,11,-1,1206,-1,1138,2201,-5,-4,1059,1201,-2,0,0,203,-2,22101,1,-3,-3,21207,-2,48,-1,1205,-1,1107,22107,57,-2,-1,1205,-1,1107,21201,-2,-48,-2,2201,-5,-4,1090,20102,10,0,-1,22201,-2,-1,-2,2201,-5,-4,1103,2101,0,-2,0,1106,0,1060,21208,-2,10,-1,1205,-1,1162,21208,-2,44,-1,1206,-1,1131,1105,1,989,21101,0,439,1,1106,0,1150,21102,1,477,1,1106,0,1150,21101,514,0,1,21101,1149,0,0,1106,0,579,99,21101,1157,0,0,1105,1,579,204,-2,104,10,99,21207,-3,22,-1,1206,-1,1138,1201,-5,0,1176,2101,0,-4,0,109,-6,2105,1,0,28,5,38,1,3,1,38,1,3,1,38,1,3,1,38,1,3,1,38,1,3,1,34,9,34,1,3,1,38,1,3,1,38,1,3,1,34,9,34,1,3,1,38,1,3,1,38,1,3,1,34,5,3,5,30,1,11,1,30,1,11,1,30,1,11,1,22,9,11,5,18,1,23,1,18,1,23,1,18,1,23,1,10,7,1,1,19,9,6,1,5,1,1,1,19,1,3,1,3,1,6,1,5,1,1,5,15,1,3,1,3,1,6,1,5,1,5,1,15,1,3,1,3,1,6,11,1,1,1,7,3,5,3,11,6,1,3,1,1,1,1,1,9,1,11,1,5,1,6,1,1,9,7,1,11,1,5,1,6,1,1,1,1,1,1,1,1,1,9,1,11,1,5,1,6,9,1,9,11,7,8,1,1,1,1,1,3,1,30,9,3,1,30,1,3,1,1,1,5,1,30,1,3,1,1,7,30,1,3,1,38,1,3,1,38,1,3,1,38,5,34];

runRobot(programInput);