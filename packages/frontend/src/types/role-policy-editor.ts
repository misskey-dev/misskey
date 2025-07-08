/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Component } from 'vue';
import type { ROLE_POLICIES } from '@@/js/const.js';

interface RolePolicyDefItemBase<T = any> {
	searchTerms?: string[];
	type: string;
	displayLabel: string;
	displayValue?: string | ((value: T, full?: boolean) => string);
	inputLabel?: string;
	inputCaption?: string | Component;
}

export type RolePolicyDefItemBaseDisplayValueGetter = {
	displayValue: (value: boolean | number | string, full?: boolean) => string;
};

interface RolePolicyDefItemBoolean extends RolePolicyDefItemBase<boolean> {
	type: 'boolean';
}

interface RolePolicyDefItemNumber extends RolePolicyDefItemBase<number> {
	type: 'number';
	min?: number;
	max?: number;
	inputPrefix?: string;
	inputSuffix?: string;
}

interface RolePolicyDefItemRange extends RolePolicyDefItemBase<number> {
	type: 'range';
	min: number;
	max: number;
	step?: number;
	textConverter?: (value: number) => string;
	inputPrefix?: string;
	inputSuffix?: string;
}

interface RolePolicyDefItemString extends RolePolicyDefItemBase<string> {
	type: 'string';
	multiline?: boolean;
}

interface RolePolicyDefItemEnum extends RolePolicyDefItemBase<string> {
	type: 'enum';
	enum: {
		label: string;
		value: string;
	}[];
}

export type RolePolicyDefItem =
	RolePolicyDefItemBoolean |
	RolePolicyDefItemNumber |
	RolePolicyDefItemRange |
	RolePolicyDefItemString |
	RolePolicyDefItemEnum;

export type RolePolicyDef = Record<typeof ROLE_POLICIES[number], RolePolicyDefItem>;

export type GetRolePolicyEditorValuesType<T extends RolePolicyDefItem> =
	T extends RolePolicyDefItemBoolean ? boolean :
	T extends RolePolicyDefItemNumber ? number :
	T extends RolePolicyDefItemRange ? number :
	T extends RolePolicyDefItemString ? string :
	T extends RolePolicyDefItemEnum ? T['enum'][number]['value'] :
	never;

export type RolePolicyValueRecord<T extends Record<string, RolePolicyDefItem>> = {
	[K in keyof T]: {
		value: GetRolePolicyEditorValuesType<T[K]>;
	};
};

export type RolePolicySettingsRecord<T extends Record<string, RolePolicyDefItem>> = {
	[K in keyof T]: {
		value: GetRolePolicyEditorValuesType<T[K]>;
		useDefault: boolean;
		priority: 0 | 1 | 2;
	};
};
