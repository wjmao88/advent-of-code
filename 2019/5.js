
function parseOpcode(opcode) {
  const op = +opcode.slice(-2);
  const pModes = opcode.slice(0, -2).split('').map(n => +n);
  pModes.reverse();
  return [ op, pModes ];
}

function runProgram(programInput, inputValues, logger = console.log) {
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
        program[program[cursor+1]] = inputValues.shift();
        cursor += 2;
        break;
      }
      case 4: {
        const [ val ] = getParamValues(1, pModes);
        logger(val, 'at', cursor)
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
