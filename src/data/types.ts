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
  position: Vector2;
  velocity: Vector2;
};

export type SimulationConfig = {
  radius: number;
  speed: number;
  direction: number;
  color: Color;
  restitution: number;
  objectCount: number;
};

export type SimulationSave = {
  id: string;
  name: string;
  config: SimulationConfig;
  circles: Circle[];
};

export type SimulationStats = {
  fps: number;
  physicsUpdatesPerSecond: number;
  collisionsPerSecond: number;
};
