/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createPlaneUvMapper } from '../utility.js';
import type { Timer } from '../utility.js';
import type { ModelManager } from './utility.js';
import type { ObjectSchemaDef } from 'misskey-world/src/room/object.js';
import type { OptionsSchema } from 'misskey-world/src/mono.js';
import type { ConvertedOptions, GetConvertedOptionsSchemaValues } from '../mono.js';

export type RoomObjectInstance<Options = any> = {
	onInited?: () => void;
	onOptionsUpdated?: <K extends keyof Options, V extends Options[K]>(kv: [K, V]) => void;
	interactions: Record<string, {
		fn: () => void;
	}>;
	primaryInteraction?: string | null;
	resetTemporaryState?: () => void;
	dispose: () => void;
};

export type SnapshotRenderingHelperWrapper = {
	updateMesh: (meshes: BABYLON.Mesh[]) => void;
	reset: () => void;
	fixParticleSystem: (ps: BABYLON.ParticleSystem) => void;
};

export type ObjectDef<Schema extends ObjectSchemaDef = ObjectSchemaDef> = Schema & {
	path?: (options: string extends keyof Schema['options']['schema'] ? ConvertedOptions : Readonly<GetConvertedOptionsSchemaValues<Schema['options']['schema']>>) => string;
	createInstance: (args: {
		scene: BABYLON.Scene;
		// TODO: snapshot renderingの関心を隠蔽した方が綺麗かもしれない
		// 例えばmaterialUpdatedというメソッドを用意して内部的にresetを呼ぶなど
		sr: SnapshotRenderingHelperWrapper;
		lc: BABYLON.ClusteredLightContainer | null;
		root: BABYLON.TransformNode;
		options: string extends keyof Schema['options']['schema'] ? ConvertedOptions : Readonly<GetConvertedOptionsSchemaValues<Schema['options']['schema']>>;
		model: ModelManager;
		id: string;
		timer: Timer;
		graphicsQuality: number;
		stickyMarkerMeshUpdated?: (mesh: BABYLON.Mesh) => void;
		sitChair?: () => void;
		reloadModel: () => void;
	}) => RoomObjectInstance<string extends keyof Schema['options']['schema'] ? ConvertedOptions : GetConvertedOptionsSchemaValues<Schema['options']['schema']>> | Promise<RoomObjectInstance<Schema['options']['schema'] extends undefined ? ConvertedOptions : GetConvertedOptionsSchemaValues<Schema['options']['schema']>>>; // TODO: createInstanceをasyncにするのではなく、別にreadyみたいなものを返させる
};

export function defineObjectSchema<const OpSc extends OptionsSchema>(def: ObjectSchemaDef<OpSc>): ObjectSchemaDef<OpSc> {
	return def;
}

export function defineObject<const Schema extends ObjectSchemaDef<any>>(schema: Schema, def: Pick<ObjectDef<Schema>, 'path' | 'createInstance'>): ObjectDef<Schema> {
	return { ...schema, ...def };
}

export const createTextureManager = (targetMesh: BABYLON.Mesh, calcTargetAspect: () => number, scene: BABYLON.Scene) => {
	let currentUrl: string | null = null;
	let currentTexture: BABYLON.Texture | null = null;

	const updateUv = createPlaneUvMapper(targetMesh);

	const applyFit = (method?: 'cover' | 'contain' | 'stretch') => {
		if (currentTexture == null) return;

		const srcAspect = currentTexture.getSize().width / currentTexture.getSize().height;

		updateUv(srcAspect, calcTargetAspect(), method ?? 'cover');
	};

	const change = (url: string | null, fit?: 'cover' | 'contain' | 'stretch') => new Promise<BABYLON.Texture | null>((resolve) => {
		if (currentUrl === url) {
			applyFit(fit);
			resolve(currentTexture);
			return;
		}

		if (currentTexture != null) {
			currentTexture.dispose();
		}

		currentUrl = url;
		if (url == null) {
			currentTexture = null;
			resolve(null);
			return;
		}
		currentTexture = new BABYLON.Texture(url, scene, false, false, undefined, () => {
			currentTexture!.level = 1;
			currentTexture!.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
			currentTexture!.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
			applyFit(fit);
			resolve(currentTexture);
		}, (message, exception) => {
			console.warn('Failed to load texture:', message, exception);
			currentTexture!.dispose();
			currentTexture = null;
			resolve(null);
		});
	});

	return {
		change,
		applyFit,
		dispose: () => {
			if (currentTexture != null) {
				currentTexture.dispose();
			}
		},
	};
};
