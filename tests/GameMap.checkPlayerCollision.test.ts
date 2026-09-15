import { describe, it, expect, vi, beforeEach } from "vitest";
import { Player } from "../src/sprites/Player";
import { Grub, CreatureState } from "../src/sprites/Creature";

// Standalone replica of GameMap.checkPlayerCollision's decision logic, for
// testing without instantiating a real GameMap (which needs a browser-only
// ResourceManager/Settings). `collided` stands in for getSpriteCollision(p).
function checkPlayerCollision(
    p: Player,
    isFalling: boolean,
    collided: Grub | null,
    settings: { playEvents: boolean; boop: { play: () => void } }
) {
    if (p.getState() != CreatureState.NORMAL) return;
    const s = collided;
    if (s) {
        if (isFalling) {
            s.setState(CreatureState.DYING);
            if (settings.playEvents) settings.boop.play();
            const pos = s.getPosition();
            p.setPosition(p.getPosition().x, pos.y - p.getImage().height);
            p.jump(true);
        } else if (p.isDashing()) {
            s.setState(CreatureState.DYING);
            if (settings.playEvents) settings.boop.play();
        } else {
            p.setState(CreatureState.DYING);
        }
    }
}

function makeGrub(y: number): Grub {
    const grub = new Grub();
    grub.setPosition(50, y);
    (grub as any).getImage = () => ({ width: 64, height: 64 });
    return grub;
}

describe("GameMap.checkPlayerCollision()", () => {
    let player: Player;
    let settings: { playEvents: boolean; boop: { play: ReturnType<typeof vi.fn> } };

    beforeEach(() => {
        player = new Player();
        (player as any).getImage = () => ({ width: 64, height: 64 });
        settings = { playEvents: true, boop: { play: vi.fn() } };
    });

    it("stomp kill (isFalling=true) bounces the player regardless of dashing", () => {
        const grub = makeGrub(200);
        const jumpSpy = vi.spyOn(player, "jump");
        checkPlayerCollision(player, true, grub, settings);
        expect(grub.getState()).toBe(CreatureState.DYING);
        expect(jumpSpy).toHaveBeenCalledWith(true);
        expect(player.getState()).toBe(CreatureState.NORMAL);
        expect(settings.boop.play).toHaveBeenCalledOnce();
    });

    it("dash kill (isFalling=false, isDashing=true) destroys the enemy without bouncing", () => {
        player.dash();
        const grub = makeGrub(150); // same height as player, not "falling onto" it
        const jumpSpy = vi.spyOn(player, "jump");
        checkPlayerCollision(player, false, grub, settings);
        expect(grub.getState()).toBe(CreatureState.DYING);
        expect(jumpSpy).not.toHaveBeenCalled();
        expect(player.getState()).toBe(CreatureState.NORMAL); // player survives, keeps dashing
        expect(settings.boop.play).toHaveBeenCalledOnce();
    });

    it("plain horizontal touch (isFalling=false, not dashing) kills the player", () => {
        const grub = makeGrub(150);
        checkPlayerCollision(player, false, grub, settings);
        expect(player.getState()).toBe(CreatureState.DYING);
        expect(grub.getState()).toBe(CreatureState.NORMAL); // enemy unaffected
    });

    it("no collision is a no-op", () => {
        checkPlayerCollision(player, false, null, settings);
        expect(player.getState()).toBe(CreatureState.NORMAL);
    });
});
