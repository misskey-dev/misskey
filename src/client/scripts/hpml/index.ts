/**
 * Hpml
 */

import autobind from 'autobind-decorator';
import {
	faMagic,
	faSquareRootAlt,
	faAlignLeft,
	faList,
	faQuoteRight,
	faSortNumericUp,
} from '@fortawesome/free-solid-svg-icons';
import { Hpml } from './evaluator';
import { funcDefs } from './lib';

export type Fn = {
	slots: string[];
	exec: (args: Record<string, any>) => ReturnType<Hpml['evaluate']>;
};

export type Type = 'string' | 'number' | 'boolean' | 'stringArray' | null;

export const literalDefs: Record<string, { out: any; category: string; icon: any; }> = {
	text:          { out: 'string',      category: 'value', icon: 'fas fa-quote-right', },
	multiLineText: { out: 'string',      category: 'value', icon: 'fas fa-align-left', },
	textList:      { out: 'stringArray', category: 'value', icon: 'fas fa-list', },
	number:        { out: 'number',      category: 'value', icon: 'fas fa-sort-numeric-up', },
	ref:           { out: null,          category: 'value', icon: 'fas fa-magic', },
	aiScriptVar:   { out: null,          category: 'value', icon: 'fas fa-magic', },
	fn:            { out: 'function',    category: 'value', icon: 'fas fa-square-root-alt', },
};

export const blockDefs = [
	...Object.entries(literalDefs).map(([k, v]) => ({
		type: k, out: v.out, category: v.category, icon: v.icon
	})),
	...Object.entries(funcDefs).map(([k, v]) => ({
		type: k, out: v.out, category: v.category, icon: v.icon
	}))
];

export type PageVar = { name: string; value: any; type: Type; };

export const envVarsDef: Record<string, Type> = {
	AI: 'string',
	URL: 'string',
	VERSION: 'string',
	LOGIN: 'boolean',
	NAME: 'string',
	USERNAME: 'string',
	USERID: 'string',
	NOTES_COUNT: 'number',
	FOLLOWERS_COUNT: 'number',
	FOLLOWING_COUNT: 'number',
	IS_CAT: 'boolean',
	SEED: null,
	YMD: 'string',
	AISCRIPT_DISABLED: 'boolean',
	NULL: null,
};

export class HpmlScope {
	private layerdStates: Record<string, any>[];
	public name: string;

	constructor(layerdStates: HpmlScope['layerdStates'], name?: HpmlScope['name']) {
		this.layerdStates = layerdStates;
		this.name = name || 'anonymous';
	}

	@autobind
	public createChildScope(states: Record<string, any>, name?: HpmlScope['name']): HpmlScope {
		const layer = [states, ...this.layerdStates];
		return new HpmlScope(layer, name);
	}

	/**
	 * 指定した名前の変数の値を取得します
	 * @param name 変数名
	 */
	@autobind
	public getState(name: string): any {
		for (const later of this.layerdStates) {
			const state = later[name];
			if (state !== undefined) {
				return state;
			}
		}

		throw new HpmlError(
			`No such variable '${name}' in scope '${this.name}'`, {
				scope: this.layerdStates
			});
	}
}

export class HpmlError extends Error {
	public info?: any;

	constructor(message: string, info?: any) {
		super(message);

		this.info = info;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, HpmlError);
		}
	}
}
