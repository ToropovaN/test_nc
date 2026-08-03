import type { Color, Vector2 } from "./types";

export const FIXED_TIME_STEP = 1 / 60;
export const MAX_FRAME_TIME = 0.25;

export const SAME_CENTER_COLLISION_NORMAL: Vector2 = { x: 1, y: 0 };

export const INITIAL_CIRCLE_COUNT = 5;
export const MAX_VISIBLE_CIRCLE_CARDS = 20;

export const MIN_CIRCLE_RADIUS = 1;
export const MAX_CIRCLE_RADIUS = 100;

export const MIN_CIRCLE_SPEED = 0;
export const MAX_CIRCLE_SPEED = 1000;

export const CANVAS_BACKGROUND_COLOR: Color = { r: 5, g: 12, b: 21 };
export const DEFAULT_EDITOR_COLOR: Color = { r: 210, g: 226, b: 237 };

export const MIN_ACTIVE_CIRCLE_OPACITY = 0.2;
export const MAX_ACTIVE_CIRCLE_OPACITY = 0.6;
export const ACTIVE_CIRCLE_PULSE_DURATION = 1000;

export const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
uniform vec2 u_center;
uniform vec2 u_scale;

out vec2 v_localPosition;

void main() {
  v_localPosition = a_position;
  vec2 position = u_center + a_position * u_scale;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

uniform vec4 u_color;
in vec2 v_localPosition;
out vec4 outColor;

void main() {
  float distanceFromCenter = length(v_localPosition);
  float edgeWidth = fwidth(distanceFromCenter);
  float alpha = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, distanceFromCenter);

  outColor = vec4(u_color.rgb, u_color.a * alpha);
}
`;
