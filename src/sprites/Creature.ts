import { Sprite } from "./Sprite.js";

/**
 * A Creature is a Sprite that is affected by gravity and can die.
 */

export enum CreatureState {
    DEAD,
    DYING,
    NORMAL,
}

export class Creature extends Sprite {
    DIE_TIME = 1000;

    state: CreatureState;
    stateTime: number;

    constructor() {
        super();
        this.state = CreatureState.NORMAL;
        this.stateTime = 0;
    }

    clone() {
        const s = super.clone();
        s.state = this.state;
        s.stateTime = this.stateTime;
        return s;
    }

    getState() {
        return this.state;
    }

    setState(st: CreatureState) {
        if (st != this.state) {
            this.stateTime = 0;
            this.state = st;
            if (this.state == CreatureState.DYING) {
                this.setVelocity(0, 0);
                const facingAnim = this.currAnimName.toLowerCase();
                if (facingAnim.includes("left")) {
                    this.setAnimation("deadLeft");
                }
                if (facingAnim.includes("right")) {
                    this.setAnimation("deadRight");
                }
            }
        }
    }

    wakeUp() {
        if (this.getState() == CreatureState.NORMAL && this.velocity.x == 0) {
            this.setVelocity(-this.getMaxSpeed(), 0);
        }
    }

    getMaxSpeed() {
        return 0;
    }

    update(deltaTime: number) {
        const newAnim = this.getDesiredAnimation();
        if (newAnim != "" && newAnim != this.currAnimName) {
            this.setAnimation(newAnim);
        } else {
            super.update(deltaTime);
        }
        this.stateTime += deltaTime;
        if (this.state == CreatureState.DYING && this.stateTime > this.DIE_TIME) {
            this.setState(CreatureState.DEAD);
        }
    }

    // Subclasses (e.g. Player) override this to prioritize animations other
    // than plain left/right movement (jumping, dashing, etc.) without
    // duplicating the death-state/frame-timing bookkeeping above.
    getDesiredAnimation(): string {
        if (this.velocity.x < 0) {
            return "left";
        } else if (this.velocity.x > 0) {
            return "right";
        }
        return "";
    }
}

export class Grub extends Creature {
    getMaxSpeed() {
        return 0.05;
    }
}

export class Fly extends Creature {
    isFlying() {
        return this.state == CreatureState.NORMAL;
    }

    getMaxSpeed() {
        return 0.2;
    }
}
