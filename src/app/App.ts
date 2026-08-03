import { AppRender } from "./Render";
import { Physics } from "./Physics";
import { AppInterface } from "./interface/AppInterface";
import { SimulationStorage } from "./Storage";
import type { Circle, SimulationConfig } from "../data/types";
import { randomBetween } from "../utils/utils";
import {
  DEFAULT_FIXED_TIME_STEP,
  MAX_FRAME_TIME,
} from "../data/constants";

export class App {
  private readonly renderer: AppRender;
  private readonly interface: AppInterface;
  private readonly physics: Physics;
  private readonly storage: SimulationStorage;

  private readonly circles: Circle[];

  private readonly resizeObserver: ResizeObserver;

  private config: SimulationConfig | null = null;
  private previousTime: number | null = null;
  private statsStartTime: number | null = null;
  private renderedFrames = 0;
  private physicsUpdateCount = 0;
  private collisionCount = 0;
  private fixedTimeStep = DEFAULT_FIXED_TIME_STEP;
  private accumulatedTime = 0;

  constructor(canvas: HTMLCanvasElement, root: HTMLElement) {
    this.renderer = new AppRender(canvas);
    this.physics = new Physics();
    this.storage = new SimulationStorage();

    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
    this.resizeCanvas();
    this.circles = [];

    this.interface = new AppInterface(root, {
      onStart: this.startSimulation,
      onReset: this.resetCircles,
      onSave: this.saveSimulation,
      onLoadSave: this.loadSimulation,
      onDeleteSave: this.deleteSave,
    });

    this.interface.initSavesList(this.storage.getSavesList());
    this.interface.renderStats({
      fps: 0,
      physicsUpdatesPerSecond: 0,
      collisionsPerSecond: 0,
    });
    this.resizeObserver.observe(canvas);
    requestAnimationFrame(this.loop);
  }

  private readonly resizeCanvas = (): void => {
    this.renderer.resize(
      this.renderer.canvas.clientWidth,
      this.renderer.canvas.clientHeight,
      window.devicePixelRatio || 1,
    );
  };

  private createCircle(config: SimulationConfig): Circle {
    const direction = (config.direction * Math.PI) / 180;

    return {
      position: {
        x:
          this.renderer.width >= config.radius * 2
            ? randomBetween(config.radius, this.renderer.width - config.radius)
            : this.renderer.width / 2,
        y:
          this.renderer.height >= config.radius * 2
            ? randomBetween(
                config.radius,
                this.renderer.height - config.radius,
              )
            : this.renderer.height / 2,
      },
      velocity: {
        x: Math.cos(direction) * config.speed,
        y: Math.sin(direction) * config.speed,
      },
    };
  }

  private readonly startSimulation = (config: SimulationConfig): void => {
    this.config = config;
    this.fixedTimeStep = this.calculateFixedTimeStep(config);
    this.accumulatedTime = 0;
    this.resetPhysicsStats();
    this.circles.splice(0);
    for (let index = 0; index < config.objectCount; index += 1) {
      this.circles.push(this.createCircle(config));
    }
    this.renderer.configure(config);
  };

  private readonly resetCircles = (): void => {
    this.circles.splice(0);
    this.config = null;
    this.fixedTimeStep = DEFAULT_FIXED_TIME_STEP;
    this.accumulatedTime = 0;
    this.resetPhysicsStats();
  };

  private readonly saveSimulation = (): void => {
    if (!this.config) return;

    const createdSave = this.storage.createSaveItem(
      this.config,
      this.circles,
    );

    this.interface.addSaveItem(createdSave);
    this.interface.showSaveNotification(createdSave.name);
  };

  private readonly loadSimulation = (id: string): void => {
    const save = this.storage.getSaveItemById(id);
    if (!save) return;

    this.circles.splice(0);
    for (const circle of save.circles) {
      this.circles.push(circle);
    }
    this.config = save.config;
    this.fixedTimeStep = this.calculateFixedTimeStep(save.config);
    this.accumulatedTime = 0;
    this.resetPhysicsStats();
    this.renderer.configure(save.config);
    this.interface.setConfig(save.config);
    this.interface.setRunning(true);
  };

  private readonly deleteSave = (id: string): void => {
    this.storage.deleteSaveItem(id);
    this.interface.removeSaveItem(id);
  };

  private readonly loop = (currentTime: number): void => {
    if (this.previousTime === null) {
      this.previousTime = currentTime;
    }

    const frameTime = Math.min(
      (currentTime - this.previousTime) / 1000,
      MAX_FRAME_TIME,
    );

    this.previousTime = currentTime;
    if (this.config) {
      this.accumulatedTime += frameTime;
    }

    while (this.config && this.accumulatedTime >= this.fixedTimeStep) {
      this.collisionCount += this.physics.update(
        this.circles,
        this.config,
        this.fixedTimeStep,
        this.renderer.width,
        this.renderer.height,
      );
      this.physicsUpdateCount += 1;
      this.accumulatedTime -= this.fixedTimeStep;
    }

    this.renderer.render(this.circles);
    this.renderedFrames += 1;
    this.updateStats(currentTime);

    requestAnimationFrame(this.loop);
  };

  private updateStats(currentTime: number): void {
    if (this.statsStartTime === null) {
      this.statsStartTime = currentTime;
      return;
    }

    const elapsedTime = currentTime - this.statsStartTime;

    if (elapsedTime < 1000) {
      return;
    }

    const fps = Math.round((this.renderedFrames * 1000) / elapsedTime);

    const physicsUpdatesPerSecond = Math.round(
      (this.physicsUpdateCount * 1000) / elapsedTime,
    );
    const collisionsPerSecond = Math.round(
      (this.collisionCount * 1000) / elapsedTime,
    );

    this.interface.renderStats({
      fps,
      physicsUpdatesPerSecond,
      collisionsPerSecond,
    });
    this.statsStartTime = currentTime;
    this.renderedFrames = 0;
    this.physicsUpdateCount = 0;
    this.collisionCount = 0;
  }

  private resetPhysicsStats(): void {
    this.physicsUpdateCount = 0;
    this.collisionCount = 0;
  }

  private calculateFixedTimeStep(config: SimulationConfig): number {
    if (config.speed === 0) {
      return DEFAULT_FIXED_TIME_STEP;
    }

    const distancePerDefaultStep =
      config.speed * DEFAULT_FIXED_TIME_STEP;
    const allowedDistancePerStep = config.radius * 0.5;

    if (distancePerDefaultStep <= allowedDistancePerStep) {
      return DEFAULT_FIXED_TIME_STEP;
    }

    return allowedDistancePerStep / config.speed;
  }
}
