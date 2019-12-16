
const {
  keyBy,
  sum,
  fromPairs,
  map
} = require('lodash');

const createRecipeMap = (recipes) => {
  const lines = recipes.split('\n').filter(n => !!n);
  return keyBy(lines.map(line => {
    const [ inputs, output ] = line.split(' => ');
    const [ amount, name ] = output.split(' ');
    return {
      name,
      amount: +amount,
      inputs: fromPairs(inputs.split(', ').map(input => {
        const [ amount, name ] = input.split(' ');
        return [ name, +amount ];
      }))
    }
  }), 'name');
}

const createDAG = (recipeMap, name, amount) => {
  const nodes = {};

  const createDAGRec = (name, requiredBy) => {
    nodes[name] = nodes[name] || { name, requires: [], requiredBy: [] };
    if (requiredBy && nodes[name].requiredBy.indexOf(requiredBy) === -1) {
      nodes[name].requiredBy.push(requiredBy);
    }
    if (recipeMap[name]){
      nodes[name].requires = map(recipeMap[name].inputs, (_amount, reqName) => {
        return createDAGRec(reqName, name);
      })
    }
    return name;
  }

  createDAGRec(name, amount, null);
  return nodes;
}

const getOreCost = (recipeMap, requirementsGraph, finalName, finalAmount) => {
  const getNumberRequired = (name) => {
    if (name === finalName) {
      return finalAmount;
    }
  
    const requiredBy = requirementsGraph[name].requiredBy;

    const amountRequired = sum(requiredBy.map(requirement => {
      const recipe = recipeMap[requirement];

      const amountNeeded = getNumberRequired(requirement);

      const servingsNeeded = Math.ceil(amountNeeded/recipe.amount);

      const totalRequired = recipe.inputs[name] * servingsNeeded;

      return totalRequired;
    }));

    return amountRequired;
  };

  return getNumberRequired('ORE');
}

const costOfOneFuel = (data) => {
  const recipeMap = createRecipeMap(data);
  console.log(recipeMap);
  const requirementsGraph = createDAG(recipeMap, 'FUEL');
  console.log(requirementsGraph);
  return getOreCost(recipeMap, requirementsGraph, 'FUEL', 1)
}

const getFuelsPossible = (data, limit) => {
  const recipeMap = createRecipeMap(data);
  console.log(recipeMap);
  const requirementsGraph = createDAG(recipeMap, 'FUEL');
  console.log(requirementsGraph);

  const oneCost = getOreCost(recipeMap, requirementsGraph, 'FUEL', 1);
  let fuelsMin = Math.floor(limit/oneCost);
  let fuelsMax = fuelsMin * 2;
  let fuels;
  let fuelsCost;
  let plusCost;
  let counter = 100;
  while (counter > 0) {
    counter -= 1;

    fuels = Math.floor((fuelsMax + fuelsMin)/2);
    fuelsCost = getOreCost(recipeMap, requirementsGraph, 'FUEL', fuels);
    plusCost = getOreCost(recipeMap, requirementsGraph, 'FUEL', fuels + 1);
    
    console.log(`
      ${counter}, 
      ${fuels} fuels, 
      ${fuelsCost} cost
      ${plusCost} +1 cost
      ${1000000000000-fuelsCost} extra ore, 
      ${1000000000000-plusCost} eo for +1
    `)

    if (fuelsCost <= limit && plusCost > limit) {
      return fuels;
    }
    if (fuelsCost > limit) {
      fuelsMax = fuels;
    }
    if (plusCost < limit) {
      fuelsMin = fuels;
    }
  }

  return `
    fail, 
    ${fuels} fuels, 
    ${1000000000000 - fuelsCost} extra ore, 
    ${1000000000000 - fuelsCost} eo for +1
  `;
}

const data = require('./inputs/14')

console.log(
  costOfOneFuel(data), 
  getFuelsPossible(data, 1000000000000)
)
