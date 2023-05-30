import { generate } from 'astring';
import * as estree from 'estree';
import { walk } from '../node_modules/estree-walker/src/index.js';
import type * as estreeWalker from 'estree-walker';
import type { Plugin } from 'vite';

export function unwindCssModuleClassName(ast: estree.Node): void {
	(walk as typeof estreeWalker.walk)(ast, {
		enter(node, parent): void {
			// FIXME: support multiple exports
			if (node.type !== 'ExportNamedDeclaration') return;
			if (node.specifiers.length !== 1) return;
			if (node.specifiers[0].local.name === '_sfc_main') return;
			if (node.specifiers[0].exported.name !== 'default') return;
			if (parent?.type !== 'Program') return;
			const endIndex = parent.body.indexOf(node);
			const previousNode = parent.body[endIndex - 1];
			if (previousNode.type !== 'VariableDeclaration') return;
			if (previousNode.declarations.length !== 1) return;
			if (previousNode.declarations[0].id.type !== 'Identifier') return;
			if (previousNode.declarations[0].id.name !== node.specifiers[0].local.name) return;
			if (previousNode.declarations[0].init?.type !== 'CallExpression') return;
			if (previousNode.declarations[0].init.callee.type !== 'Identifier') return;
			if (previousNode.declarations[0].init.callee.name !== '_export_sfc') return;
			if (previousNode.declarations[0].init.arguments.length !== 2) return;
			if (previousNode.declarations[0].init.arguments[0].type !== 'Identifier') return;
			if (previousNode.declarations[0].init.arguments[0].name !== '_sfc_main') return;
			if (previousNode.declarations[0].init.arguments[1].type !== 'ArrayExpression') return;
			if (previousNode.declarations[0].init.arguments[1].elements.length !== 1) return;
			if (previousNode.declarations[0].init.arguments[1].elements[0]?.type !== 'ArrayExpression') return;
			if (previousNode.declarations[0].init.arguments[1].elements[0].elements.length !== 2) return;
			if (previousNode.declarations[0].init.arguments[1].elements[0].elements[0]?.type !== 'Literal') return;
			if (previousNode.declarations[0].init.arguments[1].elements[0].elements[0].value !== '__cssModules') return;
			if (previousNode.declarations[0].init.arguments[1].elements[0].elements[1]?.type !== 'Identifier') return;
			const cssModuleForestName = previousNode.declarations[0].init.arguments[1].elements[0].elements[1].name;
			parent.body[endIndex - 1] = {
				type: 'VariableDeclaration',
				declarations: [
					{
						type: 'VariableDeclarator',
						id: {
							type: 'Identifier',
							name: node.specifiers[0].local.name,
						},
						init: {
							type: 'Identifier',
							name: '_sfc_main',
						},
					},
				],
				kind: 'const',
			};
			const cssModuleForestNode = parent.body.find((x) => {
				if (x.type !== 'VariableDeclaration') return false;
				if (x.declarations.length !== 1) return false;
				if (x.declarations[0].id.type !== 'Identifier') return false;
				if (x.declarations[0].id.name !== cssModuleForestName) return false;
				if (x.declarations[0].init?.type !== 'ObjectExpression') return false;
				return true;
			}) as unknown as estree.VariableDeclaration;
			const moduleForest = new Map((cssModuleForestNode.declarations[0].init as estree.ObjectExpression).properties.flatMap((property) => {
				if (property.type !== 'Property') return [];
				if (property.key.type !== 'Literal') return [];
				if (property.value.type !== 'Identifier') return [];
				return [[property.key.value as string, property.value.name as string]];
			}));
			const sfcMain = parent.body.find((x) => {
				if (x.type !== 'VariableDeclaration') return false;
				if (x.declarations.length !== 1) return false;
				if (x.declarations[0].id.type !== 'Identifier') return false;
				if (x.declarations[0].id.name !== '_sfc_main') return false;
				return true;
			}) as unknown as estree.VariableDeclaration;
			if (sfcMain.declarations[0].init?.type !== 'CallExpression') return;
			if (sfcMain.declarations[0].init.callee.type !== 'Identifier') return;
			if (sfcMain.declarations[0].init.callee.name !== 'defineComponent') return;
			if (sfcMain.declarations[0].init.arguments.length !== 1) return;
			if (sfcMain.declarations[0].init.arguments[0].type !== 'ObjectExpression') return;
			const setup = sfcMain.declarations[0].init.arguments[0].properties.find((x) => {
				if (x.type !== 'Property') return false;
				if (x.key.type !== 'Identifier') return false;
				if (x.key.name !== 'setup') return false;
				return true;
			}) as unknown as estree.Property;
			if (setup.value.type !== 'FunctionExpression') return;
			const render = setup.value.body.body.find((x) => {
				if (x.type !== 'ReturnStatement') return false;
				return true;
			}) as unknown as estree.ReturnStatement;
			if (render.argument?.type !== 'ArrowFunctionExpression') return;
			const ctx = render.argument.params[0];
			if (ctx.type !== 'Identifier') return;
			if (render.argument.body.type !== 'BlockStatement') return;
			//console.dir(render, { depth: Infinity });
			for (const [key, value] of moduleForest) {
				const cssModuleTreeNode = parent.body.find((x) => {
					if (x.type !== 'VariableDeclaration') return false;
					if (x.declarations.length !== 1) return false;
					if (x.declarations[0].id.type !== 'Identifier') return false;
					if (x.declarations[0].id.name !== value) return false;
					return true;
				}) as unknown as estree.VariableDeclaration;
				if (cssModuleTreeNode.declarations[0].init?.type !== 'ObjectExpression') return;
				const moduleTree = new Map(cssModuleTreeNode.declarations[0].init.properties.flatMap((property) => {
					if (property.type !== 'Property') return [];
					if (property.key.type !== 'Identifier') return [];
					if (property.value.type !== 'Identifier') return [];
					const labelledValue = property.value.name;
					const actualValue = parent.body.find((x) => {
						if (x.type !== 'VariableDeclaration') return false;
						if (x.declarations.length !== 1) return false;
						if (x.declarations[0].id.type !== 'Identifier') return false;
						if (x.declarations[0].id.name !== labelledValue) return false;
						return true;
					}) as unknown as estree.VariableDeclaration;
					if (actualValue.declarations[0].init?.type !== 'Literal') return [];
					return [[property.key.name, actualValue.declarations[0].init.value as string]];
				}));
				(walk as typeof estreeWalker.walk)(render.argument.body, {
					enter(childNode) {
						if (childNode.type !== 'MemberExpression') return;
						if (childNode.object.type !== 'MemberExpression') return;
						if (childNode.object.object.type !== 'Identifier') return;
						if (childNode.object.object.name !== ctx.name) return;
						if (childNode.object.property.type !== 'Identifier') return;
						if (childNode.object.property.name !== key) return;
						if (childNode.property.type !== 'Identifier') return;
						const actualValue = moduleTree.get(childNode.property.name);
						if (actualValue === undefined) return;
						this.replace({
							type: 'Literal',
							value: actualValue,
						});
					},
				});
			}
		},
	});
}

// eslint-disable-next-line import/no-default-export
export default function pluginUnwindCssModuleClassName(): Plugin {
	return {
		name: 'UnwindCssModuleClassName',
		renderChunk(code, chunk): { code: string } {
			console.log(`=======${chunk.fileName} BEFORE=======`);
			console.log(code);
			const ast = this.parse(code) as unknown as estree.Node;
			unwindCssModuleClassName(ast);
			console.log(`=======${chunk.fileName} AFTER=======`);
			console.log(generate(ast));
			return { code: generate(ast) };
		},
	};
}
