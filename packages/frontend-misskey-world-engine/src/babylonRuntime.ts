/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';

export function registerBabylonRuntime(): void {
	BABYLON.RegisterFullEngineExtensions();
	BABYLON.RegisterFullWebGPUEngineExtensions();
	BABYLON.RegisterBufferAlign();
	BABYLON.RegisterCubeTexture();
	BABYLON.RegisterStandardMaterial();
	BABYLON.RegisterRay();
	BABYLON.RegisterCollisionCoordinator();
	BABYLON.RegisterPostProcessRenderPipelineManagerSceneComponent(
		BABYLON.PostProcessRenderPipelineManager,
	);
}
