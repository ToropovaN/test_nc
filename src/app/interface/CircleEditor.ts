import type { SimulationConfig } from "../../data/types";
import {
  DEFAULT_EDITOR_COLOR,
  INITIAL_CIRCLE_COUNT,
  MAX_CIRCLE_RADIUS,
  MAX_CIRCLE_SPEED,
  MIN_CIRCLE_RADIUS,
  MIN_CIRCLE_SPEED,
} from "../../data/constants";
import {
  colorFromInputValue,
  colorToInputValue,
  fitValueIntoRange,
} from "../../utils/utils";
import { createButton, createIcon } from "../../utils/domHelpers";

type CircleEditorView = {
  previewCircle: HTMLElement;
  radiusInput: HTMLInputElement;
  radiusOutput: HTMLOutputElement;
  speedInput: HTMLInputElement;
  speedOutput: HTMLOutputElement;
  restitutionInput: HTMLInputElement;
  restitutionOutput: HTMLOutputElement;
  colorInput: HTMLInputElement;
  colorOutput: HTMLOutputElement;
  directionDial: HTMLButtonElement;
  directionDialArrow: HTMLElement;
  directionOutput: HTMLOutputElement;
  quantityInput: HTMLInputElement;
  decreaseQuantityButton: HTMLButtonElement;
  increaseQuantityButton: HTMLButtonElement;
};

export class CircleEditor {
  readonly root = document.createElement("fieldset");

  private readonly view: CircleEditorView;

  constructor() {
    this.root.className = "circle-editor";

    this.view = {
      previewCircle: document.createElement("div"),
      radiusInput: document.createElement("input"),
      radiusOutput: document.createElement("output"),
      speedInput: document.createElement("input"),
      speedOutput: document.createElement("output"),
      restitutionInput: document.createElement("input"),
      restitutionOutput: document.createElement("output"),
      colorInput: document.createElement("input"),
      colorOutput: document.createElement("output"),
      directionDial: createButton("", "direction-dial"),
      directionDialArrow: document.createElement("span"),
      directionOutput: document.createElement("output"),
      quantityInput: document.createElement("input"),
      decreaseQuantityButton: createButton("", "quantity-button"),
      increaseQuantityButton: createButton("", "quantity-button"),
    };

    const editorForm = document.createElement("div");
    editorForm.className = "circle-editor__form";

    const editorPreview = document.createElement("div");
    editorPreview.className = "circle-editor__preview";
    this.view.previewCircle.className = "circle-preview__shape";
    editorPreview.append(this.view.previewCircle);

    const previewSection = document.createElement("div");
    previewSection.className = "circle-editor__preview-section";
    const previewLabel = document.createElement("span");
    previewLabel.className = "circle-editor__section-label";
    previewLabel.textContent = "Превью";

    const quantityLabel = document.createElement("label");
    quantityLabel.className = "circle-editor__quantity-label";
    quantityLabel.textContent = "Количество объектов";

    this.view.quantityInput.type = "number";
    this.view.quantityInput.className = "circle-quantity-input";
    this.view.quantityInput.min = "1";
    this.view.quantityInput.step = "1";
    this.view.quantityInput.addEventListener("change", this.normalizeQuantity);

    this.view.decreaseQuantityButton.append(createIcon("icon icon--minus"));
    this.view.decreaseQuantityButton.addEventListener("click", () => {
      this.view.quantityInput.stepDown();
      this.normalizeQuantity();
    });
    this.view.increaseQuantityButton.append(createIcon("icon icon--plus"));
    this.view.increaseQuantityButton.addEventListener("click", () => {
      this.view.quantityInput.stepUp();
      this.normalizeQuantity();
    });

    const quantityStepper = document.createElement("div");
    quantityStepper.className = "quantity-stepper";
    quantityStepper.append(
      this.view.decreaseQuantityButton,
      this.view.quantityInput,
      this.view.increaseQuantityButton,
    );
    quantityLabel.append(quantityStepper);
    previewSection.append(previewLabel, editorPreview, quantityLabel);

    this.setupRangeInput(
      this.view.radiusInput,
      MIN_CIRCLE_RADIUS,
      MAX_CIRCLE_RADIUS,
      1,
    );
    const radiusEditor = this.createEditorField(
      "Радиус",
      this.view.radiusInput,
      this.view.radiusOutput,
    );

    this.setupRangeInput(
      this.view.speedInput,
      MIN_CIRCLE_SPEED,
      MAX_CIRCLE_SPEED,
      1,
    );
    const speedEditor = this.createEditorField(
      "Скорость",
      this.view.speedInput,
      this.view.speedOutput,
    );

    this.setupRangeInput(this.view.restitutionInput, 0, 1, 0.01);
    const restitutionEditor = this.createEditorField(
      "Упругость",
      this.view.restitutionInput,
      this.view.restitutionOutput,
    );

    this.view.colorInput.type = "color";
    this.view.colorInput.className = "color-input";
    const colorInfo = this.createEditorValue("Цвет:", this.view.colorOutput);

    this.view.directionDialArrow.className =
      "icon icon--direction direction-dial__arrow";
    this.view.directionDial.append(this.view.directionDialArrow);
    const directionInfo = this.createEditorValue(
      "Направление:",
      this.view.directionOutput,
    );

    this.view.radiusInput.addEventListener("input", this.updateRadiusOutput);
    this.view.speedInput.addEventListener("input", this.updateSpeedOutput);
    this.view.restitutionInput.addEventListener(
      "input",
      this.updateRestitutionOutput,
    );
    this.view.colorInput.addEventListener("input", this.updateColorOutput);
    this.setupDirectionDial(this.view.directionDial);

    const editorFields = document.createElement("div");
    editorFields.className = "circle-editor__fields";

    const directionControl = document.createElement("div");
    directionControl.className = "circle-editor__round-control";
    directionControl.append(directionInfo, this.view.directionDial);

    const colorControl = document.createElement("div");
    colorControl.className = "circle-editor__round-control";
    const colorInputFrame = document.createElement("div");
    colorInputFrame.className = "color-input-frame";
    colorInputFrame.append(this.view.colorInput);
    colorControl.append(colorInfo, colorInputFrame);

    const editorBottomControls = document.createElement("div");
    editorBottomControls.className = "circle-editor__bottom-controls";
    editorBottomControls.append(directionControl, colorControl);
    editorFields.append(
      radiusEditor,
      speedEditor,
      restitutionEditor,
      editorBottomControls,
    );
    editorForm.append(editorFields, previewSection);
    this.root.append(editorForm);

    this.setConfig({
      radius: MAX_CIRCLE_RADIUS / 2,
      speed: MAX_CIRCLE_SPEED / 2,
      direction: 90,
      color: DEFAULT_EDITOR_COLOR,
      restitution: 1,
      objectCount: INITIAL_CIRCLE_COUNT,
    });
  }

