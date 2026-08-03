import type { SimulationStats as SimulationStatsData } from "../../data/types";

export class SimulationStats {
  readonly root = document.createElement("div");

  private readonly fpsValue: HTMLElement;
  private readonly physicsUpdatesPerSecondValue: HTMLElement;
  private readonly collisionsPerSecondValue: HTMLElement;

  constructor() {
    this.root.className = "simulation-stats";
    this.fpsValue = this.createStat("FPS");
    this.physicsUpdatesPerSecondValue = this.createStat("Физика");
    this.collisionsPerSecondValue = this.createStat("Столкновения");
  }

  render(stats: SimulationStatsData): void {
    this.fpsValue.textContent = String(stats.fps);
    this.physicsUpdatesPerSecondValue.textContent =
      `${stats.physicsUpdatesPerSecond} / сек`;
    this.collisionsPerSecondValue.textContent =
      `${stats.collisionsPerSecond} / сек`;
  }

  private createStat(label: string): HTMLElement {
    const stat = document.createElement("div");
    stat.className = "simulation-stat";
    const name = document.createElement("span");
    name.className = "simulation-stat__label";
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = "0";
    stat.append(name, value);
    this.root.append(stat);
    return value;
  }
}
