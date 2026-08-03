import type {
  SimulationConfig,
  SimulationSave,
  SimulationStats as SimulationStatsData,
} from "../../data/types";
import { CircleEditor } from "./CircleEditor";
import { SavesControl } from "./SavesControl";
import { SimulationStats } from "./SimulationStats";
import { createButton } from "../../utils/domHelpers";

type InterfaceActions = {
  onStart: (config: SimulationConfig) => void;
  onReset: () => void;
  onSave: () => void;
  onLoadSave: (id: string) => void;
  onDeleteSave: (id: string) => void;
};

export class AppInterface {
  private readonly saves: SavesControl;
  private readonly stats: SimulationStats;
  private readonly editor: CircleEditor;
  private readonly startButton: HTMLButtonElement;

  constructor(root: HTMLElement, actions: InterfaceActions) {
    const controls = document.createElement("aside");
    controls.id = "simulationControls";

    const toolbar = document.createElement("div");
    toolbar.className = "controls-toolbar";

    const saveButton = createButton(
      "Сохранить",
      "control-button control-button--save",
    );
    saveButton.addEventListener("click", actions.onSave);

    this.saves = new SavesControl(actions.onLoadSave, actions.onDeleteSave);

    const resetButton = createButton(
      "Сброс",
      "control-button control-button--reset",
    );
    resetButton.addEventListener("click", () => {
      actions.onReset();
      this.setRunning(false);
    });

    toolbar.append(saveButton, this.saves.root, resetButton);

    this.stats = new SimulationStats();
    this.editor = new CircleEditor();
    this.startButton = createButton(
      "Запустить симуляцию",
      "start-simulation-button",
    );
    this.startButton.addEventListener("click", () => {
      actions.onStart(this.editor.getConfig());
      this.setRunning(true);
    });

    controls.append(toolbar, this.editor.root, this.startButton);
    root.append(controls, this.stats.root, this.saves.toast);
  }

  renderStats(stats: SimulationStatsData): void {
    this.stats.render(stats);
  }

  showSaveNotification(saveName: string): void {
    this.saves.showNotification(saveName);
  }

  initSavesList(saves: SimulationSave[]): void {
    this.saves.setSaves(saves);
  }

  addSaveItem(save: SimulationSave): void {
    this.saves.add(save);
  }

  removeSaveItem(id: string): void {
    this.saves.remove(id);
  }

  setConfig(config: SimulationConfig): void {
    this.editor.setConfig(config);
  }

  setRunning(running: boolean): void {
    this.editor.setDisabled(running);
    this.startButton.disabled = running;
  }
}
