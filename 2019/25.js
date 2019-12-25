const _ = require('lodash');
const { runAsciiProgram } = require('./lib/intcode');
const programInput = require('./inputs/25');

const opposite = (dir) => {
  switch(dir) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
    default: throw 'dir ' + dir;
  }
}

const rewindSteps = (steps) => {
  const rewind = steps.map(opposite);
  rewind.reverse();
  return rewind;
}

const DOORS_LINE = 'Doors here lead:';
const ITEMS_LINE = 'Items here:'
const SECURITY_ROOM = '== Security Checkpoint ==';

const shouldPickupItem = (item) => {
  return [
    'molten lava', 
    'photons',
    'infinite loop',
    'escape pod',
    'giant electromagnet',
  ].indexOf(item) === -1;
}

const getDoors = (outputLines) => {
  const doorsIndex = outputLines.indexOf(DOORS_LINE);
  const doorsEnd = outputLines.indexOf('', doorsIndex);
  return outputLines.slice(doorsIndex + 1, doorsEnd)
    .map(l => l.slice(2));
  }
  
const getItems = (outputLines) => {
  const itemsIndex = outputLines.indexOf(ITEMS_LINE);
  if (itemsIndex === -1) {
    return [];
  }
  const itemsEnd = outputLines.indexOf('', itemsIndex);
  return outputLines.slice(itemsIndex + 1, itemsEnd)
    .map(l => l.slice(2));
}

const removeItem = (outputLines, item) => {
  return _.without(outputLines, '- ' + item);
};

const isSecurityRoom = (outputLines) => {
  return outputLines[3] === SECURITY_ROOM;
}

const exploreFeatures = (programInput) => {
  let outputLines = [];
  let visitedRootCount = 0;

  const passedDoors = [];
  const visited = {};
  const featuresLog = {};

  runAsciiProgram(
    programInput,
    () => {
      const safeItems = getItems(outputLines).filter(shouldPickupItem);
      
      if (safeItems.length) {
        featuresLog[safeItems[0]] = passedDoors.slice();
        outputLines = removeItem(outputLines, safeItems[0]);
        console.log('taking', safeItems[0]);
        return 'take ' + safeItems[0];
      }

      const doors = getDoors(outputLines);
      const inSecurityRoom = isSecurityRoom(outputLines);

      outputLines = [];

      const doorsLeft = doors.filter(door => {
        return !visited[passedDoors.concat(door).join(',')] &&
          _.last(passedDoors) !== opposite(door);
      });

      if (inSecurityRoom) {
        featuresLog[SECURITY_ROOM] = passedDoors.slice();
      }

      console.log('doors so far', passedDoors);
      if (doorsLeft.length && !inSecurityRoom) {
        const nextDoor = doorsLeft[0];
        passedDoors.push(nextDoor);
        visited[passedDoors.join(',')] = true;
        console.log('going', nextDoor, doorsLeft)
        return nextDoor;
      } else {
        const lastDoor = passedDoors.pop();
        const doorBack = opposite(lastDoor);
        if (passedDoors.length === 0) {
          visitedRootCount += 1;
        }
        console.log('going back through', doorBack);
        return doorBack;
      }
    },
    (output) => {
      console.log(output);
      outputLines.push(output);
    },
    () => {
      visitedRootCount > 1 && console.log('back twice to hub');
      return visitedRootCount > 1;
    }
  );

  return featuresLog;
}

const tryItems = (programInput, securityPath, itemPaths) => {
  const instructions = [
    ..._.flatMap(itemPaths, (steps, item) => {
      return steps.concat('take ' + item).concat(rewindSteps(steps));
    }),
    ...securityPath,
    'east',
    'X',
  ];

  let outputs = [];
  runAsciiProgram(
    programInput,
    () => {
      if (instructions.length > 1) {
        outputs = [];
      }
      return instructions.shift();
    },
    (output) => {
      outputs.push(output);
    },
    () => {
      return instructions.length === 0;
    }
  );
  
  const isEjected = outputs.join('\n').indexOf('ejected back to the checkpoint') !== -1;
  if (!isEjected) {
    console.log('success\n', outputs.join('\n'))
    throw 'done';
  } else {
    console.log('fail', _.keys(itemPaths));
  }
}

const getPermutations = (items) => {
  if (items.length === 0) {
    return [ [] ];
  }
  const restPermuations = getPermutations(items.slice(1));
  return [
    ...restPermuations,
    ...restPermuations.map(rest => [items[0]].concat(rest))
  ];
};

const runDroid = (programInput) => {
  const featuresLog = exploreFeatures(programInput);

  const itemNames = _.keys(_.omit(featuresLog, SECURITY_ROOM));

  const permutations = getPermutations(itemNames); 

  console.log(permutations.length);

  permutations.forEach((items) => {
    tryItems(
      programInput, 
      featuresLog[SECURITY_ROOM], 
      _.pick(featuresLog, items)
    )
  })
};

runDroid(programInput);