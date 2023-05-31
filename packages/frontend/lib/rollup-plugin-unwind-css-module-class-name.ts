import { generate } from 'astring';
import * as estree from 'estree';
import { walk } from '../node_modules/estree-walker/src/index.js';
import type * as estreeWalker from 'estree-walker';
import type { Plugin } from 'vite';

export function unwindCssModuleClassName(ast: estree.Node): void {
	(walk as typeof estreeWalker.walk)(ast, {
		enter(node, parent): void {
			if (parent?.type !== 'Program') return;
			if (node.type !== 'VariableDeclaration') return;
			if (node.declarations.length !== 1) return;
			if (node.declarations[0].id.type !== 'Identifier') return;
			const name = node.declarations[0].id.name;
			if (node.declarations[0].init?.type !== 'CallExpression') return;
			if (node.declarations[0].init.callee.type !== 'Identifier') return;
			if (node.declarations[0].init.callee.name !== '_export_sfc') return;
			if (node.declarations[0].init.arguments.length !== 2) return;
			if (node.declarations[0].init.arguments[0].type !== 'Identifier') return;
			const ident = node.declarations[0].init.arguments[0].name;
			if (!ident.startsWith('_sfc_main')) return;
			if (node.declarations[0].init.arguments[1].type !== 'ArrayExpression') return;
			if (node.declarations[0].init.arguments[1].elements.length === 0) return;
			const __cssModulesIndex = node.declarations[0].init.arguments[1].elements.findIndex((x) => {
				if (x?.type !== 'ArrayExpression') return false;
				if (x.elements.length !== 2) return false;
				if (x.elements[0]?.type !== 'Literal') return false;
				if (x.elements[0].value !== '__cssModules') return false;
				if (x.elements[1]?.type !== 'Identifier') return false;
				return true;
			});
			if (!~__cssModulesIndex) return;
			const cssModuleForestName = node.declarations[0].init.arguments[1].elements[__cssModulesIndex].elements[1].name;
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
				if (x.declarations[0].id.name !== ident) return false;
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
			if (render.argument.params.length !== 2) return;
			const ctx = render.argument.params[0];
			if (ctx.type !== 'Identifier') return;
			if (ctx.name !== '_ctx') return;
			if (render.argument.body.type !== 'BlockStatement') return;
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
					const actualKey = property.key.type === 'Identifier' ? property.key.name : property.key.type === 'Literal' ? property.key.value : null;
					if (typeof actualKey !== 'string') return [];
					if (property.value.type === 'Literal') return [[actualKey, property.value.value as string]];
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
					return [[actualKey, actualValue.declarations[0].init.value as string]];
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
				(walk as typeof estreeWalker.walk)(render.argument.body, {
					enter(childNode) {
						if (childNode.type !== 'MemberExpression') return;
						if (childNode.object.type !== 'MemberExpression') return;
						if (childNode.object.object.type !== 'Identifier') return;
						if (childNode.object.object.name !== ctx.name) return;
						if (childNode.object.property.type !== 'Identifier') return;
						if (childNode.object.property.name !== key) return;
						if (childNode.property.type !== 'Identifier') return;
						console.error(`Undefined style detected: ${key}.${childNode.property.name} (in ${name})`);
						this.replace({
							type: 'Identifier',
							name: 'undefined',
						});
					},
				});
			}
			if (node.declarations[0].init.arguments[1].elements.length === 1) {
				this.replace({
					type: 'VariableDeclaration',
					declarations: [{
						type: 'VariableDeclarator',
						id: {
							type: 'Identifier',
							name: node.declarations[0].id.name,
						},
						init: {
							type: 'Identifier',
							name: ident,
						},
					}],
					kind: 'const',
				});
			} else {
				this.replace({
					type: 'VariableDeclaration',
					declarations: [{
						type: 'VariableDeclarator',
						id: {
							type: 'Identifier',
							name: node.declarations[0].id.name,
						},
						init: {
							type: 'CallExpression',
							callee: {
								type: 'Identifier',
								name: '_export_sfc',
							},
							arguments: [{
								type: 'Identifier',
								name: ident,
							}, {
								type: 'ArrayExpression',
								elements: node.declarations[0].init.arguments[1].elements.slice(0, __cssModulesIndex).concat(node.declarations[0].init.arguments[1].elements.slice(__cssModulesIndex + 1)),
							}],
						},
					}],
					kind: 'const',
				});
			}
		},
	});
}

// eslint-disable-next-line import/no-default-export
export default function pluginUnwindCssModuleClassName(): Plugin {
	return {
		name: 'UnwindCssModuleClassName',
		renderChunk(code): { code: string } {
			const ast = this.parse(code) as unknown as estree.Node;
			unwindCssModuleClassName(ast);
			return { code: generate(ast) };
		},
	};
}
