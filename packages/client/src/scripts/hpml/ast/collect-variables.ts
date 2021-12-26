import { Node } from '@syuilo/aiscript/built/node';
import { HpmlError } from '..';
import { inputBlockTable, VariableInfo } from '../engine';

export function collectVariables(ast: Node[]) {
	const infos: Record<string, VariableInfo> = {};
	for (const node of ast) {
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
	return infos;
}
