/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createPlaneUvMapper } from '../utility.js';
import type { Timer } from '../utility.js';
import type { ModelManager } from './utility.js';
import type { BooleanOptionSchema, ColorOptionSchema, EnumOptionSchema, ImageOptionSchema, LightOptionSchema, MaterialOptionSchema, NumberOptionSchema, ObjectSchemaDef, OptionsSchema, RangeOptionSchema, SeedOptionSchema, StringOptionSchema } from 'misskey-world/src/room/object.js';
import type { RoomAttachments } from 'misskey-world/src/room/type.js';

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

export type RawOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

export type ConvertedOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

type RawImageValue<Presets extends string = string> = { type: Presets | null | '_custom_'; driveFileId?: string | null; fit?: 'cover' | 'contain' | 'stretch'; };

type ConvertedImageValue<Presets extends string = string> = { type: Presets | null | '_custom_'; custom?: { url: string; } | null; fit?: 'cover' | 'contain' | 'stretch'; };
type GetConvertedOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends StringOptionSchema ? string :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends MaterialOptionSchema ? { color: [number, number, number]; metallic: number; roughness: number; } :
	T[K] extends LightOptionSchema ? { color: [number, number, number]; brightness: number; } :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number]['value'] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? ConvertedImageValue<T[K]['presets'][number]['value']> :
	T[K] extends SeedOptionSchema ? number :
	never;
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

export function convertRawOptions<OpSc extends OptionsSchema>(schema: OpSc, raw: RawOptions, attachments: RoomAttachments): ConvertedOptions {
	const converted = {} as ConvertedOptions;
	for (const record of Object.entries(schema)) {
		const k = record[0];
		const v = raw[k];
		if (record[1].type === 'image') {
			const _v = v as unknown as RawImageValue;
			const file = _v.type === '_custom_' ? attachments.files.find(f => f.id === _v.driveFileId) : null;
			if (file != null && file.url.startsWith('http://syu-win.local:3000/')) { // debug
				file.url = file.url.replace('http://syu-win.local:3000/', 'https://local-mi.syuilo.dev/');
			}

			converted[k] = { type: _v.type, custom: file != null ? { url: file.url } : null, fit: _v.fit } satisfies ConvertedImageValue;
		} else {
			converted[k] = v;
		}
	}
	return converted;
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
