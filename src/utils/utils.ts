import type { Color } from "../data/types";

export function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

export function fitValueIntoRange(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function createRandomColor(): Color {
  const createColorChannel = (): number => Math.floor(randomBetween(80, 256));

  return {
    r: createColorChannel(),
    g: createColorChannel(),
    b: createColorChannel(),
  };
}

export function colorToNormalizedRgb(color: Color): [number, number, number] {
  return [color.r / 255, color.g / 255, color.b / 255];
}

export function colorToCss(color: Color): string {
  return `rgb(${color.r} ${color.g} ${color.b})`;
}

export function colorToInputValue(color: Color): string {
  const channelToHex = (channel: number): string =>
    channel.toString(16).padStart(2, "0");

  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
}

export function colorFromInputValue(value: string): Color {
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}
