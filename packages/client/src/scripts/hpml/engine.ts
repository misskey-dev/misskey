import autobind from 'autobind-decorator';
import { AiScript, Parser, values, utils } from '@syuilo/aiscript';
import { Node, NAttr, NCall, NFn } from '@syuilo/aiscript/built/node';
import { markRaw, ref, Ref, unref } from 'vue';
import { HpmlError } from '.';
import { createAiScriptEnv } from '../aiscript/api';
import { initAiLib } from './lib';

type Page = Record<string, any> & {
	version: string;
	id: any;
	user: any;
	blocks: any[];
	statements: any[];
	script?: string;
	attachedFiles: any[];
};

type VariableInfo = {
	defined: boolean;
	value?: any;
	attrs: NAttr[];
	inputAttr?: {
		blockType: string;
	};
};

const inputBlockTable: Record<string, 'string' | 'number' | 'boolean'> = {
	textInput: 'string',
	textareaInput: 'string',
	numberInput: 'number',
	switch: 'boolean',
	counter: 'number',
	radioButton: 'string',
};

// MkPages:updated()
function generateUpdated(ast: Node[]) {
		const updated = {
			nameArg: 'name',
			valueArg: 'value'
		} as { call?: NCall, fn?: NFn, nameArg: string, valueArg: string };

		// find call node
		for (const node of ast) {
			if (node.type == 'call' && node.name == 'MkPages:updated') {
				updated.call = node;
			}
		}

		// generate fn node, call node as needed
		if (updated.call != null) {
			updated.fn = updated.call.args[0] as NFn;
			updated.nameArg = updated.fn.args[0].name;
			updated.valueArg = updated.fn.args[1].name;
		} else {
			updated.fn = {
				type: 'fn',
				args: [
					{ name: 'name' },
					{ name: 'value' }
				],
				children: []
			};
			updated.call = {
				type: 'call',
				name: 'MkPages:updated',
				args: [
					updated.fn
				]
			};
			ast.push(updated.call);
		}

		// generate updated event
		const statements: Node[] = [];
		updated.fn.children.splice(0, 0, ...statements);
}

export class Hpml {
	public page: Page;
	public aiscript?: AiScript;
	public variables: any[];
	private ast?: Node[];
	public variableInfos: Record<string, VariableInfo> = {}; // variable source infos
	public vars: Ref<Record<string, any>> = ref({}); // variable values for blocks
	public pageVarUpdatedCallback?: values.VFn;
	public canvases: Record<string, HTMLCanvasElement> = {};

	constructor(page: Record<string, any>, opts?: any) {
		this.page = (page as Page);
		this.variables = [];
		// if (this.page.version != '2') {
		// 	throw new HpmlError('The version of this page is not supported.');
		// }
		if (this.page.script == null) return;
		this.aiscript = markRaw(new AiScript({
			...createAiScriptEnv({ storageKey: 'pages:' + this.page.id }),
			...initAiLib(this)
		}, opts));
		this.buildAst();
		this.collectVars();

		this.aiscript.scope.opts.onUpdated = (name, value) => {
			this.refreshVar(name);
		};
		// when the last line of the script is executed:
		// this.refreshVars();
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
	private buildAst() {
		if (this.page.script != null) {
			try {
				this.ast = Parser.parse(this.page.script);
			} catch (e) {
				throw new HpmlError('Failed to parse the script.');
			}
		} else {
			this.ast = [];
		}

		generateUpdated(this.ast);
	}

	@autobind
	private collectVars() {
		if (this.ast == null) return;
		const infos: Record<string, VariableInfo> = {};
		for (const node of this.ast) {
			if (node.type === 'def') {
				const exportAttrNode = node.attr.find(attr => (attr.name === 'export'));
				const inputAttrNode = node.attr.find(attr => (attr.name === 'input'));
				if (exportAttrNode != null) {
					let inputAttr: VariableInfo['inputAttr'];
					if (inputAttrNode != null) {
						if (inputAttrNode.value == null || inputAttrNode.value.type != 'obj') {
							throw new HpmlError('The input attribute expects a value of type obj.');
						}
						const blockTypeNode = inputAttrNode.value.value.get('type');
						if (blockTypeNode == null || blockTypeNode.type != 'str') {
							throw new HpmlError('The type field of the input attribute expects a value of type str.');
						}
						const blockType = blockTypeNode.value;
						if (inputBlockTable[blockType] == null) {
							throw new HpmlError('The type field of the input attribute is unknown value.');
						}
						inputAttr = {
							blockType
						};
					}
					infos[node.name] = {
						defined: false,
						attrs: node.attr,
						inputAttr: inputAttr
					};
				} else {
					if (inputAttrNode != null) {
						throw new HpmlError("The 'export' attribute is required to add the 'input' attribute to the declaration.");
					}
				}
			}
		}
		this.variableInfos = infos;
	}

	@autobind
	public refreshVar(name: string) {
		if (this.aiscript == null) return;
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
		if (this.aiscript == null) return;
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
		if (this.aiscript == null) return;
		if (this.variableInfos[name] == null || this.variableInfos[name].inputAttr == null) {
			throw new HpmlError(`No such input var '${name}'`);
		}
		if (this.pageVarUpdatedCallback) {
			this.aiscript.execFn(this.pageVarUpdatedCallback, [values.STR(name), utils.jsToVal(value)]);
		}
	}

	@autobind
	public async run() {
		if (this.aiscript == null) return;
		await this.aiscript.exec(this.ast);
	}

	@autobind
	public abort() {
		if (this.aiscript == null) return;
		this.aiscript.abort();
	}
}