  getConfig(): SimulationConfig {
    this.normalizeQuantity();

    return {
      radius: Number(this.view.radiusInput.value),
      speed: Number(this.view.speedInput.value),
      direction: Number(this.view.directionDial.dataset["direction"] ?? 0),
      color: colorFromInputValue(this.view.colorInput.value),
      restitution: Number(this.view.restitutionInput.value),
      objectCount: Number(this.view.quantityInput.value),
    };
  }

  setConfig(config: SimulationConfig): void {
    this.view.radiusInput.value = String(config.radius);
    this.view.speedInput.value = String(config.speed);
    this.view.colorInput.value = colorToInputValue(config.color);
    this.view.restitutionInput.value = String(config.restitution);
    this.view.quantityInput.value = String(config.objectCount);
    this.setDirection(config.direction);
    this.updateRadiusOutput();
    this.updateSpeedOutput();
    this.updateRestitutionOutput();
    this.updateColorOutput();
    this.normalizeQuantity();
  }

  setDisabled(disabled: boolean): void {
    this.root.disabled = disabled;
    this.root.classList.toggle("circle-editor--disabled", disabled);
  }

  private setupRangeInput(
    input: HTMLInputElement,
    min: number,
    max: number,
    step: number,
  ): void {
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
  }

  private readonly normalizeQuantity = (): void => {
    const quantity = Math.max(
      1,
      Math.floor(Number(this.view.quantityInput.value) || 1),
    );
    this.view.quantityInput.value = String(quantity);
  };

  private setupDirectionDial(dial: HTMLButtonElement): void {
    let dragBounds: DOMRect | null = null;

    const updateFromPointer = (event: PointerEvent): void => {
      if (!dragBounds) return;

      const x = event.clientX - (dragBounds.left + dragBounds.width / 2);
      const y = event.clientY - (dragBounds.top + dragBounds.height / 2);
      const direction = (Math.atan2(y, x) * 180) / Math.PI;
      this.setDirection((direction + 360) % 360);
    };

    dial.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      dial.classList.add("direction-dial--dragging");
      dial.setPointerCapture(event.pointerId);
      dragBounds = dial.getBoundingClientRect();
      updateFromPointer(event);
    });
    dial.addEventListener("pointermove", (event) => {
      if (dial.hasPointerCapture(event.pointerId)) updateFromPointer(event);
    });
    const finishDragging = (): void => {
      dragBounds = null;
      dial.classList.remove("direction-dial--dragging");
    };
    dial.addEventListener("pointerup", finishDragging);
    dial.addEventListener("pointercancel", finishDragging);
    dial.addEventListener("lostpointercapture", finishDragging);
  }

  private readonly updateRadiusOutput = (): void => {
    const radius = Number(this.view.radiusInput.value);
    const previewSize = this.getPreviewSize(radius);
    this.view.radiusOutput.value = `${radius} px`;
    this.view.previewCircle.style.width = previewSize;
    this.view.previewCircle.style.height = previewSize;
  };

  private readonly updateSpeedOutput = (): void => {
    this.view.speedOutput.value = `${this.view.speedInput.value} px/s`;
  };

  private readonly updateRestitutionOutput = (): void => {
    this.view.restitutionOutput.value = Number(
      this.view.restitutionInput.value,
    ).toFixed(2);
  };

  private readonly updateColorOutput = (): void => {
    const color = this.view.colorInput.value;
    this.view.colorOutput.value = color.toUpperCase();
    this.view.previewCircle.style.backgroundColor = color;
  };

  private setDirection(direction: number): void {
    this.view.directionDial.dataset["direction"] = String(direction);
    this.view.directionDialArrow.style.transform = `rotate(${direction}deg)`;
    this.view.directionOutput.value = `${Math.round(direction)}°`;
  }

  private getPreviewSize(radius: number): string {
    const previewPercent = fitValueIntoRange(
      (radius / MAX_CIRCLE_RADIUS) * 100,
      3,
      100,
    );
    return `${previewPercent}%`;
  }

  private createEditorField(
    labelText: string,
    control: HTMLInputElement,
    output: HTMLOutputElement,
  ): HTMLElement {
    const field = document.createElement("label");
    field.className = "editor-field";
    const text = document.createElement("span");
    text.className = "editor-field__label";
    text.textContent = labelText;
    field.append(text, control, output);
    return field;
  }

  private createEditorValue(
    labelText: string,
    output: HTMLOutputElement,
  ): HTMLElement {
    const row = document.createElement("div");
    row.className = "editor-value";
    const label = document.createElement("span");
    label.textContent = labelText;
    row.append(label, output);
    return row;
  }
}
