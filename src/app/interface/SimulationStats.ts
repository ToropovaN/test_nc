export class SimulationStats {
  readonly root = document.createElement("div");

  private readonly circleCountValue: HTMLElement;
  private readonly fpsValue: HTMLElement;

  constructor() {
    this.root.className = "simulation-stats";
    this.circleCountValue = this.createStat("Кругов");
    this.fpsValue = this.createStat("FPS");
  }

  render(circleCount: number, fps: number): void {
    this.circleCountValue.textContent = String(circleCount);
    this.fpsValue.textContent = String(fps);
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
