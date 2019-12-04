
function toDigits(num) {
  return (num + '').split('').map(n => +n);
}

function isIncreasing(digits) {
  return digits.filter((digit, index) => {
    return digits.slice(0, index).filter(n => n > digit).length > 0
  }).length === 0;
}

function hasDouble(digits) {
  return digits.filter((digit, index) => {
    return digit === digits[index + 1];
  }).length > 0;
}

function hasUngroupedDouble(digits) {
  return digits.filter((digit, index) => {
    return digit === digits[index + 1] &&
      digit !== digits[index - 1] && 
      digit !== digits[index + 2]; 
  }).length > 0;
}

function generatePWs(min, max) {
  let current = min;
  const results = [];
  const results2 = [];
  while(current <= max) {
    const digits = toDigits(current);
    if (isIncreasing(digits) && hasDouble(digits)) {
      results.push(digits);
      if (hasUngroupedDouble(digits)) {
        results2.push(digits);
      }
    }
    current += 1;
  }
  return [
    results,
    results2
  ];
}