import type { Circle, SimulationConfig } from "../data/types";
import { SAME_CENTER_COLLISION_NORMAL } from "../data/constants";

export class Physics {
  private readonly grid = new Map<number, number[]>();
  private columnCount = 1;
  private rowCount = 1;

  update(
    circles: Circle[],
    config: SimulationConfig,
    deltaTime: number,
    width: number,
    height: number,
  ): number {
    for (const circle of circles) {
      circle.position.x += circle.velocity.x * deltaTime;
      circle.position.y += circle.velocity.y * deltaTime;
    }

    for (const circle of circles) {
      this.resolveCanvasCollision(
        circle,
        config.radius,
        config.restitution,
        width,
        height,
      );
    }

    const collisionCount = this.resolveCircleCollisions(
      circles,
      config,
      width,
      height,
    );

    return collisionCount;
  }

  private resolveCircleCollisions(
    circles: Circle[],
    config: SimulationConfig,
    width: number,
    height: number,
  ): number {
    this.rebuildGrid(circles, config.radius, width, height);

    let collisionCount = 0;

    for (const [cellKey, circleIndices] of this.grid) {
      const cellX = cellKey % this.columnCount;
      const cellY = Math.floor(cellKey / this.columnCount);

      for (const firstIndex of circleIndices) {
        const firstCircle = circles[firstIndex];
        if (!firstCircle) continue;

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const neighborY = cellY + offsetY;
          if (neighborY < 0 || neighborY >= this.rowCount) continue;

          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const neighborX = cellX + offsetX;
            if (neighborX < 0 || neighborX >= this.columnCount) continue;

            const neighborKey =
              neighborY * this.columnCount + neighborX;
            const neighborIndices = this.grid.get(neighborKey);
            if (!neighborIndices) continue;

            for (const secondIndex of neighborIndices) {
              if (secondIndex <= firstIndex) continue;

              const secondCircle = circles[secondIndex];
              if (!secondCircle) continue;

              if (
                this.resolveCircleCollision(
                  firstCircle,
                  secondCircle,
                  config.radius,
                  config.restitution,
                )
              ) {
                collisionCount += 1;
              }
            }
          }
        }
      }
    }

    return collisionCount;
  }

  private rebuildGrid(
    circles: Circle[],
    radius: number,
    width: number,
    height: number,
  ): void {
    const cellSize = radius * 2;

    this.columnCount = Math.max(1, Math.ceil(width / cellSize));
    this.rowCount = Math.max(1, Math.ceil(height / cellSize));
    this.grid.clear();

    for (let index = 0; index < circles.length; index += 1) {
      const circle = circles[index];
      if (!circle) continue;

      const cellX = Math.min(
        this.columnCount - 1,
        Math.max(0, Math.floor(circle.position.x / cellSize)),
      );
      const cellY = Math.min(
        this.rowCount - 1,
        Math.max(0, Math.floor(circle.position.y / cellSize)),
      );
      const cellKey = cellY * this.columnCount + cellX;
      const circleIndices = this.grid.get(cellKey);

      if (circleIndices) {
        circleIndices.push(index);
      } else {
        this.grid.set(cellKey, [index]);
      }
    }
  }

  private resolveCircleCollision(
    first: Circle,
    second: Circle,
    radius: number,
    restitution: number,
  ): boolean {
    const deltaX = second.position.x - first.position.x;
    const deltaY = second.position.y - first.position.y;
    const minimumDistance = radius * 2;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

    if (distanceSquared > minimumDistance * minimumDistance) return false;

    const distance = Math.sqrt(distanceSquared);
    const collisionNormal =
      distance > 0
        ? {
            x: deltaX / distance,
            y: deltaY / distance,
          }
        : SAME_CENTER_COLLISION_NORMAL;
    const correction = (minimumDistance - distance) / 2;

    first.position.x -= collisionNormal.x * correction;
    first.position.y -= collisionNormal.y * correction;
    second.position.x += collisionNormal.x * correction;
    second.position.y += collisionNormal.y * correction;

    const relativeVelocityX = second.velocity.x - first.velocity.x;
    const relativeVelocityY = second.velocity.y - first.velocity.y;
    const velocityAlongNormal =
      relativeVelocityX * collisionNormal.x +
      relativeVelocityY * collisionNormal.y;

    if (velocityAlongNormal >= 0) return true;

    const impulseMagnitude = (-(1 + restitution) * velocityAlongNormal) / 2;
    const impulseX = impulseMagnitude * collisionNormal.x;
    const impulseY = impulseMagnitude * collisionNormal.y;

    first.velocity.x -= impulseX;
    first.velocity.y -= impulseY;
    second.velocity.x += impulseX;
    second.velocity.y += impulseY;

    return true;
  }

  private resolveCanvasCollision(
    circle: Circle,
    radius: number,
    restitution: number,
    width: number,
    height: number,
  ): void {
    if (radius * 2 >= width) {
      circle.position.x = width / 2;
    } else {
      if (circle.position.x - radius < 0) {
        circle.position.x = radius;
        circle.velocity.x = Math.abs(circle.velocity.x) * restitution;
      }

      if (circle.position.x + radius > width) {
        circle.position.x = width - radius;
        circle.velocity.x = -Math.abs(circle.velocity.x) * restitution;
      }
    }

    if (radius * 2 >= height) {
      circle.position.y = height / 2;
    } else {
      if (circle.position.y - radius < 0) {
        circle.position.y = radius;
        circle.velocity.y = Math.abs(circle.velocity.y) * restitution;
      }

      if (circle.position.y + radius > height) {
        circle.position.y = height - radius;
        circle.velocity.y = -Math.abs(circle.velocity.y) * restitution;
      }
    }
  }
}
