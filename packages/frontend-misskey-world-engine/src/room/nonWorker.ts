/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { registerBabylonRuntime } from '../babylonRuntime.js';
import { RoomEngine } from './engine.js';
import type { RoomState, RoomAttachments } from 'misskey-world/src/room/type.js';

registerBabylonRuntime();

export async function createRoomEngine(params: {
	roomState: RoomState; roomAttachments: RoomAttachments; canvas: HTMLCanvasElement; options: { antialias: boolean; resolution: number; fov: number; graphicsQuality: number; fps: number | null; useVirtualJoystick?: boolean; };
}) {
	const babylonEngine = new BABYLON.WebGPUEngine(params.canvas, { doNotHandleContextLost: true, powerPreference: 'high-performance', antialias: params.options.antialias });
	babylonEngine.compatibilityMode = false;
	babylonEngine.enableOfflineSupport = false;
	await babylonEngine.initAsync();
	if (params.options.resolution === 2) babylonEngine.setHardwareScalingLevel(0.5);
	if (params.options.resolution === 0.5) babylonEngine.setHardwareScalingLevel(2);

	const engine = new RoomEngine(params.roomState, params.roomAttachments, {
		engine: babylonEngine,
		...params.options,
	});

	return engine;
}
