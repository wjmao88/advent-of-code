
function parseOpcode(opcode) {
  const op = +opcode.slice(-2);
  const pModes = opcode.slice(0, -2).split('').map(n => +n);
  pModes.reverse();
  return [ op, pModes ];
}

function* runProgram(programInput) {
  const program = programInput.slice();
  let cursor = 0;

  function getParamValues(paramSize, pModes) {
    const params = program.slice(cursor + 1, cursor + 1 + paramSize);
    return params.map((num, index) => {
      if (pModes[index] === 1) {
        return num;
      } else {
        return program[num];
      }
    });
  }

  while (cursor < program.length) {
    const [ op, pModes ] = parseOpcode(program[cursor] + '');
    switch(op) {
      case 1: {
        const [ noun, verb ] = getParamValues(2, pModes);
        program[program[cursor+3]] = noun + verb;
        cursor += 4;
        break;
      }
      case 2: {
        const [ noun, verb ] = getParamValues(2, pModes);
        program[program[cursor+3]] = noun * verb;
        cursor += 4;
        break;
      }
      case 3: {
        program[program[cursor+1]] = yield;
        cursor += 2;
        break;
      }
      case 4: {
        const [ val ] = getParamValues(1, pModes);
        yield val;
        cursor += 2;
        break;
      }
      case 5: {
        const [ isTrue, dest ] = getParamValues(2, pModes);
        if (isTrue) {
          cursor = dest;
        } else {
          cursor += 3;
        }
        break;
      }
      case 6: {
        const [ isTrue, dest ] = getParamValues(2, pModes);
        if (!isTrue) {
          cursor = dest;
        } else {
          cursor += 3;
        }
        break;
      }
      case 7: {
        const [ first, second ] = getParamValues(2, pModes);
        program[program[cursor+3]] = first < second? 1 : 0;
        cursor += 4;
        break;
      }
      case 8: {
        const [ first, second ] = getParamValues(2, pModes);
        program[program[cursor+3]] = first === second? 1 : 0;
        cursor += 4;
        break;
      }
      case 99: {
        return program;
      }
      default:
        throw `invalid instruction ${op} from ${program[cursor]} at ${cursor}`
    }
  }

  throw 'did not halt naturally';
}

function runAmplifiers(program, phaseSettings) {
  const runners = phaseSettings.map(phaseSetting => {
    const runner = runProgram(program);
    runner.next();
    runner.next(phaseSetting);
    return runner;
  });

  let signal = 0;
  while (true) {
    for (let i = 0; i < runners.length; i++) {
      const runner = runners[i];
      const { value, done } = runner.next(signal);
      runner.next();
      if (done) {
        return signal;
      } else {
        signal = value;
      }
    }
  }
}

function isUnique(...nums) {
  const map = nums.reduce((acc, n) => {
    acc[n] = n;
    return acc;
  }, {});

  return Object.keys(map).length === nums.length;
}

function findMaxSignal(program, offset = 0) {
  let max = 0;
  for (let a = 0; a <= 4; a++) {
    for (let b = 0; b <= 4; b++) {
      for (let c = 0; c <= 4; c++) {
        for (let d = 0; d <= 4; d++) {
          for (let e = 0; e <= 4; e++) {
            if (isUnique(a,b,c,d,e)) {
              const result = runAmplifiers(program, [
                a+offset,
                b+offset,
                c+offset,
                d+offset,
                e+offset
              ]);
              max = Math.max(max, result);
            }
          }
        }
      }
    }
  }
  return max;
}