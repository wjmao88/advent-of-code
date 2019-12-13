
function changeVelocity(self, others) {
  return others.reduce(([ sPos, sVel ], [ oPos ]) => {
    const newVel = sVel.map((v, i) => {
      const sp = sPos[i];
      const op = oPos[i];
      const diff = 
        op > sp? 1 :
        sp > op? -1 :
        0;
      return v + diff;
    }); 
    return [ sPos, newVel, ];
  }, self);
}

function changePosition([ [ x, y, z ], [ xv, yv, zv ] ]) {
  return [ 
    [ x + xv, y + yv, z + zv ], 
    [ xv, yv, zv ] 
  ];
}

function timeStep(moons) {
  return moons.map((self) => {
    const others = moons.filter(n => n !== self);
    return changeVelocity(self, others);
  }).map(changePosition);
}

function flatten(items) {
  return items.reduce((s,n) => s.concat(n), []);
}

function sumAbs(nums) {
  return nums.reduce((s,n) => s + Math.abs(n), 0);
}

function totalEnergy(moons) {
  return sumAbs(moons.map(([ pos, vel ]) => sumAbs(pos) * sumAbs(vel)));
}

function gcd(a,b) {
  if (a === b) {
    return a;
  } else if (a === 0) {
    return b;
  } else if (b === 0) {
    return a;
  } else if (a > b) {
    return gcd(a % b, b);
  } else {
    return gcd(a, b % a);
  }
}

function gcdList(list) {
  return list.reduce((total, s) => {
    return (total * s)/gcd
  }, 1);
}

function hasFilledSize(list, size) {
  return list.filter(n => !!n).length === size;
}

function energyAfterSteps(moons, steps) {
  let counter = 0;
  print(counter, moons);
  while (counter < steps) {
    counter += 1;
    moons = timeStep(moons);
    print(counter, moons);
  }
  return totalEnergy(moons);
}

function findFirstRepeat(moons) {
  let counter = 0;
  const initial = moons.slice();
  const periodsList = [];

  while (!hasFilledSize(flatten(periodsList), 3)) {
    counter += 1;
    moons = timeStep(moons);
    [0,1,2].forEach((dimension) => {
      const sameForDimension = moons.reduce((acc, moon, mIndex) => {
        const pos = moon[0][dimension];
        const initialPos = initial[mIndex][0][dimension];
        return acc && pos === initialPos && moon[1][dimension] === 0;
      }, true);
      if (sameForDimension) {
        periodsList[dimension] = counter;
      }
    });
  }
  const result = flatten(periodsList).reduce((total, s) => {
    return (total * s)/gcd(total, s)
  }, 1).toLocaleString('fullwide', {useGrouping:false});
  console.log(result);
  return result;
}

function parse(input) {
  return input.split('\n').map(line => {
    return line.replace('<x=', '')
      .replace('y=', '')
      .replace('z=', '')
      .replace('>', '')
      .split(', ')
      .map(n => +n);
  }).map(pos => [ pos, [0,0,0]]);
}
