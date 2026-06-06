/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';

export function registerBabylonRuntime(): void {
	BABYLON.RegisterStandardEngineExtensions();
	BABYLON.RegisterStandardWebGPUEngineExtensions();
	BABYLON.RegisterAbstractEngineAlpha();
	BABYLON.RegisterAbstractEngineTexture();
	BABYLON.RegisterAbstractEngineCubeTexture();
	BABYLON.RegisterAbstractEngineQuery();
	BABYLON.RegisterAbstractEngineTextureSelector();
	BABYLON.RegisterAbstractEngineTimeQuery();
	BABYLON.RegisterAbstractEngineViews();
	BABYLON.RegisterEnginesWebGPUExtensionsEngineRawTexture();
	BABYLON.RegisterEnginesWebGPUExtensionsEngineReadTexture();
	BABYLON.RegisterEnginesWebGPUExtensionsEngineCubeTexture();
	BABYLON.RegisterEnginesWebGPUExtensionsEngineRenderTargetCube();
	BABYLON.RegisterEnginesWebGPUExtensionsEngineQuery();
	BABYLON.RegisterEnginesWebGPUExtensionsEngineDynamicTexture();
	BABYLON.RegisterBufferAlign();
	BABYLON.RegisterCubeTexture();
	BABYLON.RegisterStandardMaterial();
	BABYLON.RegisterRay();
	BABYLON.RegisterCollisionCoordinator();
	BABYLON.RegisterPostProcessRenderPipelineManagerSceneComponent(
		BABYLON.PostProcessRenderPipelineManager,
	);
}
