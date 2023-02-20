
export function shuffle(array) {
  // NOTE - modifies input
  //
  // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
  //
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


export function getMax(a, b, key) {
  if (key(a) >= key(b)) {
    return a;
  } else {
    return b;
  }
}


export function getMin(a, b, key) {
  if (key(a) < key(b)) {
    return a;
  } else {
    return b;
  }
}

