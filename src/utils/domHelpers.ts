export function createButton(
  label: string,
  className: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

export function createIcon(className: string): HTMLElement {
  const icon = document.createElement("span");
  icon.className = className;
  return icon;
}
