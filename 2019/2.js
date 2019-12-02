
function runProgram(input) {
  const program = input.slice();
  let cursor = 0;

  while (cursor < program.length) {
    switch(+program[cursor]) {
      case 1: {
        program[program[cursor + 3]] = +program[program[cursor + 1]] + +program[program[cursor + 2]];
        break;
      }
      case 2: {
        program[program[cursor + 3]] = +program[program[cursor + 1]] * +program[program[cursor + 2]];
        break;
      }
      case 99: {
        return program;
      }
      default:
        throw 'invalid instruction'
    }
    cursor += 4;
  }

  return program;
}

function findInputs(inputs, target) {
  for (let noun = 0; noun <= 99; noun++) {
    for (let verb = 0; verb <= 99; verb++) {
      const program = inputs.slice();
      program[1] = noun;
      program[2] = verb;
      if (runProgram(program)[0] === target) {
        return [noun, verb];
      }
    }
  }
}
