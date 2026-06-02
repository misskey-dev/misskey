/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { AvatarPreviewEngine } from './avatarPreviewEngine.js';
import { registerBabylonRuntime } from './babylonRuntime.js';
import type { PlayerProfile } from './PlayerContainer.js';

registerBabylonRuntime();

export async function createAvatarPreviewEngine(params: {
	canvas: HTMLCanvasElement; options: { graphicsQuality: number; resolution: number; fps: number | null }; profile: PlayerProfile;
}) {
	const babylonEngine = new BABYLON.WebGPUEngine(params.canvas, { doNotHandleContextLost: true, powerPreference: 'low-power', antialias: true });
	babylonEngine.compatibilityMode = false;
	babylonEngine.enableOfflineSupport = false;
	await babylonEngine.initAsync();
	if (params.options.resolution === 2) babylonEngine.setHardwareScalingLevel(0.5);
	if (params.options.resolution === 0.5) babylonEngine.setHardwareScalingLevel(2);

	const engine = new AvatarPreviewEngine(params.profile, {
		engine: babylonEngine,
		...params.options,
	});

	return engine;
}
