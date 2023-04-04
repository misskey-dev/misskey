import { isLiteralValue } from './expr';
import { funcDefs } from './lib';
import { envVarsDef } from '.';
import type { Type, PageVar } from '.';
import type { Expr, Variable } from './expr';

type TypeError = {
	arg: number;
	expect: Type;
	actual: Type;
};

/**
 * Hpml type checker
 */
export class HpmlTypeChecker {
	public variables: Variable[];
	public pageVars: PageVar[];

	constructor(variables: HpmlTypeChecker['variables'] = [], pageVars: HpmlTypeChecker['pageVars'] = []) {
		this.variables = variables;
		this.pageVars = pageVars;
	}

	public typeCheck(v: Expr): TypeError | null {
		if (isLiteralValue(v)) return null;

		const def = funcDefs[v.type || ''];
		if (def == null) {
			throw new Error('Unknown type: ' + v.type);
		}

		const generic: Type[] = [];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			const type = this.infer(v.args[i]);
			if (type === null) continue;

			if (typeof arg === 'number') {
				if (generic[arg] === undefined) {
					generic[arg] = type;
				} else if (type !== generic[arg]) {
					return {
						arg: i,
						expect: generic[arg],
						actual: type,
					};
				}
			} else if (type !== arg) {
				return {
					arg: i,
					expect: arg,
					actual: type,
				};
			}
		}

		return null;
	}

	public getExpectedType(v: Expr, slot: number): Type {
		const def = funcDefs[v.type ?? ''];
		if (def == null) {
			throw new Error('Unknown type: ' + v.type);
		}

		const generic: Type[] = [];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			const type = this.infer(v.args[i]);
			if (type === null) continue;

			if (typeof arg === 'number') {
				if (generic[arg] === undefined) {
					generic[arg] = type;
				}
			}
		}

		if (typeof def.in[slot] === 'number') {
			return generic[def.in[slot]] ?? null;
		} else {
			return def.in[slot];
		}
	}

	public infer(v: Expr): Type {
		if (v.type === null) return null;
		if (v.type === 'text') return 'string';
		if (v.type === 'multiLineText') return 'string';
		if (v.type === 'textList') return 'stringArray';
		if (v.type === 'number') return 'number';
		if (v.type === 'ref') {
			const variable = this.variables.find(va => va.name === v.value);
			if (variable) {
				return this.infer(variable);
			}

			const pageVar = this.pageVars.find(va => va.name === v.value);
			if (pageVar) {
				return pageVar.type;
			}

			const envVar = envVarsDef[v.value ?? ''];
			if (envVar !== undefined) {
				return envVar;
			}

			return null;
		}
		if (v.type === 'aiScriptVar') return null;
		if (v.type === 'fn') return null; // todo
		if (v.type.startsWith('fn:')) return null; // todo

		const generic: Type[] = [];

		const def = funcDefs[v.type];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			if (typeof arg === 'number') {
				const type = this.infer(v.args[i]);

				if (generic[arg] === undefined) {
					generic[arg] = type;
				} else {
					if (type !== generic[arg]) {
						generic[arg] = null;
					}
				}
			}
		}

		if (typeof def.out === 'number') {
			return generic[def.out];
		} else {
			return def.out;
		}
	}

	public getVarByName(name: string): Variable {
		const v = this.variables.find(x => x.name === name);
		if (v !== undefined) {
			return v;
		} else {
			throw new Error(`No such variable '${name}'`);
		}
	}

	public getVarsByType(type: Type): Variable[] {
		if (type == null) return this.variables;
		return this.variables.filter(x => (this.infer(x) === null) || (this.infer(x) === type));
	}

	public getEnvVarsByType(type: Type): string[] {
		if (type == null) return Object.keys(envVarsDef);
		return Object.entries(envVarsDef).filter(([k, v]) => v === null || type === v).map(([k, v]) => k);
	}

	public getPageVarsByType(type: Type): string[] {
		if (type == null) return this.pageVars.map(v => v.name);
		return this.pageVars.filter(v => type === v.type).map(v => v.name);
	}

	public isUsedName(name: string) {
		if (this.variables.some(v => v.name === name)) {
			return true;
		}

		if (this.pageVars.some(v => v.name === name)) {
			return true;
		}

		if (envVarsDef[name]) {
			return true;
		}

		return false;
	}
}
