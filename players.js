import { Vector } from "./vector.js";

/**
 * The steering behaviors in this file are all based by the Craig W. Reynolds' propositions
 */

class PlayObjects {
  constructor(cellSize) {
    this.width = cellSize;
    this.height = cellSize;
    this.maxSpeed = 1.5;
    this.maxForce = 0.1;
  }

  async update(nearestTarget, nearestTargeter, theObject) {
    let target;
    let run = false;
    let steering;

    if (nearestTarget && nearestTargeter) {
      const distanceToTarget = this.calculateDistance(
        nearestTarget.position,
        theObject.position
      );
      const distanceToTargeter = this.calculateDistance(
        nearestTargeter.position,
        theObject.position
      );
      if (distanceToTarget < distanceToTargeter) {
        target = nearestTarget;
      } else {
        target = nearestTargeter;
        run = true;
      }
    } else if (nearestTarget && !nearestTargeter) {
      target = nearestTarget;
    } else if (nearestTargeter && !nearestTarget) {
      target = nearestTargeter;
      run = true;
    } else {
      target = {
        position: new Vector(theObject.initialX, theObject.initialY),
        velocity: new Vector(0, 0),
      };
      let distance = this.calculateDistance(
        theObject.position,
        target.position
      );
      if (distance == 0) return;
      steering = this.arrive(theObject, target);
    }

    if (!steering) {
      steering = run
        ? this.evade(theObject, target)
        : this.pursue(theObject, target);
    }
    if (steering) this.applyForce(theObject, steering);

    if (theObject.acceleration) {
      theObject.velocity.add(theObject.acceleration);
      theObject.velocity.limit(this.maxSpeed);

      // See if the object is running towards the wall and change velocity accordingly
      let predictionToWall = theObject.velocity.clone();
      predictionToWall.setMag(this.width / 2);
      predictionToWall.add(theObject.position);
      if (
        predictionToWall.x <= 0 ||
        predictionToWall.x >= theObject.game.width - theObject.width
      ) {
        theObject.velocity.mult(new Vector(-1, 1));
      }
      if (
        predictionToWall.y <= 0 ||
        predictionToWall.y >= theObject.game.height - theObject.height
      ) {
        theObject.velocity.mult(new Vector(1, -1));
      }
      theObject.position.add(theObject.velocity);
      theObject.acceleration = new Vector(0, 0);
    }
  }

  draw() {}

  findNearestTarget(targets, aPlayObject) {
    if (targets.length === 0) return null;

    return targets.reduce((nearest, target) => {
      const distanceToTarget = this.calculateDistance(
        aPlayObject.position,
        target.position
      );
      const distanceToNearest = this.calculateDistance(
        aPlayObject.position,
        nearest.position
      );

      return distanceToTarget < distanceToNearest ? target : nearest;
    });
  }

  findNearestTargeter(targeters, aPlayObject) {
    if (targeters.length === 0) return null;

    return targeters.reduce((nearest, targeter) => {
      const distanceToTargeter = this.calculateDistance(
        aPlayObject.position,
        targeter.position
      );
      const distanceToNearest = this.calculateDistance(
        aPlayObject.position,
        nearest.position
      );

      return distanceToTargeter < distanceToNearest ? targeter : nearest;
    });
  }

  calculateDistance(obj1, obj2) {
    const dx = obj2.x - obj1.x;
    const dy = obj2.y - obj1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  compareWithInitialPosition(objPlay) {
    return (
      objPlay.initialX < objPlay.position.x + this.width &&
      objPlay.initialX + this.width > objPlay.position.x &&
      objPlay.initialY < objPlay.position.y + this.width &&
      objPlay.initialY + this.width > objPlay.position.y
    );
  }

  arrive(aPlayObject, target) {
    return this.seek(aPlayObject, target, true);
  }

  pursue(aPlayObject, target) {
    let newTarget = {
      position: target.position.clone(),
    };
    let prediction = target.velocity.clone();
    prediction.mult(10);
    newTarget.position.add(prediction);
    return this.seek(aPlayObject, newTarget);
  }

  evade(aPlayObject, targeter) {
    let newTargeter = this.pursue(aPlayObject, targeter);
    if (newTargeter) newTargeter.mult(-1);
    return newTargeter || null;
  }

  flee(aPlayObject, target) {
    return this.seek(aPlayObject, target).mult(-1);
  }

  seek(aPlayObject, target, arrival = false) {
    let force = new Vector(target.position.x, target.position.y);
    force.sub(aPlayObject.position);
    let desiredSpeed = this.maxSpeed;
    if (arrival) {
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = (distance * this.maxSpeed) / slowRadius;
      }
    }
    force.setMag(desiredSpeed);
    force.sub(aPlayObject.velocity);
    force.limit(this.maxForce);
    return force;
  }

  applyForce(aPlayObject, force) {
    aPlayObject.acceleration.add(force);
    return aPlayObject.acceleration;
  }
}

export class Paper extends PlayObjects {
  constructor(game, x, y) {
    super(game.cellSize);
    this.game = game;
    this.position = new Vector(x, y);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.initialX = x;
    this.initialY = y;
    this.image = document.getElementById("paper");
  }

  update() {
    //choose the target
    const nearestTarget = super.findNearestTarget(this.game.rocks, this);
    const nearestTargeter = super.findNearestTargeter(this.game.scissors, this);
    super.update(nearestTarget, nearestTargeter, this);
  }

  draw(context) {
    context.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  compareWithInitialPosition() {
    return super.compareWithInitialPosition(this);
  }
}

export class Rock extends PlayObjects {
  constructor(game, x, y) {
    super(game.cellSize);
    this.game = game;
    this.position = new Vector(x, y);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.initialX = x;
    this.initialY = y;
    this.image = document.getElementById("rock");
  }

  update() {
    const nearestTarget = super.findNearestTarget(this.game.scissors, this);
    const nearestTargeter = super.findNearestTargeter(this.game.papers, this);
    super.update(nearestTarget, nearestTargeter, this);
  }

  draw(context) {
    context.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  compareWithInitialPosition() {
    return super.compareWithInitialPosition(this);
  }
}

export class Scissor extends PlayObjects {
  constructor(game, x, y) {
    super(game.cellSize);
    this.game = game;
    this.position = new Vector(x, y);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.initialX = x;
    this.initialY = y;
    this.image = document.getElementById("scissors");
  }

  update() {
    const nearestTarget = super.findNearestTarget(this.game.papers, this);
    const nearestTargeter = super.findNearestTargeter(this.game.rocks, this);
    super.update(nearestTarget, nearestTargeter, this);
  }

  draw(context) {
    context.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  compareWithInitialPosition() {
    return super.compareWithInitialPosition(this);
  }
}
