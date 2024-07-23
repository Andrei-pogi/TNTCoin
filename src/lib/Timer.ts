import { Player } from "@minecraft/server";
import { taskManager } from "./TaskManager";

export class Timer {
    private player: Player;
    private duration: number;
    private remainingTime: number;
    private timeoutId: string;
    private isRunning: boolean;
    private displayOnActionBar: boolean;

    /**
     * Creates a new timer for the given player.
     * @param {Player} player The player for whom the timer is created.
     */
    constructor(player: Player) {
        this.timeoutId = `timer-${player.name}`;
        this.isRunning = false;
        this.player = player;
        this.displayOnActionBar = false;
    }

    public get isDisplayOnActionBar(): boolean {
        return this.displayOnActionBar;
    }

    /**
     * Starts the timer.
     * @param {number} duration The duration of the timer in seconds.
     * @param {() => void} onEnd Callback function when the timer ends.
     */
    public start(duration: number, onEnd: () => void): void {
        this.duration = duration;
        this.remainingTime = duration;
        if (this.isRunning) {
            this.stop();
        }
        this.isRunning = true;
        this.runTimer(onEnd);
    }

    /**
     * Runs the timer and updates the remaining time.
     * @param {() => void} onEnd Callback function when the timer ends.
     */
    private runTimer(onEnd: () => void): void {
        if (this.remainingTime > 0) {
            this.updateActionBar();
            taskManager.addTimeout(this.timeoutId, () => {
                this.remainingTime--;
                this.runTimer(onEnd);
            }, 20);
        } else {
            this.isRunning = false;
            onEnd();
        }
    }

    /**
     * Stops the timer.
     */
    public stop(): void {
        taskManager.clearTimeout(this.timeoutId);
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.clearActionBar();
    }

    /**
     * Resets the timer to the initial duration.
     */
    public reset(): void {
        this.stop();
        this.remainingTime = this.duration;
        this.updateActionBar();
    }

    /**
     * Toggles the timer display on the action bar.
     * @param {boolean} display Whether to display the timer on the action bar.
     */
    public toggleActionBar(display: boolean): void {
        this.displayOnActionBar = display;
        if (!display) this.clearActionBar();
    }

    /**
     * Updates the action bar with the remaining time.
     */
    private updateActionBar(): void {
        if (this.displayOnActionBar) {
            this.player.onScreenDisplay.setActionBar(`Time Remaining: ${this.remainingTime <= 10 ? '§c' : '§a'}${this.remainingTime}§f seconds`);
        }
    }

    /**
     * Clears the action bar display.
     */
    private clearActionBar(): void {
        this.player.onScreenDisplay.setActionBar('');
    }
}