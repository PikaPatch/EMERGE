import { scalePow,scaleSequential, ScaleSequential,scaleDiverging,ScaleDiverging } from 'd3-scale';
import { interpolateReds,interpolatePRGn } from 'd3-scale-chromatic';

// export const ColorScaler = (range: [number, number]): ScaleSequential<string, never> => {
//   return scaleSequential<string>(interpolateReds).domain(range)}

export const ColorScaler = (range: [number, number]): ((value: number) => string) => {
  // Degenerate domain: all values are equal → return white
  if (range[0] === range[1]) {
    return () => "#ffffff";
  }
  return scaleSequential<string>(interpolateReds).domain(range);
};

function squeezedPRGn(squeeze: number = 2.5) {
  return (t: number) => {
    // Remap t so midpoint transitions are steeper
    const centered = t - 0.5;           // shift to [-0.5, 0.5]
    const remapped = Math.sign(centered) * Math.pow(Math.abs(centered * 2), 1 / squeeze) / 2;
    return interpolatePRGn(remapped + 0.5);
  };
}

export const ColorScalerShape = (
  range: [number, number, number, number]
): ScaleDiverging<string, never> => {
  const [min, max, mean, median] = range;
  return scaleDiverging<string>(squeezedPRGn(2.5)).domain([min, mean, max]);
};


export const PowerColorScaler = (range: [number, number]): ScaleSequential<string, never> => {
  const power = scalePow().exponent(0.4).domain(range).range([0, 1]).clamp(true);
  return scaleSequential<string>((t) => interpolateReds(power(t))).domain(range);
}