import autobind from 'autobind-decorator';
import { AiScript } from "@syuilo/aiscript";
import { ref, Ref } from 'vue';
import { valToJs } from '@syuilo/aiscript/built/interpreter/util';

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
	public envVars: Record<string, any>; // js literal
	public inputVars: Record<string, any>;
	public vars: Ref<Record<string, any>> = ref({});

	constructor(page: Page, aiscript: AiScript) {
		this.page = page;
		this.aiscript = aiscript;
		this.envVars = this.collectEnvVars();
		this.inputVars = this.collectInputVars();

		this.aiscript.scope.opts.onUpdated = (name, value) => {
			this.vars.value = this.collectVars();
		};

		// when the last line of the script is executed:
		// this.vars.value = this.collectVars();
	}

	@autobind
	public collectEnvVars() {
		// TODO
		return {};
	}

	@autobind
	public collectInputVars() {
		// TODO
		return {};
	}

	@autobind
	public collectScriptVars() {
		const vars: Record<string, any> = {};
		for (const [k, v] of this.aiscript.scope.getAll()) {
			if (v.attr == null) continue;
			const exportAttr = v.attr.find(attr => (attr.name == 'export'));
			if (exportAttr == null) continue;
			try {
				vars[k] = valToJs(v);
			} catch (e) {
				// noop
			}
		}
		return vars;
	}

	@autobind
	public collectVars() {
		const vars: Record<string, any> = {};
		for (const k of Object.keys(this.envVars)) {
			vars[k] = this.envVars[k];
		}
		for (const k of Object.keys(this.inputVars)) {
			vars[k] = this.inputVars[k];
		}
		const scriptVars = this.collectScriptVars();
		for (const k of Object.keys(scriptVars)) {
			vars[k] = scriptVars[k];
		}
		return vars;
	}
}
