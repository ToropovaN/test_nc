import { AppRender } from "./Render";
import { Physics } from "./Physics";
import { AppInterface } from "./interface/AppInterface";
import { SimulationStorage } from "./Storage";
import type { Circle, CircleEditorData } from "../data/types";
import { createRandomColor, randomBetween } from "../utils/utils";
import {
  FIXED_TIME_STEP,
  INITIAL_CIRCLE_COUNT,
  MAX_CIRCLE_RADIUS,
  MAX_CIRCLE_SPEED,
  MAX_FRAME_TIME,
  MIN_CIRCLE_RADIUS,
  MIN_CIRCLE_SPEED,
} from "../data/constants";

export class App {
  private readonly renderer: AppRender;
  private readonly interface: AppInterface;
  private readonly physics: Physics;
  private readonly storage: SimulationStorage;

  private readonly circles: Circle[];

  private readonly resizeObserver: ResizeObserver;

  private previousTime: number | null = null;
  private statsStartTime: number | null = null;
  private renderedFrames = 0;
  private activeCircleId: string | null = null;
  private accumulatedTime = 0;

  constructor(canvas: HTMLCanvasElement, root: HTMLElement) {
    this.renderer = new AppRender(canvas);
    this.physics = new Physics();
    this.storage = new SimulationStorage();

    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
    this.resizeCanvas();
    this.circles = Array.from({ length: INITIAL_CIRCLE_COUNT }, () =>
      this.createRandomCircle(this.renderer.width, this.renderer.height),
    );

    this.interface = new AppInterface(root, {
      onAddCircles: this.addRandomCircles,
      onReset: this.resetCircles,
      onSave: this.saveSimulation,
      onLoadSave: this.loadSimulation,
      onDeleteSave: this.deleteSave,
      onDeleteCircle: this.deleteCircle,
      onSelectCircle: this.selectCircle,
      onApplyCircle: this.applyCircleChanges,
    });

    this.interface.updateCircleCards(this.circles);
    this.interface.initSavesList(this.storage.getSavesList());
    this.interface.renderStats(this.circles.length, 0);
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

  private createRandomCircle(width: number, height: number): Circle {
    const radius = Math.round(
      randomBetween(MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS),
    );
    const speed = randomBetween(MIN_CIRCLE_SPEED, MAX_CIRCLE_SPEED);
    const direction = randomBetween(0, Math.PI * 2);

    return {
      id: crypto.randomUUID(),
      position: {
        x:
          width >= radius * 2
            ? randomBetween(radius, width - radius)
            : width / 2,
        y:
          height >= radius * 2
            ? randomBetween(radius, height - radius)
            : height / 2,
      },
      velocity: {
        x: Math.cos(direction) * speed,
        y: Math.sin(direction) * speed,
      },
      radius,
      color: createRandomColor(),
    };
  }

  private readonly addRandomCircles = (count: number): void => {
    const addedCircles: Circle[] = [];

    for (let circleIndex = 0; circleIndex < count; circleIndex += 1) {
      const circle = this.createRandomCircle(
        this.renderer.width,
        this.renderer.height,
      );

      this.circles.push(circle);
      addedCircles.push(circle);
    }

    this.interface.addCircleCards(addedCircles);
  };

  private readonly deleteCircle = (id: string): void => {
    const circleIndex = this.circles.findIndex((circle) => circle.id === id);

    if (circleIndex === -1) {
      return;
    }

    this.circles.splice(circleIndex, 1);
    if (this.activeCircleId === id) {
      this.activeCircleId = null;
      this.interface.setActiveCircle(undefined);
    }
    this.interface.removeCircleCard(this.circles);
  };

  private readonly resetCircles = (): void => {
    this.circles.splice(0);
    this.activeCircleId = null;
    this.interface.updateCircleCards([]);
  };

  private readonly saveSimulation = (): void => {
    const createdSave = this.storage.createSaveItem(this.circles);

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
    this.activeCircleId = null;
    this.interface.updateCircleCards(this.circles);
  };

  private readonly deleteSave = (id: string): void => {
    this.storage.deleteSaveItem(id);
    this.interface.removeSaveItem(id);
  };

  private readonly selectCircle = (id: string): void => {
    this.activeCircleId = this.activeCircleId === id ? null : id;
    const activeCircle = this.circles.find(
      (circle) => circle.id === this.activeCircleId,
    );
    this.interface.setActiveCircle(activeCircle);
  };

  private readonly applyCircleChanges = (
    id: string,
    editorData: CircleEditorData,
  ): void => {
    const circle = this.circles.find((item) => item.id === id);

    if (!circle) return;

    circle.radius = editorData.radius;
    const directionInRadians = (editorData.direction * Math.PI) / 180;

    circle.velocity.x = Math.cos(directionInRadians) * editorData.speed;
    circle.velocity.y = Math.sin(directionInRadians) * editorData.speed;
    circle.color = editorData.color;
    this.activeCircleId = null;
    this.interface.updateCircle(circle);
    this.interface.setActiveCircle(undefined);
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
    this.accumulatedTime += frameTime;

    while (this.accumulatedTime >= FIXED_TIME_STEP) {
      this.physics.update(
        this.circles,
        FIXED_TIME_STEP,
        this.renderer.width,
        this.renderer.height,
        this.activeCircleId,
      );
      this.accumulatedTime -= FIXED_TIME_STEP;
    }

    this.renderer.render(this.circles, this.activeCircleId, currentTime);
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

    this.interface.renderStats(this.circles.length, fps);
    this.statsStartTime = currentTime;
    this.renderedFrames = 0;
  }
}
