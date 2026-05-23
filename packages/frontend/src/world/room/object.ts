/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createPlaneUvMapper } from '../utility.js';
import type { Timer } from '../utility.js';
import type { ModelManager, RoomAttachments } from './utility.js';

// babylonのドメイン知識は持たない
export type RoomStateObject = {
	id: string;
	type: string;
	position: [number, number, number];
	rotation: [number, number, number];
	options: RawOptions;

	/**
	 * 別のオブジェクトのID
	 */
	sticky?: string | null;
};

export type RoomObjectInstance<Options = any> = {
	onInited?: () => void;
	onOptionsUpdated?: <K extends keyof Options, V extends Options[K]>(kv: [K, V]) => void;
	interactions: Record<string, {
		label: string;
		fn: () => void;
	}>;
	primaryInteraction?: string | null;
	resetTemporaryState?: () => void;
	dispose?: () => void;
};

type NumberOptionSchema = {
	type: 'number';
	label: string;
	min?: number;
	max?: number;
	step?: number;
};

type BooleanOptionSchema = {
	type: 'boolean';
	label: string;
};

type StringOptionSchema = {
	type: 'string';
	label: string;
};

type ColorOptionSchema = {
	type: 'color';
	label: string;
};

type EnumOptionSchema = {
	type: 'enum';
	label: string;
	enum: {
		label: string;
		value: string | number;
	}[];
};

type RangeOptionSchema = {
	type: 'range';
	label: string;
	min: number;
	max: number;
	step?: number;
};

type ImageOptionSchema = {
	type: 'image';
	label: string;
	presets: {
		label: string;
		value: string | number;
	}[];
};

type SeedOptionSchema = {
	type: 'seed';
	label: string;
};

type OptionsSchema = Record<string, NumberOptionSchema | BooleanOptionSchema | StringOptionSchema | ColorOptionSchema | EnumOptionSchema | RangeOptionSchema | ImageOptionSchema | SeedOptionSchema>;

export type RawOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

export type ConvertedOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

type GetRawOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends StringOptionSchema ? string :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number]['value'] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? { type: T[K]['presets'][number]['value'] | null | '_custom_'; driveFileId?: string | null; fit?: 'cover' | 'contain' | 'stretch'; } :
	T[K] extends SeedOptionSchema ? number :
	never;
};
type GetConvertedOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends StringOptionSchema ? string :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number]['value'] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? { type: T[K]['presets'][number]['value'] | null | '_custom_'; custom?: { url: string; } | null; fit?: 'cover' | 'contain' | 'stretch'; } :
	T[K] extends SeedOptionSchema ? number :
	never;
};

export type SnapshotRenderingHelperWrapper = {
	updateMesh: (meshes: BABYLON.Mesh[]) => void;
	reset: () => void;
	fixParticleSystem: (ps: BABYLON.ParticleSystem) => void;
};

export type ObjectDef<OpSc extends OptionsSchema = OptionsSchema> = {
	id: string;
	name: string;
	options: {
		schema: string extends keyof OpSc ? OptionsSchema : OpSc;
		default: string extends keyof OpSc ? RawOptions : GetRawOptionsSchemaValues<OpSc>;
	};
	placement: 'top' | 'side' | 'bottom' | 'wall' | 'ceiling' | 'floor';
	hasCollisions?: boolean;
	hasTexture?: boolean;
	canPreMeshesMerging?: boolean; // TODO: 除外するメッシュ名を指定できるようにする
	//groupingMeshes: string[]; // multi-materialなメッシュは複数のメッシュに分割されるが、それだと不便な場合に追加の親メッシュでグルーピングするための指定
	isChair?: boolean;
	treatLoaderResult?: (loaderResult: BABYLON.AssetContainer) => void;
	path?: (options: string extends keyof OpSc ? ConvertedOptions : Readonly<GetConvertedOptionsSchemaValues<OpSc>>) => string;
	createInstance: (args: {
		scene: BABYLON.Scene;
		// TODO: snapshot renderingの関心を隠蔽した方が綺麗かもしれない
		// 例えばmaterialUpdatedというメソッドを用意して内部的にresetを呼ぶなど
		sr: SnapshotRenderingHelperWrapper;
		lc: BABYLON.ClusteredLightContainer | null;
		root: BABYLON.TransformNode;
		options: string extends keyof OpSc ? ConvertedOptions : Readonly<GetConvertedOptionsSchemaValues<OpSc>>;
		model: ModelManager;
		id: string;
		timer: Timer;
		graphicsQuality: number;
		stickyMarkerMeshUpdated?: (mesh: BABYLON.Mesh) => void;
		sitChair?: () => void;
		reloadModel: () => void;
	}) => RoomObjectInstance<string extends keyof OpSc ? ConvertedOptions : GetConvertedOptionsSchemaValues<OpSc>> | Promise<RoomObjectInstance<OpSc extends undefined ? ConvertedOptions : GetConvertedOptionsSchemaValues<OpSc>>>; // TODO: createInstanceをasyncにするのではなく、別にreadyみたいなものを返させる
};

export function defineObject<const OpSc extends OptionsSchema>(def: ObjectDef<OpSc>): ObjectDef<OpSc> {
	return def;
}

export function defineObjectClass<const OpSc extends OptionsSchema>(baseDef: Partial<ObjectDef<OpSc>>): {
	extend: (childDef: Partial<ObjectDef<OpSc>>) => ObjectDef<OpSc>;
} {
	return {
		extend: (childDef) => ({ ...baseDef, ...childDef }) as ObjectDef<OpSc>,
	};
}

export function convertRawOptions<OpSc extends OptionsSchema>(schema: OpSc, raw: RawOptions, attachments: RoomAttachments): ConvertedOptions {
	const converted = {} as ConvertedOptions;
	for (const record of Object.entries(schema)) {
		const k = record[0];
		const v = raw[k];
		if (record[1].type === 'image') {
			const file = v.type === '_custom_' ? attachments.files.find(f => f.id === v.driveFileId) : null;
			if (file != null && file.url.startsWith('http://syu-win.local:3000/')) { // debug
				file.url = file.url.replace('http://syu-win.local:3000/', 'https://local-mi.syuilo.dev/');
			}

			converted[k] = { type: v.type, custom: file != null ? { url: file.url } : null, fit: v.fit };
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
			currentTexture!.level = 0.5;
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
