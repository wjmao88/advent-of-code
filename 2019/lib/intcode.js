function range(n) {
  return [...new Array(n).keys()];
}

function parseOpcode(opcode) {
  const op = +opcode.slice(-2);
  const pModes = opcode.slice(0, -2).split('').map(n => +n);
  pModes.reverse();
  return [ op, pModes ];
}

module.exports.runProgram = runProgram;
function* runProgram(programInput, logger = console.log) {
  const program = programInput.slice();
  let cursor = 0;
  let relativeBase = 0;

  function getParamsAddress(pModes, size) {
    return range(size).map((i) => pModes[i] || 0).map((pMode,index) => {  
      const paramCursor = cursor+index+1; 
      switch(pMode) {
        case 0: return get(paramCursor); 
        case 1: return paramCursor;
        case 2: return get(paramCursor) + relativeBase;
        default: throw 'invalid pMode';
      }
    });
  }

  function get(n) {
    return program[n] || 0;
  }

  while (cursor < program.length) {
    const [ op, pModes ] = parseOpcode(get(cursor) + '');
    switch(op) {
      case 1: {
        const [ noun, verb, dest ] = getParamsAddress(pModes, 3);
        program[dest] = get(noun) + get(verb);
        cursor += 4;
        break;
      }
      case 2: {
        const [ noun, verb, dest ] = getParamsAddress(pModes, 3);
        program[dest] = get(noun) * get(verb);
        cursor += 4;
        break;
      }
      case 3: {
        const [ dest ] = getParamsAddress(pModes, 1);
        logger(cursor, get(cursor), 'waiting for input');
        program[dest] = yield;
        logger(cursor, get(cursor), 'input received to', dest, 'val', program[dest]);
        cursor += 2;
        break;
      }
      case 4: {
        const [ val ] = getParamsAddress(pModes, 1);
        const actualVal = get(val)
        logger(cursor, get(cursor), 'will output and wait', val, 'val', actualVal);
        yield actualVal;
        logger(cursor, 'resumed');
        cursor += 2;
        break;
      }
      case 5: {
        const [ isTrue, dest ] = getParamsAddress(pModes, 2);
        if (get(isTrue)) {
          cursor = get(dest);
        } else {
          cursor += 3;
        }
        break;
      }
      case 6: {
        const [ isTrue, dest ] = getParamsAddress(pModes, 2);
        if (!get(isTrue)) {
          cursor = get(dest);
        } else {
          cursor += 3;
        }
        break;
      }
      case 7: {
        const [ noun, verb, dest ] = getParamsAddress(pModes, 3);
        program[dest] = get(noun) < get(verb)? 1 : 0;
        cursor += 4;
        break;
      }
      case 8: {
        const [ noun, verb, dest ] = getParamsAddress(pModes, 3);
        program[dest] = get(noun) === get(verb)? 1 : 0;
        cursor += 4;
        break;
      }
      case 9: {
        const [ offset ] = getParamsAddress(pModes, 1);
        relativeBase += get(offset);
        cursor += 2;
        break;
      }
      case 99: {
        console.log(cursor, 'halted naturally');
        return program;
      }
      default:
        throw `invalid instruction ${op} from ${get(cursor)} at ${cursor}`
    }
  }

  throw 'did not halt naturally';
}


module.exports.runControlledProgram = runControlledProgram;
function runControlledProgram(
  programInput,
  onInput,
  onOutput,
  onHalt
) {
  const runner = runProgram(programInput, () => {});
  let input;
  while(true) {
    const { value, done } = runner.next(input);
    if (done) {
      return onHalt && onHalt(value);
    } else if (value === void 0) {
      input = onInput();
    } else {
      input = void 0;
      onOutput(value);
    }
  }
}

module.exports.runAsciiProgram = runAsciiProgram;
function runAsciiProgram(
  programInput,
  onInput,
  onOutput,
  shouldHalt,
) {
  const runner = runProgram(programInput, () => {});
  let inputBuffer = null;
  let outputBuffer = [];

  let input;
  let counter = 0;
  while(true) {
    counter += 1;
    const { value, done } = runner.next(input);
    if (done || shouldHalt(counter)) {
      return;
    } else if (value === void 0) {
      if (!inputBuffer) {
        const inputRaw = onInput();
        inputBuffer = inputRaw.split('').map(s => s.charCodeAt(0));
      }  
      if (inputBuffer.length) {
        input = inputBuffer.shift();
      } else {
        input = 10;
        inputBuffer = null;
      }
    } else {
      input = void 0;
      if (value === 10) {
        onOutput(outputBuffer.map(a => String.fromCharCode(a)).join(''));
        outputBuffer = [];
      } else {
        outputBuffer.push(value);
      }
    }
  }
}