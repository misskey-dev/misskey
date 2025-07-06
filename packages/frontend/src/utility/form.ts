/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export type EnumItem = string | {
	label: string;
	value: unknown;
};

type Hidden = boolean | ((v: any) => boolean);

interface FormItemBase {
	label?: string;
	hidden?: Hidden;
}

export interface StringFormItem extends FormItemBase {
	type: 'string';
	default?: string | null;
	description?: string;
	required?: boolean;
	multiline?: boolean;
	treatAsMfm?: boolean;
}

export interface NumberFormItem extends FormItemBase {
	type: 'number';
	default?: number | null;
	description?: string;
	required?: boolean;
	step?: number;
}

export interface BooleanFormItem extends FormItemBase {
	type: 'boolean';
	default?: boolean | null;
	description?: string;
}

export interface EnumFormItem extends FormItemBase {
	type: 'enum';
	default?: string | null;
	required?: boolean;
	enum: EnumItem[];
}

export interface RadioFormItem extends FormItemBase {
	type: 'radio';
	default?: unknown | null;
	required?: boolean;
	options: {
		label: string;
		value: unknown;
	}[];
}

export interface RangeFormItem extends FormItemBase {
	type: 'range';
	default?: number | null;
	description?: string;
	required?: boolean;
	step?: number;
	min: number;
	max: number;
	textConverter?: (value: number) => string;
}

export interface ObjectFormItem extends FormItemBase {
	type: 'object';
	default?: Record<string, unknown> | null;
}

export interface ArrayFormItem extends FormItemBase {
	type: 'array';
	default?: unknown[] | null;
}

export interface ButtonFormItem extends FormItemBase {
	type: 'button';
	content?: string;
	action: (ev: MouseEvent, v: any) => void;
}

export interface DriveFileFormItem extends FormItemBase {
	type: 'drive-file';
	defaultFileId?: string | null;
	validate?: (v: Misskey.entities.DriveFile) => Promise<boolean>;
}

export type FormItem =
	StringFormItem |
	NumberFormItem |
	BooleanFormItem |
	EnumFormItem |
	RadioFormItem |
	RangeFormItem |
	ObjectFormItem |
	ArrayFormItem |
	ButtonFormItem |
	DriveFileFormItem;

export type Form = Record<string, FormItem>;

export type FormItemWithDefault = FormItem & {
	default: unknown;
};

export type FormWithDefault = Record<string, FormItemWithDefault>;

type GetRadioItemType<Item extends RadioFormItem = RadioFormItem> = Item['options'][number]['value'];
type GetEnumItemType<Item extends EnumFormItem, E = Item['enum'][number]> = E extends { value: unknown } ? E['value'] : E;

type InferDefault<T, Fallback> = T extends { default: infer D }
	? D extends undefined ? Fallback : D
	: Fallback;

type NonNullableIfRequired<T, Item extends FormItem> =
	Item extends { required: false } ? T | null | undefined : NonNullable<T>;

type GetItemType<Item extends FormItem> =
	Item extends StringFormItem
		? NonNullableIfRequired<InferDefault<Item, string>, Item>
	: Item extends NumberFormItem
		? NonNullableIfRequired<InferDefault<Item, number>, Item>
	: Item extends BooleanFormItem
		? boolean
	: Item extends RadioFormItem
		? GetRadioItemType<Item>
	: Item extends RangeFormItem
		? NonNullableIfRequired<InferDefault<RangeFormItem, number>, Item>
	: Item extends EnumFormItem
		? GetEnumItemType<Item>
	: Item extends ArrayFormItem
		? NonNullableIfRequired<InferDefault<ArrayFormItem, unknown[]>, Item>
	: Item extends ObjectFormItem
		? NonNullableIfRequired<InferDefault<Item, Record<string, unknown>>, Item>
	: Item extends DriveFileFormItem
		? Misskey.entities.DriveFile | undefined
	: never;

export type GetFormResultType<F extends Form> = {
	[P in keyof F]: GetItemType<F[P]>;
};
