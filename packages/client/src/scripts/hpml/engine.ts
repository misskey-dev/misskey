import autobind from 'autobind-decorator';
import { AiScript, Parser, values, utils } from '@syuilo/aiscript';
import { Node, NAttr } from '@syuilo/aiscript/built/node';
import { markRaw, ref, Ref, unref } from 'vue';
import { HpmlError } from '.';
import { createAiScriptEnv } from '../aiscript/api';
import { initAiLib } from './lib';
import { Variable } from './expr';
import { transformInputAssign } from './ast/transform-input-assign';
import { collectVariables } from './ast/collect-variables';

type Page = Record<string, any> & {
	version: string;
	id: any;
	user: any;
	blocks: any[];
	statements: any[];
	script?: string;
	attachedFiles: any[];
};

export type VariableInfo = {
	defined: boolean;
	value?: any;
	attrs: NAttr[];
	inputAttr?: {
		blockType: string;
	};
};

export const inputBlockTable: Record<string, 'string' | 'number' | 'boolean'> = {
	textInput: 'string',
	textareaInput: 'string',
	numberInput: 'number',
	switch: 'boolean',
	counter: 'number',
	radioButton: 'string',
};

/**
 * Pages Engine
 */
export class Hpml {
	public page: Page;
	public aiscript: AiScript;
	public statements: Variable[];
	public ast?: Node[];
	public variableInfos: Record<string, VariableInfo> = {}; // variable source infos
	public vars: Ref<Record<string, any>> = ref({}); // variable values for blocks
	public pageVarUpdatedCallback?: values.VFn;
	public canvases: Record<string, HTMLCanvasElement> = {};

	constructor(page: Record<string, any>, opts?: Record<string, any>) {
		// if (page.version != '2') {
		// 	throw new HpmlError('The version of this page is not supported.');
		// }
		opts = opts || {};
		this.page = (page as Page);
		this.statements = this.page.statements;
		this.aiscript = markRaw(new AiScript({
			...createAiScriptEnv({ storageKey: 'pages:' + this.page.id }),
			...initAiLib(this)
		}, opts.ai));

		this.aiscript.scope.opts.onUpdated = (name, value) => {
			this.refreshVar(name);
		};
	}

	@autobind
	public load() {
		// parse script
		if (this.page.script != null) {
			try {
				this.ast = Parser.parse(this.page.script);
			} catch (e) {
				throw new HpmlError('Failed to parse the script.');
			}
		} else {
			this.ast = [];
		}
		// static analysis process
		this.variableInfos = collectVariables(this.ast);
		transformInputAssign(this.ast, this.variableInfos);
	}

	@autobind
	public interpolate(str: string) {
		if (str == null) return null;
		const vars = unref(this.vars);
		return str.replace(/{(.+?)}/g, match => {
			const v = vars[match.slice(1, -1).trim()];
			return v == null ? 'NULL' : v.toString();
		});
	}

	@autobind
	public registerCanvas(id: string, canvas: any) {
		this.canvases[id] = canvas;
	}

	@autobind
	public refreshVar(name: string) {
		if (this.variableInfos[name] == null) return;
		const info = this.variableInfos[name];
		// TODO: validate type of input block variable
		try {
			const value = this.aiscript.scope.get(name);
			info.defined = true;
			info.value = utils.valToJs(value);
		} catch (e) {
			// variable is not defined
			info.defined = false;
			info.value = null;
		}
		this.vars.value[name] = info.value;
	}

	@autobind
	public refreshVars() {
		const vars: Record<string, any> = {};
		for (const [name, info] of Object.entries(this.variableInfos)) {
			// TODO: validate type of input block variable
			try {
				const value = this.aiscript.scope.get(name);
				info.defined = true;
				info.value = utils.valToJs(value);
			} catch (e) {
				// variable is not defined
				info.defined = false;
				info.value = null;
			}
			vars[name] = info.value;
		}
		this.vars.value = vars;
	}

	@autobind
	public updatePageVar(name: string, value: any) {
		if (this.variableInfos[name] == null || this.variableInfos[name].inputAttr == null) {
			throw new HpmlError(`No such input var '${name}'`);
		}
		if (this.pageVarUpdatedCallback) {
			this.aiscript.execFn(this.pageVarUpdatedCallback, [values.STR(name), utils.jsToVal(value)]);
		}
	}

	@autobind
	public async run() {
		if (this.ast == null) {
			throw new HpmlError('The load() has not been called');
		}
		await this.aiscript.exec(this.ast);
		this.refreshVars();
	}

	@autobind
	public abort() {
		this.aiscript.abort();
	}
}
