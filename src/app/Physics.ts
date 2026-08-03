import type { Circle } from "../data/types";
import { SAME_CENTER_COLLISION_NORMAL } from "../data/constants";

export class Physics {
  update(
    circles: Circle[],
    deltaTime: number,
    width: number,
    height: number,
    activeCircleId: string | null = null,
  ): void {
    for (const circle of circles) {
      if (circle.id === activeCircleId) continue;

      circle.position.x += circle.velocity.x * deltaTime;
      circle.position.y += circle.velocity.y * deltaTime;
    }

    this.resolveCircleCollisions(circles, activeCircleId);

    for (const circle of circles) {
      if (circle.id === activeCircleId) continue;

      this.resolveCanvasCollision(circle, width, height);
    }
  }

  private resolveCircleCollisions(
    circles: Circle[],
    activeCircleId: string | null,
  ): void {
    for (let i = 0; i < circles.length; i += 1) {
      const firstCircle = circles[i];
      if (!firstCircle) continue;
      if (firstCircle.id === activeCircleId) continue;

      for (let j = i + 1; j < circles.length; j += 1) {
        const secondCircle = circles[j];
        if (!secondCircle) continue;
        if (secondCircle.id === activeCircleId) continue;

        this.resolveCircleCollision(firstCircle, secondCircle);
      }
    }
  }

  private resolveCircleCollision(first: Circle, second: Circle): void {
    const deltaX = second.position.x - first.position.x;
    const deltaY = second.position.y - first.position.y;
    const minimumDistance = first.radius + second.radius;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

    if (distanceSquared > minimumDistance * minimumDistance) return; // Не пересеклись

    const distance = Math.sqrt(distanceSquared);

    const collisionNormal =
      distance > 0
        ? {
            x: deltaX / distance,
            y: deltaY / distance,
          }
        : SAME_CENTER_COLLISION_NORMAL;

    const firstInverseMass = 1 / (first.radius * first.radius);
    const secondInverseMass = 1 / (second.radius * second.radius);
    const inverseMassSum = firstInverseMass + secondInverseMass;

    const overlap = minimumDistance - distance;
    const correction = overlap / inverseMassSum;

    // Раздвигаем по нормали с учетом массы
    first.position.x -= collisionNormal.x * correction * firstInverseMass;
    first.position.y -= collisionNormal.y * correction * firstInverseMass;

    second.position.x += collisionNormal.x * correction * secondInverseMass;
    second.position.y += collisionNormal.y * correction * secondInverseMass;

    const relativeVelocityX = second.velocity.x - first.velocity.x;
    const relativeVelocityY = second.velocity.y - first.velocity.y;

    const velocityAlongNormal =
      relativeVelocityX * collisionNormal.x +
      relativeVelocityY * collisionNormal.y;

    if (velocityAlongNormal >= 0) return; //Если круги уже разлетаются

    const impulseMagnitude = (-2 * velocityAlongNormal) / inverseMassSum;

    const impulseX = impulseMagnitude * collisionNormal.x;
    const impulseY = impulseMagnitude * collisionNormal.y;

    first.velocity.x -= impulseX * firstInverseMass;
    first.velocity.y -= impulseY * firstInverseMass;

    second.velocity.x += impulseX * secondInverseMass;
    second.velocity.y += impulseY * secondInverseMass;
  }

  private resolveCanvasCollision(
    circle: Circle,
    width: number,
    height: number,
  ): void {
    if (circle.radius * 2 >= width) {
      circle.position.x = width / 2;
    } else {
      if (circle.position.x - circle.radius < 0) {
        circle.position.x = circle.radius;
        circle.velocity.x = Math.abs(circle.velocity.x);
      }

      if (circle.position.x + circle.radius > width) {
        circle.position.x = width - circle.radius;
        circle.velocity.x = -Math.abs(circle.velocity.x);
      }
    }

    if (circle.radius * 2 >= height) {
      circle.position.y = height / 2;
    } else {
      if (circle.position.y - circle.radius < 0) {
        circle.position.y = circle.radius;
        circle.velocity.y = Math.abs(circle.velocity.y);
      }

      if (circle.position.y + circle.radius > height) {
        circle.position.y = height - circle.radius;
        circle.velocity.y = -Math.abs(circle.velocity.y);
      }
    }
  }
}
