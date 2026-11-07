/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module 'os-utils' {
	type FreeCommandCallback = (usedmem: number) => void;

	type HarddriveCallback = (total: number, free: number, used: number) => void;

	type GetProcessesCallback = (result: string) => void;

	type CPUCallback = (perc: number) => void;

	export function platform(): NodeJS.Platform;
	export function cpuCount(): number;
	export function sysUptime(): number;
	export function processUptime(): number;

	export function freemem(): number;
	export function totalmem(): number;
	export function freememPercentage(): number;
	export function freeCommand(callback: FreeCommandCallback): void;

	export function harddrive(callback: HarddriveCallback): void;

	export function getProcesses(callback: GetProcessesCallback): void;
	export function getProcesses(nProcess: number, callback: GetProcessesCallback): void;

	export function allLoadavg(): string;
	export function loadavg(_time?: number): number;

	export function cpuFree(callback: CPUCallback): void;
	export function cpuUsage(callback: CPUCallback): void;
}
