import type { Circle } from "../../data/types";
import {
  MAX_CIRCLE_RADIUS,
  MAX_VISIBLE_CIRCLE_CARDS,
} from "../../data/constants";
import {
  colorToCss,
  colorToInputValue,
  fitValueIntoRange,
} from "../../utils/utils";
import { createButton, createIcon } from "../../utils/domHelpers";

type CircleCardElements = {
  card: HTMLElement;
  previewCircle: HTMLElement;
  radius: HTMLElement;
  colorValue: HTMLElement;
};

export class CircleList {
  readonly root = document.createElement("div");

  private readonly cardsContainer = document.createElement("div");

  private readonly pageInput = document.createElement("input");
  private readonly totalPages = document.createElement("span");
  private readonly paginationRoot = document.createElement("label");
  private currentPage = 1;

  private readonly onSelect: (id: string) => void;
  private readonly onDelete: (id: string) => void;

  private circleItems: Circle[] = [];
  private activeCircleId: string | null = null;

  private readonly cards = new Map<string, CircleCardElements>();

  constructor(onSelect: (id: string) => void, onDelete: (id: string) => void) {
    this.onSelect = onSelect;
    this.onDelete = onDelete;

    this.root.className = "circle-list";
    this.root.hidden = true;

    this.cardsContainer.className = "circle-cards";
    this.cardsContainer.addEventListener("click", this.handleCardsClick);

    this.paginationRoot.className = "circle-pagination";
    this.paginationRoot.hidden = true;

    this.pageInput.type = "number";
    this.pageInput.min = "1";
    this.pageInput.step = "1";
    this.pageInput.value = "1";
    this.pageInput.className = "circle-pagination__input";
    this.pageInput.addEventListener("change", this.changePage);

    this.paginationRoot.append(
      "Страница ",
      this.pageInput,
      " из ",
      this.totalPages,
    );
    this.root.append(this.cardsContainer, this.paginationRoot);
  }

  setCircles(circles: Circle[]): void {
    this.activeCircleId = null;
    this.currentPage = 1;
    this.circleItems = [...circles];
    this.renderPage();
  }

  addCircles(circles: Circle[]): void {
    for (const circle of circles) {
      this.circleItems.push(circle);
    }
    this.renderPage();
  }

  updateAfterRemoval(circles: Circle[]): void {
    this.circleItems = [...circles];
    this.currentPage = Math.min(this.currentPage, this.getPagesCount());
    this.renderPage();
  }

  setActiveCircle(id: string | null): void {
    if (this.activeCircleId) {
      this.cards
        .get(this.activeCircleId)
        ?.card.classList.remove("circle-card--active");
    }
    this.activeCircleId = id;
    if (id) this.cards.get(id)?.card.classList.add("circle-card--active");
  }

  updateCircle(circle: Circle): void {
    const elements = this.cards.get(circle.id);
    if (elements) this.updateCircleCard(elements, circle);
  }

  private readonly handleCardsClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const actionElement = target.closest<HTMLElement>("[data-circle-action]");
    if (!actionElement) return;

    const card = actionElement.closest<HTMLElement>("[data-circle-id]");
    if (!card) return;

    const id = card.dataset["circleId"];
    if (!id) return;

    switch (actionElement.dataset["circleAction"]) {
      case "delete":
        this.onDelete(id);
        break;
      case "select":
        this.onSelect(id);
        break;
    }
  };

  private readonly changePage = (): void => {
    const requestedPage = Math.floor(Number(this.pageInput.value) || 1);
    this.currentPage = fitValueIntoRange(
      requestedPage,
      1,
      this.getPagesCount(),
    );
    this.renderPage();
  };

  private getPagesCount(): number {
    return Math.max(
      1,
      Math.ceil(this.circleItems.length / MAX_VISIBLE_CIRCLE_CARDS),
    );
  }

  private renderPage(): void {
    const startIndex = (this.currentPage - 1) * MAX_VISIBLE_CIRCLE_CARDS;
    const pageCircles = this.circleItems.slice(
      startIndex,
      startIndex + MAX_VISIBLE_CIRCLE_CARDS,
    );

    this.cards.clear();
    const fragment = document.createDocumentFragment();

    for (const circle of pageCircles) {
      const elements = this.createCircleCard(circle.id);
      this.cards.set(circle.id, elements);
      this.updateCircleCard(elements, circle);

      if (circle.id === this.activeCircleId) {
        elements.card.classList.add("circle-card--active");
      }
      fragment.append(elements.card);
    }
    this.cardsContainer.replaceChildren(fragment);

    const pagesCount = this.getPagesCount();
    const hasPagination = pagesCount > 1;

    this.root.hidden = this.circleItems.length === 0;
    this.paginationRoot.hidden = !hasPagination;

    if (hasPagination) {
      this.pageInput.value = String(this.currentPage);
      this.pageInput.max = String(pagesCount);
      this.totalPages.textContent = String(pagesCount);
    }
    this.cardsContainer.scrollTop = 0;
  }

  private createCircleCard(id: string): CircleCardElements {
    const card = document.createElement("div");
    card.className = "circle-card";
    card.dataset["circleId"] = id;
    card.dataset["circleAction"] = "select";
    const preview = document.createElement("div");
    preview.className = "circle-preview";
    const previewCircle = document.createElement("div");
    previewCircle.className = "circle-preview__shape";
    preview.append(previewCircle);
    const info = document.createElement("div");
    info.className = "circle-info";
    const radius = document.createElement("span");
    const colorValue = document.createElement("span");
    radius.className = "circle-info__value";
    colorValue.className = "circle-info__value";
    info.append(
      this.createInfoRow("Радиус:", radius),
      this.createInfoRow("Цвет:", colorValue),
    );
    const deleteButton = createButton("", "delete-circle-button");
    deleteButton.dataset["circleAction"] = "delete";
    deleteButton.append(createIcon("icon icon--close"));
    card.append(preview, info, deleteButton);
    return { card, previewCircle, radius, colorValue };
  }

  private updateCircleCard(elements: CircleCardElements, circle: Circle): void {
    const previewPercent = fitValueIntoRange(
      (circle.radius / MAX_CIRCLE_RADIUS) * 100,
      8,
      100,
    );
    const previewSize = `${previewPercent}%`;
    elements.previewCircle.style.width = previewSize;
    elements.previewCircle.style.height = previewSize;
    elements.previewCircle.style.backgroundColor = colorToCss(circle.color);
    elements.radius.textContent = `${circle.radius} px`;
    elements.colorValue.textContent = colorToInputValue(
      circle.color,
    ).toUpperCase();
  }

  private createInfoRow(label: string, value: HTMLElement): HTMLElement {
    const row = document.createElement("div");
    row.className = "circle-info__row";
    const labelElement = document.createElement("span");
    labelElement.className = "circle-info__label";
    labelElement.textContent = label;
    row.append(labelElement, value);
    return row;
  }

}
