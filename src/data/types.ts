export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Vector2 = {
  x: number;
  y: number;
};

export type Circle = {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: Color;
};

export type CircleEditorData = {
  radius: number;
  speed: number;
  direction: number;
  color: Color;
};

export type SimulationSave = {
  id: string;
  name: string;
  circles: Circle[];
};
