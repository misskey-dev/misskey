/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type EnumItem = string | {label: string; value: string;};
export type FormItem = {
	label?: string;
	type: 'string';
	default: string | null;
	hidden?: boolean;
	multiline?: boolean;
} | {
	label?: string;
	type: 'number';
	default: number | null;
	hidden?: boolean;
	step?: number;
} | {
	label?: string;
	type: 'boolean';
	default: boolean | null;
	hidden?: boolean;
} | {
	label?: string;
	type: 'enum';
	default: string | null;
	hidden?: boolean;
	enum: EnumItem[];
} | {
	label?: string;
	type: 'radio';
	default: unknown | null;
	hidden?: boolean;
	options: {
		label: string;
		value: unknown;
	}[];
} | {
	label?: string;
	type: 'object';
	default: Record<string, unknown> | null;
	hidden: true;
} | {
	label?: string;
	type: 'array';
	default: unknown[] | null;
	hidden: true;
};

export type Form = Record<string, FormItem>;

type GetItemType<Item extends FormItem> =
	Item['type'] extends 'string' ? string :
	Item['type'] extends 'number' ? number :
	Item['type'] extends 'boolean' ? boolean :
	Item['type'] extends 'radio' ? unknown :
	Item['type'] extends 'enum' ? string :
	Item['type'] extends 'array' ? unknown[] :
	Item['type'] extends 'object' ? Record<string, unknown>
	: never;

export type GetFormResultType<F extends Form> = {
	[P in keyof F]: GetItemType<F[P]>;
};
