/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Component } from 'vue';
import type { ROLE_POLICIES } from '@@/js/const.js';

interface RolePolicyEditorItemBase<T = unknown> {
	searchTerms?: string[];
	type: string;
	folderLabel: string;
	folderSuffix?: string | ((value: T) => string);
	inputLabel?: string;
	inputCaption?: string | Component;
}

export type RolePolicyEditorItemBaseFolderSuffixGetter = {
	folderSuffix: (value: boolean | number | string) => string;
};

interface RolePolicyEditorItemBoolean extends RolePolicyEditorItemBase<boolean> {
	type: 'boolean';
}

interface RolePolicyEditorItemNumber extends RolePolicyEditorItemBase<number> {
	type: 'number';
	min?: number;
	max?: number;
	inputPrefix?: string;
	inputSuffix?: string;
}

interface RolePolicyEditorItemRange extends RolePolicyEditorItemBase<number> {
	type: 'range';
	min: number;
	max: number;
	step?: number;
	textConverter?: (value: number) => string;
	inputPrefix?: string;
	inputSuffix?: string;
}

interface RolePolicyEditorItemString extends RolePolicyEditorItemBase<string> {
	type: 'string';
	multiline?: boolean;
}

interface RolePolicyEditorItemEnum extends RolePolicyEditorItemBase<string> {
	type: 'enum';
	enum: {
		label: string;
		value: string;
	}[];
}

export type RolePolicyEditorItem =
	RolePolicyEditorItemBoolean |
	RolePolicyEditorItemNumber |
	RolePolicyEditorItemRange |
	RolePolicyEditorItemString |
	RolePolicyEditorItemEnum;

export type RolePolicyEditorDef = Record<typeof ROLE_POLICIES[number], RolePolicyEditorItem>;

export type GetRolePolicyEditorValuesType<T extends RolePolicyEditorItem> =
	T extends RolePolicyEditorItemBoolean ? boolean :
	T extends RolePolicyEditorItemNumber ? number :
	T extends RolePolicyEditorItemRange ? number :
	T extends RolePolicyEditorItemString ? string :
	T extends RolePolicyEditorItemEnum ? T['enum'][number]['value'] :
	never;

export type RolePolicyValueRecord<T extends Record<string, RolePolicyEditorItem>> = {
	[K in keyof T]: {
		value: GetRolePolicyEditorValuesType<T[K]>;
	};
};

export type RolePolicySettingsRecord<T extends Record<string, RolePolicyEditorItem>> = {
	[K in keyof T]: {
		value: GetRolePolicyEditorValuesType<T[K]>;
		useDefault: boolean;
		priority: 0 | 1 | 2;
	};
};
