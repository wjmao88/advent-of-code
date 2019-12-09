function range(n) {
  return [...new Array(n).keys()];
}

function parseOpcode(opcode) {
  const op = +opcode.slice(-2);
  const pModes = opcode.slice(0, -2).split('').map(n => +n);
  pModes.reverse();
  return [ op, pModes ];
}

function* runProgram(programInput) {
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
        console.log(cursor, get(cursor), 'waiting for input');
        program[dest] = yield;
        console.log(cursor, get(cursor), 'input received to', dest);
        cursor += 2;
        break;
      }
      case 4: {
        const [ val ] = getParamsAddress(pModes, 1);
        console.log(cursor, get(cursor), 'will output and wait', val);
        yield get(val);
        console.log(cursor, 'resumed');
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
        return program;
      }
      default:
        throw `invalid instruction ${op} from ${get(cursor)} at ${cursor}`
    }
  }

  throw 'did not halt naturally';
}