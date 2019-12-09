function range(n) {
  return [...new Array(n).keys()];
}

function toLayers(input, wide, tall) {
  const digits = input.split('').map(n => +n);
  const layerSize = wide * tall;
  const numLayers = Math.floor(digits.length/layerSize);
  return range(numLayers).map(n => {
    return digits.slice(n * layerSize, (n + 1) * layerSize);
  });
}

function combineLayers(layers) {
  const pixelLayers = layers[0].map((_, pixel) => {
    return layers.map(layer => layer[pixel]);
  });
  return pixelLayers.map(pixel => {
    const visiblePixels = pixel.filter(p => p !== 2);
    return visiblePixels.length? visiblePixels[0] : 2;
  });
}

function leastZeros(input, wide, tall) {
  const layers = toLayers(input, wide, tall);
  
  function occuranceOf(digits, target) {
    return digits.filter(n => +n === +target).length;
  }

  const leastZeroLayer = layers.reduce((least, layer) => {
    if (!least || occuranceOf(least, 0) > occuranceOf(layer, 0)) {
      return layer;
    } else {
      return least;
    }
  }, null);

  return occuranceOf(leastZeroLayer, 1) * occuranceOf(leastZeroLayer, 2);
}

function renderImage(input, wide, tall) {
  const layers = toLayers(input, wide, tall);
  const pixels = combineLayers(layers);

  return '\n' + range(tall).map(row => {
    return pixels.slice(row * wide, (row + 1) * wide).map(n => n? n : ' ').join('');
  }).join('\n') + '\n';
}