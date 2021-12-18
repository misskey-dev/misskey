import autobind from 'autobind-decorator';
import { AiScript, Parser, values, utils } from '@syuilo/aiscript';
import { Node, NAttr } from '@syuilo/aiscript/built/node';
import { ref, Ref } from 'vue';
import { HpmlError } from '.';

type Page = Record<string, any> & {
	id: any;
	user: any;
	blocks: any[];
	statements: any[];
	script: string;
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

export class HpmlEngine {
	public page: Page;
	public aiscript: AiScript;
	public variableInfos: Record<string, VariableInfo> = {}; // variable source infos
	public vars: Ref<Record<string, any>> = ref({}); // variable values for blocks
	public inputVarUpdatedCallback?: values.VFn;

	constructor(page: Page) {
		this.page = page;
		this.aiscript = new AiScript({});
		this.analyzeVars();

		this.aiscript.scope.opts.onUpdated = (name, value) => {
			this.refreshVars();
		};
		// when the last line of the script is executed:
		// this.refreshVars();
	}

	public analyzeVars() {
		// parse script
		let nodes: Node[];
		try {
			nodes = Parser.parse(this.page.script);
		} catch (e) {
			throw new HpmlError('Failed to parse the script.');
		}
		// extracts all of exported variables
		const infos: Record<string, VariableInfo> = {};
		for (const node of nodes) {
			if (node.type == 'def' && node.attr.find(attr => (attr.name == 'export')) != null) {
				// check input attribute
				let inputAttr: VariableInfo['inputAttr'];
				const inputAttrNode = node.attr.find(attr => (attr.name == 'input'));
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
			}
		}
		this.variableInfos = infos;
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
	public updateInputVar(name: string, value: any) {
		if (this.variableInfos[name] == null || this.variableInfos[name].inputAttr == null) {
			throw new HpmlError(`No such input var '${name}'`);
		}
		if (this.inputVarUpdatedCallback) {
			this.aiscript.execFn(this.inputVarUpdatedCallback, [values.STR(name), utils.jsToVal(value)]);
		}
	}
}
