import type { Circle, SimulationConfig } from "../data/types";
import {
  CANVAS_BACKGROUND_COLOR,
  FRAGMENT_SHADER_SOURCE,
  VERTEX_SHADER_SOURCE,
} from "../data/constants";
import { colorToNormalizedRgb } from "../utils/utils";

const QUAD_VERTICES = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const BACKGROUND_RGB = colorToNormalizedRgb(CANVAS_BACKGROUND_COLOR);

export class AppRender {
  readonly canvas: HTMLCanvasElement;

  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vertexArray: WebGLVertexArrayObject;
  private readonly instanceBuffer: WebGLBuffer;
  private readonly colorLocation: WebGLUniformLocation;
  private readonly scaleLocation: WebGLUniformLocation;

  private instanceData = new Float32Array(0);
  private radius = 0;
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
    const centerLocation = gl.getAttribLocation(this.program, "a_center");
    const colorLocation = gl.getUniformLocation(this.program, "u_color");
    const scaleLocation = gl.getUniformLocation(this.program, "u_scale");
    const vertexArray = gl.createVertexArray();
    const positionBuffer = gl.createBuffer();
    const instanceBuffer = gl.createBuffer();

    if (
      positionLocation === -1 ||
      centerLocation === -1 ||
      !colorLocation ||
      !scaleLocation ||
      !vertexArray ||
      !positionBuffer ||
      !instanceBuffer
    ) {
      throw new Error("Ошибка инициализации WebGL");
    }

    this.colorLocation = colorLocation;
    this.scaleLocation = scaleLocation;
    this.vertexArray = vertexArray;
    this.instanceBuffer = instanceBuffer;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vertexArray);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 0, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(centerLocation);
    gl.vertexAttribPointer(centerLocation, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(centerLocation, 1);

    gl.bindVertexArray(null);
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

  configure(config: SimulationConfig): void {
    const [red, green, blue] = colorToNormalizedRgb(config.color);

    this.radius = config.radius;
    this.instanceData = new Float32Array(config.objectCount * 2);

    this.gl.useProgram(this.program);
    this.gl.uniform4f(this.colorLocation, red, green, blue, 1);
    this.updateCircleScaleByCanvasSize();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.instanceData.byteLength,
      this.gl.DYNAMIC_DRAW,
    );
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
    this.updateCircleScaleByCanvasSize();
  }

  render(circles: Circle[]): void {
    const gl = this.gl;

    for (let index = 0; index < circles.length; index += 1) {
      const circle = circles[index];
      if (!circle) continue;

      const offset = index * 2;
      this.instanceData[offset] = this.toClipX(circle.position.x);
      this.instanceData[offset + 1] = this.toClipY(circle.position.y);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (circles.length === 0) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vertexArray);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, circles.length);
    gl.bindVertexArray(null);
  }

  private updateCircleScaleByCanvasSize(): void {
    this.gl.useProgram(this.program);
    this.gl.uniform2f(
      this.scaleLocation,
      (this.radius / this.logicalWidth) * 2,
      (this.radius / this.logicalHeight) * 2,
    );
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
      throw new Error("Не удалось создать WebGL-программу");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) ?? "Не удалось связать WebGL-программу",
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
