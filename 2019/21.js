
const _ = require('lodash');
const { runControlledProgram } = require('./lib/intcode');

const toAsciiCode = (string) => {
  return string.split('').map(c => c.charCodeAt(0));
};

const fromAsciiToMap = (asciiOutputs) => {
  return asciiOutputs.map(a => String.fromCharCode(a)).join('');
}

const codeRunner = (program) => (code) => {
  const codeInputs = toAsciiCode(code);

  const output = [];
  const onInput = () => {
    return codeInputs.shift();
  }

  const onOutput = (value) => {
    output.push(value);
  }
 
  runControlledProgram(
    program,
    onInput,
    onOutput
  );

  return output;
}

const printOutput = (output) => {
  if (output[output.length - 1] < 150) {
    console.log('fail');
    console.log(fromAsciiToMap(output));
  } else {
    console.log('success', output[output.length - 1])
  }
}

const surveyHull = (program) => {
  const runner = codeRunner(program)
  
  const output1 = runner([
    'OR D J', //J => D, can land

    'OR A T', //T => A
    'AND B T', //T => A && B
    'AND C T', //T => A && B && C
    'NOT T T', //T => !A || !B || !C
    
    'AND T J',
    
    'WALK',
    ''
  ].join('\n'));

  const output2 = runner([
    //should it jump to D?
    'OR A T', //T => A
    'AND B T', //T => A && B
    'AND C T', //T => A && B && C
    'NOT T T', //T => !A || !B || !C

    //can it jump to D?
    //one of E(not jump) and H (jump) is safe
    'OR E J', 
    'OR H J',
    //D must also be safe
    'AND D J',

    //combine the two
    'AND T J',
    
    'RUN',
    ''
  ].join('\n'));

  printOutput(output1)
  printOutput(output2)
};

surveyHull(require('./inputs/21'));
