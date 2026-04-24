/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import type { RoomEngine } from './engine.js';
import type { ModelManager } from './utility.js';
import type { Timer } from '../utility.js';

// babylonのドメイン知識は持たない
export type RoomStateObject<Options = any> = {
	id: string;
	type: string;
	position: [number, number, number];
	rotation: [number, number, number];
	options: Options;

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

type ColorOptionSchema = {
	type: 'color';
	label: string;
};

type EnumOptionSchema = {
	type: 'enum';
	label: string;
	enum: string[];
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
};

type SeedOptionSchema = {
	type: 'seed';
	label: string;
};

type OptionsSchema = Record<string, NumberOptionSchema | BooleanOptionSchema | ColorOptionSchema | EnumOptionSchema | RangeOptionSchema | ImageOptionSchema | SeedOptionSchema>;

type GetOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? string | null :
	T[K] extends SeedOptionSchema ? number :
	never;
};

export type ObjectDef<OpSc extends OptionsSchema = OptionsSchema> = {
	id: string;
	name: string;
	path?: string;
	options: {
		schema: OpSc;
		default: GetOptionsSchemaValues<OpSc>;
	};
	placement: 'top' | 'side' | 'bottom' | 'wall' | 'ceiling' | 'floor';
	hasCollisions?: boolean;
	hasTexture?: boolean;
	canPreMeshesMerging?: boolean;
	//groupingMeshes: string[]; // multi-materialなメッシュは複数のメッシュに分割されるが、それだと不便な場合に追加の親メッシュでグルーピングするための指定
	isChair?: boolean;
	treatLoaderResult?: (loaderResult: BABYLON.AssetContainer) => void;
	createInstance: (args: {
		room?: RoomEngine | null;
		scene: BABYLON.Scene;
		root: BABYLON.Mesh;
		options: Readonly<GetOptionsSchemaValues<OpSc>>;
		model: ModelManager;
		id: string;
		timer: Timer;
		stickyMarkerMeshUpdated?: (mesh: BABYLON.Mesh) => void;
	}) => RoomObjectInstance<GetOptionsSchemaValues<OpSc>> | Promise<RoomObjectInstance<GetOptionsSchemaValues<OpSc>>>; // TODO: createInstanceをasyncにするのではなく、別にreadyみたいなものを返させる
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
