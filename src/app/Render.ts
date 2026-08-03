import type { Circle } from "../data/types";
import {
  ACTIVE_CIRCLE_PULSE_DURATION,
  CANVAS_BACKGROUND_COLOR,
  FRAGMENT_SHADER_SOURCE,
  MAX_ACTIVE_CIRCLE_OPACITY,
  MIN_ACTIVE_CIRCLE_OPACITY,
  VERTEX_SHADER_SOURCE,
} from "../data/constants";
import { colorToNormalizedRgb } from "../utils/utils";

const QUAD_VERTICES = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const BACKGROUND_RGB = colorToNormalizedRgb(CANVAS_BACKGROUND_COLOR);

export class AppRender {
  readonly canvas: HTMLCanvasElement;

  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly colorLocation: WebGLUniformLocation;
  private readonly centerLocation: WebGLUniformLocation;
  private readonly scaleLocation: WebGLUniformLocation;

  private logicalWidth = 1;
  private logicalHeight = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2");

    if (!gl) {
      throw new Error("WebGL2 не поддерживается");
    }

    this.gl = gl;
    this.program = this.createProgram();
    const positionLocation = gl.getAttribLocation(this.program, "a_position");

    const colorLocation = gl.getUniformLocation(this.program, "u_color");
    const centerLocation = gl.getUniformLocation(this.program, "u_center");
    const scaleLocation = gl.getUniformLocation(this.program, "u_scale");
    const positionBuffer = gl.createBuffer();

    if (
      positionLocation === -1 ||
      !colorLocation ||
      !centerLocation ||
      !scaleLocation ||
      !positionBuffer
    ) {
      throw new Error("Ошибка инициализации WebGL");
    }

    this.colorLocation = colorLocation;
    this.centerLocation = centerLocation;
    this.scaleLocation = scaleLocation;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);
    gl.useProgram(this.program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(...BACKGROUND_RGB, 1);
  }

  get width(): number {
    return this.logicalWidth;
  }

  get height(): number {
    return this.logicalHeight;
  }

  resize(width: number, height: number, pixelRatio: number): void {
    const logicalWidth = Math.max(1, Math.round(width));
    const logicalHeight = Math.max(1, Math.round(height));
    const backingWidth = Math.max(1, Math.round(logicalWidth * pixelRatio));
    const backingHeight = Math.max(1, Math.round(logicalHeight * pixelRatio));

    if (
      this.logicalWidth === logicalWidth &&
      this.logicalHeight === logicalHeight &&
      this.canvas.width === backingWidth &&
      this.canvas.height === backingHeight
    ) {
      return;
    }

    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;
    this.canvas.width = backingWidth;
    this.canvas.height = backingHeight;
    this.gl.viewport(0, 0, backingWidth, backingHeight);
  }

  render(
    circles: Circle[],
    activeCircleId: string | null,
    currentTime: number,
  ): void {
    const gl = this.gl;
    let activeCircleOpacity = 1;

    if (activeCircleId !== null) {
      const opacityPulseAngle =
        (currentTime / ACTIVE_CIRCLE_PULSE_DURATION) * Math.PI * 2;
      const opacityInterpolationFactor = (Math.sin(opacityPulseAngle) + 1) / 2;
      activeCircleOpacity =
        MIN_ACTIVE_CIRCLE_OPACITY +
        opacityInterpolationFactor *
          (MAX_ACTIVE_CIRCLE_OPACITY - MIN_ACTIVE_CIRCLE_OPACITY);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const circle of circles) {
      const [red, green, blue] = colorToNormalizedRgb(circle.color);
      const opacity = circle.id === activeCircleId ? activeCircleOpacity : 1;
      const centerX = this.toClipX(circle.position.x);
      const centerY = this.toClipY(circle.position.y);
      const scaleX = (circle.radius / this.logicalWidth) * 2;
      const scaleY = (circle.radius / this.logicalHeight) * 2;

      gl.uniform2f(this.centerLocation, centerX, centerY);
      gl.uniform2f(this.scaleLocation, scaleX, scaleY);
      gl.uniform4f(this.colorLocation, red, green, blue, opacity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  private toClipX(x: number): number {
    return (x / this.logicalWidth) * 2 - 1;
  }

  private toClipY(y: number): number {
    return 1 - (y / this.logicalHeight) * 2;
  }

  private createProgram(): WebGLProgram {
    const gl = this.gl;
    const vertexShader = this.createShader(
      gl.VERTEX_SHADER,
      VERTEX_SHADER_SOURCE,
    );
    const fragmentShader = this.createShader(
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER_SOURCE,
    );
    const program = gl.createProgram();

    if (!program) {
      throw new Error("Не удалось создать WebGL программу");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) ?? "Не удалось привязать программу",
      );
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);

    if (!shader) {
      throw new Error("Не удалось создать шейдер");
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(
        this.gl.getShaderInfoLog(shader) ?? "Ошибка компиляции шейдера",
      );
    }

    return shader;
  }
}
