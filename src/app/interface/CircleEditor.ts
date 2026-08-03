import type { Circle, CircleEditorData } from "../../data/types";
import {
  DEFAULT_EDITOR_COLOR,
  MAX_CIRCLE_RADIUS,
  MAX_CIRCLE_SPEED,
  MIN_CIRCLE_RADIUS,
  MIN_CIRCLE_SPEED,
} from "../../data/constants";
import {
  colorFromInputValue,
  colorToCss,
  colorToInputValue,
  fitValueIntoRange,
} from "../../utils/utils";
import { createButton } from "../../utils/domHelpers";

type CircleEditorView = {
  previewCircle: HTMLElement;
  radiusInput: HTMLInputElement;
  radiusOutput: HTMLOutputElement;
  speedInput: HTMLInputElement;
  speedOutput: HTMLOutputElement;
  colorInput: HTMLInputElement;
  colorOutput: HTMLOutputElement;
  directionDial: HTMLButtonElement;
  directionDialArrow: HTMLElement;
  directionOutput: HTMLOutputElement;
  applyButton: HTMLButtonElement;
};

export class CircleEditor {
  readonly root = document.createElement("section");

  private readonly view: CircleEditorView;
  private readonly onApply: (id: string, data: CircleEditorData) => void;
  private activeCircleId: string | null = null;

  constructor(onApply: (id: string, data: CircleEditorData) => void) {
    this.onApply = onApply;

    this.root.className = "circle-editor";

    this.view = {
      previewCircle: document.createElement("div"),
      radiusInput: document.createElement("input"),
      radiusOutput: document.createElement("output"),
      speedInput: document.createElement("input"),
      speedOutput: document.createElement("output"),
      colorInput: document.createElement("input"),
      colorOutput: document.createElement("output"),
      directionDial: createButton("", "direction-dial"),
      directionDialArrow: document.createElement("span"),
      directionOutput: document.createElement("output"),
      applyButton: createButton("Сохранить", "circle-editor__apply"),
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
    previewSection.append(previewLabel, editorPreview);

    this.view.radiusInput.type = "range";
    this.view.radiusInput.min = String(MIN_CIRCLE_RADIUS);
    this.view.radiusInput.max = String(MAX_CIRCLE_RADIUS);
    this.view.radiusInput.step = "1";
    const radiusEditor = this.createEditorField(
      "Радиус",
      this.view.radiusInput,
    );
    radiusEditor.append(this.view.radiusOutput);

    this.view.speedInput.type = "range";
    this.view.speedInput.min = String(MIN_CIRCLE_SPEED);
    this.view.speedInput.max = String(MAX_CIRCLE_SPEED);
    this.view.speedInput.step = "1";
    const speedEditor = this.createEditorField(
      "Скорость",
      this.view.speedInput,
    );
    speedEditor.append(this.view.speedOutput);

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

    this.view.applyButton.addEventListener("click", this.applyChanges);
    this.view.radiusInput.addEventListener("input", this.updateRadiusOutput);
    this.view.speedInput.addEventListener("input", this.updateSpeedOutput);
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
    editorFields.append(radiusEditor, speedEditor, editorBottomControls);
    editorForm.append(editorFields, previewSection, this.view.applyButton);
    this.root.append(editorForm);

    this.setCircle(undefined);
  }

  setCircle(circle: Circle | undefined): void {
    this.activeCircleId = circle?.id ?? null;
    const isEmpty = !circle;
    this.root.classList.toggle("circle-editor--empty", isEmpty);
    this.view.radiusInput.disabled = isEmpty;
    this.view.speedInput.disabled = isEmpty;
    this.view.colorInput.disabled = isEmpty;
    this.view.directionDial.disabled = isEmpty;
    this.view.applyButton.disabled = isEmpty;

    if (isEmpty) {
      this.view.colorInput.value = colorToInputValue(DEFAULT_EDITOR_COLOR);
      this.view.radiusOutput.value = "";
      this.view.speedOutput.value = "";
      this.view.directionOutput.value = "";
      this.view.colorOutput.value = "";
      this.view.previewCircle.style.width = "64%";
      this.view.previewCircle.style.height = "64%";
      this.view.previewCircle.style.backgroundColor =
        colorToCss(DEFAULT_EDITOR_COLOR);
      return;
    }

    const speed = Math.hypot(circle.velocity.x, circle.velocity.y);
    const direction =
      (Math.atan2(circle.velocity.y, circle.velocity.x) * 180) / Math.PI;
    this.view.radiusInput.value = String(circle.radius);
    this.view.speedInput.value = String(Math.round(speed));
    this.view.colorInput.value = colorToInputValue(circle.color);

    this.setDirection((direction + 360) % 360);
    this.updateRadiusOutput();
    this.updateSpeedOutput();
    this.updateColorOutput();
  }

  private readonly applyChanges = (): void => {
    if (!this.activeCircleId) return;

    this.onApply(this.activeCircleId, {
      radius: Number(this.view.radiusInput.value),
      speed: Number(this.view.speedInput.value),
      direction: Number(this.view.directionDial.dataset["direction"] ?? 0),
      color: colorFromInputValue(this.view.colorInput.value),
    });
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
      8,
      100,
    );
    return `${previewPercent}%`;
  }

  private createEditorField(
    labelText: string,
    control: HTMLInputElement,
  ): HTMLElement {
    const field = document.createElement("label");
    field.className = "editor-field";
    const text = document.createElement("span");
    text.className = "editor-field__label";
    text.textContent = labelText;
    field.append(text, control);
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
