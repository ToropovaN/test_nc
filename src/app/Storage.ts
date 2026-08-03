import type { Circle, Color, SimulationSave } from "../data/types";

const STORAGE_KEY = "circle-simulation-saves";

function isColorChannel(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 255
  );
}

function parseColor(value: unknown): Color | undefined {
  if (!value || typeof value !== "object") return undefined;

  const color = value as Partial<Color>;
  if (
    !isColorChannel(color.r) ||
    !isColorChannel(color.g) ||
    !isColorChannel(color.b)
  ) {
    return undefined;
  }

  return { r: color.r, g: color.g, b: color.b };
}

function parseCircle(value: unknown): Circle | undefined {
  if (!value || typeof value !== "object") return undefined;

  const circle = value as Partial<Circle>;
  const position = circle.position;
  const velocity = circle.velocity;
  const color = parseColor(circle.color);

  if (
    typeof circle.id !== "string" ||
    !position ||
    !velocity ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    !Number.isFinite(velocity.x) ||
    !Number.isFinite(velocity.y) ||
    typeof circle.radius !== "number" ||
    !Number.isFinite(circle.radius) ||
    !color
  ) {
    return undefined;
  }

  return {
    id: circle.id,
    position: { x: position.x, y: position.y },
    velocity: { x: velocity.x, y: velocity.y },
    radius: circle.radius,
    color,
  };
}

export class SimulationStorage {
  getSavesList(): SimulationSave[] {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];

    try {
      const storedSaves: unknown = JSON.parse(storedValue);
      if (!Array.isArray(storedSaves)) return [];

      const saves: SimulationSave[] = [];

      for (const item of storedSaves) {
        if (!item || typeof item !== "object") continue;

        const storedSave = item as Partial<SimulationSave>;

        if (
          typeof storedSave.id !== "string" ||
          typeof storedSave.name !== "string" ||
          !Array.isArray(storedSave.circles)
        ) {
          continue;
        }

        const circles = storedSave.circles
          .map((circle) => parseCircle(circle))
          .filter((circle): circle is Circle => circle !== undefined);

        saves.push({
          id: storedSave.id,
          name: storedSave.name,
          circles,
        });
      }

      return saves;
    } catch {
      return [];
    }
  }

  createSaveItem(circles: Circle[]): SimulationSave {
    const now = new Date();
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
    const save: SimulationSave = {
      id: crypto.randomUUID(),
      name: `${now.toLocaleString("ru-RU")}.${milliseconds}`,
      circles: circles,
    };
    const saves = [save, ...this.getSavesList()];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));

    return save;
  }

  getSaveItemById(id: string): SimulationSave | undefined {
    return this.getSavesList().find((save) => save.id === id);
  }

  deleteSaveItem(id: string): SimulationSave[] {
    const saves = this.getSavesList().filter((save) => save.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));

    return saves;
  }
}
