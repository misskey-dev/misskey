/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
//import '@babylonjs/core/Engines/WebGPU/Extensions/engine.rawTexture';

export function registerBabylonRuntime(): void {
	BABYLON.RegisterCoreEngineExtensions();
	BABYLON.RegisterFullWebGPUEngineExtensions();
	//BABYLON.RegisterEnginesWebGPUExtensionsEngineRawTexture();
	BABYLON.RegisterBufferAlign();
	BABYLON.RegisterCubeTexture();
	BABYLON.RegisterStandardMaterial();
	BABYLON.RegisterCollisionCoordinator();
	BABYLON.RegisterPostProcessRenderPipelineManagerSceneComponent(
		BABYLON.PostProcessRenderPipelineManager,
	);
}
