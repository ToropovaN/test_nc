import type {
  Circle,
  CircleEditorData,
  SimulationSave,
} from "../../data/types";
import { CircleEditor } from "./CircleEditor";
import { CircleList } from "./CircleList";
import { SavesControl } from "./SavesControl";
import { SimulationStats } from "./SimulationStats";
import { createButton, createIcon } from "../../utils/domHelpers";

type InterfaceActions = {
  onAddCircles: (count: number) => void;
  onReset: () => void;
  onSave: () => void;
  onLoadSave: (id: string) => void;
  onDeleteSave: (id: string) => void;
  onDeleteCircle: (id: string) => void;
  onSelectCircle: (id: string) => void;
  onApplyCircle: (id: string, editorData: CircleEditorData) => void;
};

export class AppInterface {
  private readonly saves: SavesControl;
  private readonly stats: SimulationStats;
  private readonly editor: CircleEditor;
  private readonly circleList: CircleList;

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
    resetButton.addEventListener("click", actions.onReset);

    toolbar.append(saveButton, this.saves.root, resetButton);

    this.stats = new SimulationStats();

    this.editor = new CircleEditor(actions.onApplyCircle);

    this.circleList = new CircleList(
      actions.onSelectCircle,
      actions.onDeleteCircle,
    );

    const addCirclesControl = this.createAddCirclesControl(
      actions.onAddCircles,
    );

    controls.append(
      toolbar,
      this.editor.root,
      this.circleList.root,
      addCirclesControl,
    );

    root.append(controls, this.stats.root, this.saves.toast);
  }

  renderStats(circleCount: number, fps: number): void {
    this.stats.render(circleCount, fps);
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

  updateCircleCards(circles: Circle[]): void {
    this.editor.setCircle(undefined);
    this.circleList.setCircles(circles);
  }

  addCircleCards(circles: Circle[]): void {
    this.circleList.addCircles(circles);
  }

  removeCircleCard(circles: Circle[]): void {
    this.circleList.updateAfterRemoval(circles);
  }

  setActiveCircle(circle: Circle | undefined): void {
    this.circleList.setActiveCircle(circle?.id ?? null);
    this.editor.setCircle(circle);
  }

  updateCircle(circle: Circle): void {
    this.circleList.updateCircle(circle);
  }

  private createAddCirclesControl(onAdd: (count: number) => void): HTMLElement {
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.className = "circle-quantity-input";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.value = "1";

    const normalizeQuantity = (): number => {
      const quantity = Math.max(
        1,
        Math.floor(Number(quantityInput.value) || 1),
      );
      quantityInput.value = String(quantity);
      return quantity;
    };
    quantityInput.addEventListener("change", normalizeQuantity);

    const decreaseButton = createButton("", "quantity-button");
    decreaseButton.append(createIcon("icon icon--minus"));
    decreaseButton.addEventListener("click", () => quantityInput.stepDown());

    const increaseButton = createButton("", "quantity-button");
    increaseButton.append(createIcon("icon icon--plus"));
    increaseButton.addEventListener("click", () => quantityInput.stepUp());

    const quantityStepper = document.createElement("div");
    quantityStepper.className = "quantity-stepper";
    quantityStepper.append(decreaseButton, quantityInput, increaseButton);
    const addButton = createButton("Добавить круги", "add-circle-button");
    addButton.addEventListener("click", () => onAdd(normalizeQuantity()));
    const root = document.createElement("div");
    root.className = "add-circles-control";
    root.append(quantityStepper, addButton);
    return root;
  }

}
