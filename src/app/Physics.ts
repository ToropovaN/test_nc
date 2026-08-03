import type { Circle, SimulationConfig } from "../data/types";
import { SAME_CENTER_COLLISION_NORMAL } from "../data/constants";

export class Physics {
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

    const collisionCount = this.resolveCircleCollisions(circles, config);

    for (const circle of circles) {
      this.resolveCanvasCollision(
        circle,
        config.radius,
        config.restitution,
        width,
        height,
      );
    }

    return collisionCount;
  }

  private resolveCircleCollisions(
    circles: Circle[],
    config: SimulationConfig,
  ): number {
    let collisionCount = 0;

    for (let i = 0; i < circles.length; i += 1) {
      const firstCircle = circles[i];
      if (!firstCircle) continue;

      for (let j = i + 1; j < circles.length; j += 1) {
        const secondCircle = circles[j];
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

    return collisionCount;
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

    if (distanceSquared > minimumDistance * minimumDistance) return false; // Не пересеклись

    const distance = Math.sqrt(distanceSquared);

    const collisionNormal =
      distance > 0
        ? {
            x: deltaX / distance,
            y: deltaY / distance,
          }
        : SAME_CENTER_COLLISION_NORMAL;

    const correction = (minimumDistance - distance) / 2;

    // Раздвигаем по нормали
    first.position.x -= collisionNormal.x * correction;
    first.position.y -= collisionNormal.y * correction;
    second.position.x += collisionNormal.x * correction;
    second.position.y += collisionNormal.y * correction;

    const relativeVelocityX = second.velocity.x - first.velocity.x;
    const relativeVelocityY = second.velocity.y - first.velocity.y;
    const velocityAlongNormal =
      relativeVelocityX * collisionNormal.x +
      relativeVelocityY * collisionNormal.y;

    if (velocityAlongNormal >= 0) return true; //Если круги уже разлетаются

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
