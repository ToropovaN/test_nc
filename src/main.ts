import "./style.css";
import { App } from "./app/App";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Не найден элемент #app");
}

const canvas = document.createElement("canvas");
canvas.id = "appCanvas";

root.append(canvas);

new App(canvas, root);
