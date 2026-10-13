import type { SleepPort } from "../port/SleepPort.js";

/** setTimeout 으로 지정한 시간만큼 기다린다 */
export const timerSleep: SleepPort = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms));
