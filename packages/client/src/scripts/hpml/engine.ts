import autobind from 'autobind-decorator';
import { AiScript, values, utils } from "@syuilo/aiscript";
import { ref, Ref } from 'vue';
import { HpmlError } from '.';

type Page = Record<string, any> & {
	id: any;
	user: any;
	blocks: any[];
	statements: any[];
	script: string;
};

export class HpmlEngine {
	public page: Page;
	public aiscript: AiScript;
	public inputVars: string[] = [];
	public vars: Ref<Record<string, any>> = ref({});
	public inputVarUpdatedCallback?: values.VFn;

	constructor(page: Page, aiscript: AiScript) {
		this.page = page;
		this.aiscript = aiscript;

		this.aiscript.scope.opts.onUpdated = (name, value) => {
			const { vars, inputVars } = this.collectVars();
			this.vars.value = vars;
			this.inputVars = inputVars;
		};
		// when the last line of the script is executed:
		// this.vars.value = this.collectVars();
	}

	@autobind
	public collectVars() {
		// collects aiscript variables
		const vars: Record<string, any> = {};
		const inputVars: string[] = [];
		for (const [name, value] of this.aiscript.scope.getAll()) {
			if (value.attr == null) continue;

			// export attribute
			const exportAttr = value.attr.find(attr => (attr.name == 'export'));
			if (exportAttr == null) continue;

			// input attribute
			const inputAttr = value.attr.find(attr => (attr.name == 'input'));
			if (inputAttr != null) {
				if (!['str', 'num', 'bool'].includes(value.type)) {
					throw new HpmlError(`cannot use type '${value.type}' for input variable`);
				}
				inputVars.push(name);
			}

			try {
				vars[name] = utils.valToJs(value);
			} catch (e) {}
		}
		return { vars, inputVars };
	}

	@autobind
	public updateInputVar(name: string, value: any) {
		// if (!Object.keys(this.inputVars).includes(name)) {
		// 	throw new HpmlError(`No such input var '${name}'`);
		// }
		if (this.inputVarUpdatedCallback) {
			this.aiscript.execFn(this.inputVarUpdatedCallback, [values.STR(name), utils.jsToVal(value)]);
		}
		const { vars, inputVars } = this.collectVars();
		this.vars.value = vars;
		this.inputVars = inputVars;
	}
}
