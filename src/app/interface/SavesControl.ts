import type { SimulationSave } from "../../data/types";
import { createButton, createIcon } from "../../utils/domHelpers";

export class SavesControl {
  readonly root = document.createElement("div");
  readonly toast = document.createElement("div");

  private readonly loadButton = createButton(
    "Загрузить",
    "control-button control-button--load",
  );

  private readonly dropdown = document.createElement("div");
  private readonly emptyMessage = document.createElement("p");
  private readonly saveItems = new Map<string, HTMLElement>();

  private readonly onLoad: (id: string) => void;
  private readonly onDelete: (id: string) => void;

  private toastTimer: number | null = null;

  constructor(onLoad: (id: string) => void, onDelete: (id: string) => void) {
    this.onLoad = onLoad;
    this.onDelete = onDelete;

    this.root.className = "load-control";

    this.dropdown.className = "saves-dropdown";
    this.dropdown.hidden = true;
    this.dropdown.addEventListener("click", this.handleClick);
    this.loadButton.addEventListener("click", this.toggleDropdown);
    document.addEventListener("pointerdown", this.handleDocumentPointerDown);

    this.emptyMessage.className = "saves-dropdown__empty";
    this.emptyMessage.textContent = "Сохранений пока нет";

    this.toast.className = "save-toast";

    this.root.append(this.loadButton, this.dropdown);
  }

  setSaves(saves: SimulationSave[]): void {
    this.dropdown.replaceChildren();
    this.saveItems.clear();
    if (saves.length === 0) {
      this.showEmptyMessage();
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const save of saves) {
      fragment.append(this.createSaveItem(save));
    }
    this.dropdown.append(fragment);
  }

  add(save: SimulationSave): void {
    if (this.saveItems.size === 0) this.dropdown.replaceChildren();
    this.dropdown.prepend(this.createSaveItem(save));
  }

  remove(id: string): void {
    const item = this.saveItems.get(id);
    if (!item) return;
    item.remove();
    this.saveItems.delete(id);
    if (this.saveItems.size === 0) this.showEmptyMessage();
  }

  showNotification(saveName: string): void {
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toast.textContent = `Сохранено — ${saveName}`;
    this.toast.classList.add("save-toast--visible");
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove("save-toast--visible");
      this.toastTimer = null;
    }, 2000);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest<HTMLButtonElement>(
      "button[data-save-action]",
    );
    if (!button) return;

    const item = button.closest<HTMLElement>("[data-save-id]");
    const id = item?.dataset["saveId"];
    if (!id) return;

    switch (button.dataset["saveAction"]) {
      case "delete":
        this.onDelete(id);
        break;
      case "load":
        this.onLoad(id);
        this.setDropdownOpen(false);
        break;
    }
  };

  private readonly handleDocumentPointerDown = (event: PointerEvent): void => {
    if (this.dropdown.hidden) return;

    const target = event.target;
    if (target instanceof Node && !this.root.contains(target)) {
      this.setDropdownOpen(false);
    }
  };

  private readonly toggleDropdown = (): void => {
    this.setDropdownOpen(this.dropdown.hidden === true);
  };

  private setDropdownOpen(isOpen: boolean): void {
    this.dropdown.hidden = !isOpen;
    this.loadButton.classList.toggle("control-button--open", isOpen);
  }

  private showEmptyMessage(): void {
    this.dropdown.replaceChildren(this.emptyMessage);
  }

  private createSaveItem(save: SimulationSave): HTMLElement {
    const item = document.createElement("div");
    item.className = "save-item";
    item.dataset["saveId"] = save.id;
    const loadButton = createButton(save.name, "save-item__load");
    loadButton.dataset["saveAction"] = "load";
    const deleteButton = createButton("", "save-item__delete");
    deleteButton.dataset["saveAction"] = "delete";
    deleteButton.append(createIcon("icon icon--close"));
    item.append(loadButton, deleteButton);
    this.saveItems.set(save.id, item);
    return item;
  }

}
