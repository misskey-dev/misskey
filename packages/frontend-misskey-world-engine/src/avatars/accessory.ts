/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { ModelExplorer, type Timer } from '../utility.js';
import type { AccessorySchemaDef } from 'misskey-world/src/avatars/accessory.js';
import type { OptionsSchema } from 'misskey-world/src/mono.js';
import type { ConvertedOptions, GetConvertedOptionsSchemaValues } from '../mono.js';

export type AvatarAccessoryInstance<Options = any> = {
	onOptionsUpdated?: <K extends keyof Options, V extends Options[K]>(kv: [K, V]) => void;
	dispose: () => void;
};

export type SnapshotRenderingHelperWrapper = {
	updateMesh: (meshes: BABYLON.Mesh[]) => void;
	reset: () => void;
	fixParticleSystem: (ps: BABYLON.ParticleSystem) => void;
};

export type AvatarAccessoryDef<Schema extends AccessorySchemaDef = AccessorySchemaDef> = Schema & {
	path?: (options: string extends keyof Schema['options']['schema'] ? ConvertedOptions : Readonly<GetConvertedOptionsSchemaValues<Schema['options']['schema']>>) => string;
	createInstance: (args: {
		scene: BABYLON.Scene;
		// TODO: snapshot renderingの関心を隠蔽した方が綺麗かもしれない
		// 例えばmaterialUpdatedというメソッドを用意して内部的にresetを呼ぶなど
		sr: SnapshotRenderingHelperWrapper;
		lc: BABYLON.ClusteredLightContainer | null;
		root: BABYLON.TransformNode;
		options: string extends keyof Schema['options']['schema'] ? ConvertedOptions : Readonly<GetConvertedOptionsSchemaValues<Schema['options']['schema']>>;
		model: ModelExplorer;
		timer: Timer;
		graphicsQuality: number;
		reloadModel: () => void;
	}) => AvatarAccessoryInstance<string extends keyof Schema['options']['schema'] ? ConvertedOptions : GetConvertedOptionsSchemaValues<Schema['options']['schema']>> | Promise<AvatarAccessoryInstance<Schema['options']['schema'] extends undefined ? ConvertedOptions : GetConvertedOptionsSchemaValues<Schema['options']['schema']>>>; // TODO: createInstanceをasyncにするのではなく、別にreadyみたいなものを返させる
};

export function defineAccessorySchema<const OpSc extends OptionsSchema>(def: AccessorySchemaDef<OpSc>): AccessorySchemaDef<OpSc> {
	return def;
}

export function defineAccessory<const Schema extends AccessorySchemaDef<any>>(schema: Schema, def: Pick<AvatarAccessoryDef<Schema>, 'path' | 'createInstance'>): AvatarAccessoryDef<Schema> {
	return { ...schema, ...def };
}
