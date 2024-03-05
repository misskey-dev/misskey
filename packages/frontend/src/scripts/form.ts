/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type EnumItem = string | {
	label: string;
	value: string;
};

export type FormItem = {
	label?: string;
	type: 'string';
	default: string | null;
	description?: string;
	required?: boolean;
	hidden?: boolean;
	multiline?: boolean;
	treatAsMfm?: boolean;
} | {
	label?: string;
	type: 'number';
	default: number | null;
	description?: string;
	required?: boolean;
	hidden?: boolean;
	step?: number;
} | {
	label?: string;
	type: 'boolean';
	default: boolean | null;
	description?: string;
	hidden?: boolean;
} | {
	label?: string;
	type: 'enum';
	default: string | null;
	required?: boolean;
	hidden?: boolean;
	enum: EnumItem[];
} | {
	label?: string;
	type: 'radio';
	default: unknown | null;
	required?: boolean;
	hidden?: boolean;
	options: {
		label: string;
		value: unknown;
	}[];
} | {
	label?: string;
	type: 'range';
	default: number | null;
	description?: string;
	required?: boolean;
	step?: number;
	min: number;
	max: number;
	textConverter?: (value: number) => string;
} | {
	label?: string;
	type: 'object';
	default: Record<string, unknown> | null;
	hidden: boolean;
} | {
	label?: string;
	type: 'array';
	default: unknown[] | null;
	hidden: boolean;
} | {
	type: 'button';
	content?: string;
	action: (ev: MouseEvent, v: any) => void;
};

export type Form = Record<string, FormItem>;

type GetItemType<Item extends FormItem> =
	Item['type'] extends 'string' ? string :
	Item['type'] extends 'number' ? number :
	Item['type'] extends 'boolean' ? boolean :
	Item['type'] extends 'radio' ? unknown :
	Item['type'] extends 'range' ? number :
	Item['type'] extends 'enum' ? string :
	Item['type'] extends 'array' ? unknown[] :
	Item['type'] extends 'object' ? Record<string, unknown>
	: never;

export type GetFormResultType<F extends Form> = {
	[P in keyof F]: GetItemType<F[P]>;
};
