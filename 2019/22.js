
const dealNewStack = (deck) => {
  const d = deck.slice();
  d.reverse();
  return d;
};

const cutN = (deck, n) => {
  const top = deck.slice(0, n);
  const bot = deck.slice(n);
  return bot.concat(top);
}

const dealIncreN = (deck, n) => {
  const d2 = [];
  deck.forEach((card, index) => {
    d2[(index * n) % deck.length] = card;
  });
  return d2;
}

const shuffleDeckStep = (deck, instruction) => {
  if (instruction === 'deal into new stack') {
    return dealNewStack(deck);
  }
  if (instruction.slice(0,4) === 'cut ') {
    return cutN(deck, +instruction.slice(4));
  }
  if (instruction.slice(0, 20) === 'deal with increment ') {
    return dealIncreN(deck, +instruction.slice(20))
  }
  throw 'unknown instruction ' + instruction;
}

const shuffleDeckProcedure = (deck, instructions) => {
  return instructions.reduce(shuffleDeckStep, deck);
}

const deck = shuffleDeckProcedure(
  require('lodash').range(10007),
  require('./inputs/22').split('\n')
);

console.log(deck.indexOf(2019));

const trackPosition = (instructions) => {

  let tranform = instructions.reduce((fn, instruction) => {
    if (instruction === 'deal into new stack') {
      return p => deckSize - 1 - fn(p);
    } else if (instruction.slice(0,4) === 'cut ') {
      const n = +instruction.slice(4);
      return p => (fn(p) + deckSize - n) % deckSize;
    } else if (instruction.slice(0, 20) === 'deal with increment ') {
      const n = +instruction.slice(20);
      return p => (fn(p) * n) % deckSize;
    } else {
      throw 'unknown instruction ' + instruction;
    }
  }, a => a);
  
  
  const deckSize = 119315717514047;
  const times = 101741582076661;
  const testC = 10174
  let counter = testC;
  
  let position = 2019;
  const start = new Date().valueOf();
  while (counter > 0) {
    counter -= 1;
    position = tranform(position);
  }

  const end = new Date().valueOf();  
  console.log('time', (end - start)/1000, 
    `${Math.round((end - start) * (times/testC) / (1000 * 3600 * 24))} days`
  );
  return position;
}

console.log(
  trackPosition(
    require('./inputs/22').split('\n'),
  )
);

const { modInv, modPow } = require('bigint-crypto-utils');

const inverseTrackPosition = (instructions, position) => {
  const deckSize = 119315717514047n;
  const times = 101741582076661n;

  const [ offsetDiff, incrementMult ] = (() => {
    let offset = 0n;
    let increment = 1n;

    instructions.forEach((instruction) => {
      if (instruction === 'deal into new stack') {
        increment = -increment % deckSize;
        offset = (offset + increment) % deckSize;
      } else if (instruction.slice(0,4) === 'cut ') {
        const n = BigInt(+instruction.slice(4));
        offset = (offset + increment * n) % deckSize;
      } else if (instruction.slice(0, 20) === 'deal with increment ') {
        const n = BigInt(+instruction.slice(20));
        increment = (increment * modInv(n, deckSize)) % deckSize;
      } else {
        throw 'unknown instruction ' + instruction;
      }
    }, a => a);

    return [offset, increment];
  })();

  const increment = modPow(incrementMult, times, deckSize); 
  const offset = (
    offsetDiff *
    (1n - increment) *
    modInv(1n - incrementMult, deckSize)
  ) % deckSize;

  return (offset + increment * position) % deckSize;
}

console.log(
  inverseTrackPosition(
    require('./inputs/22').split('\n'), 
    2020n
  ),
);