
function createOrbitGraph(list) {
  return list.map(info => info.split(')'))
    .reduce((orbitGraph, [ center, orbitBy ]) => {
      orbitGraph[orbitBy] = center;
      return orbitGraph;
    }, {});
}

function countOrbits(list) {
  const orbitGraph = createOrbitGraph(list);
  const memo = {};

  function countParentOrbits(leaf) {
    if (!orbitGraph[leaf]) {
      return 0;
    } else {
      if (!memo[leaf]) {
        memo[leaf] = 1 + countParentOrbits(orbitGraph[leaf]);
      }
      return memo[leaf];
    }
  }

  return Object.keys(orbitGraph).reduce((total, leaf) => {
    return total + countParentOrbits(leaf);
  }, 0);
}

function findTransfers(list, from, to) {
  const orbitGraph = createOrbitGraph(list);

  const findPathToRoot = (node) => {
    const path = [];
    let current = node
    while (orbitGraph[current]) {
      path.push(orbitGraph[current]);
      current = orbitGraph[current];
    }
    path.reverse();
    return path;
  }

  const findDivergedIndex = (path1, path2) => {
    for (let i = 0; i < Math.min(path1.length, path2.length); i ++) {
      if (path1[i] !== path2[i]) {
        return i;
      }
    }
  }

  const fromPath = findPathToRoot(from);
  const toPath = findPathToRoot(to);

  const divergedIndex = findDivergedIndex(fromPath, toPath);
  return fromPath.slice(divergedIndex).length + toPath.slice(divergedIndex).length;
}