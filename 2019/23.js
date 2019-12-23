
const _ = require('lodash');
const { runProgram } = require('./lib/intcode');

const createComputer = (programInput, index) => {
  const runner = runProgram(programInput, () => {});

  const queue = [];
  
  runner.next();
  runner.next(index);

  let isIdle = false;
  let output = [];

  return {
    isIdle: () => isIdle,
    step: () => {
      const inputVal = queue.length? queue[0] : -1;
      const { value } = runner.next(inputVal);
      if (value !== void 0) {
        isIdle = false;
        output.push(value);
      } else {
        queue.shift();
        isIdle = !queue.length;
      }

      if (output.length === 3) {
        const [dest, x, y] = output;
        output = [];
        console.log(index, '->', dest, x, y);
        return [ dest, x, y ];
      }
    },
    queuePacket: ([x,y]) => {
      queue.push(x,y)
    }
  }
};

const rebuildNetwork = (programInput) => {
  const computers = _.range(50).map((index) => createComputer(programInput, index));

  let nat;
  let lastSentY;
  let idleTime = 0;

  while (true) {
    if (idleTime) {
      if (nat &&  nat[1] === lastSentY) {
        return nat[1];
      }
      idleTime = 0;
      console.log('sending nat', nat);
      computers[0].queuePacket(nat);
      lastSentY = nat[1];
    }
    let packetCount = 0;
    for (index in computers) {
      const computer = computers[index];
      const packet = computer.step();
      if (packet) {
        packetCount += 1;
        const [ dest, x, y ] = packet;
        if (dest === 255) {
          nat = [x,y];
          console.log(index, 'setting nat', nat);
        } else {
          computers[dest].queuePacket([x,y]);
        }
      }
    }
    if (packetCount === 0 && _.every(computers.map(c => c.isIdle()))) {
      idleTime += 1;
    }
  }
}

rebuildNetwork(require('./inputs/23'));