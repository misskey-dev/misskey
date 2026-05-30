/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GetRawOptionsSchemaValues, OptionsSchema, RawOptions } from '../mono.js';

export type RoomState_InstalledFurniture = {
	id: string;
	type: string;
	position: [number, number, number];
	rotation: [number, number, number];
	options: RawOptions;

	/**
	 * 別の家具のID
	 */
	sticky?: string | null;
};

export type FurnitureSchemaDef<OpSc extends OptionsSchema = OptionsSchema> = {
	id: string;
	options: {
		schema: string extends keyof OpSc ? OptionsSchema : OpSc;
		default: string extends keyof OpSc ? RawOptions : GetRawOptionsSchemaValues<OpSc>; // 関数にした方が使用側でdeepCloneの必要がなくて綺麗かもしれない
	};
	placement: 'top' | 'side' | 'bottom' | 'wall' | 'ceiling' | 'floor';
	hasCollisions?: boolean;
	hasTexture?: boolean;
	canPreMeshesMerging?: boolean; // TODO: 除外するメッシュ名を指定できるようにする
	isChair?: boolean;
};

export function defineFurnitureSchema<const OpSc extends OptionsSchema>(def: FurnitureSchemaDef<OpSc>): FurnitureSchemaDef<OpSc> {
	return def;
}
