/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as estreeWalker from 'estree-walker';
import type { Plugin } from 'vite';
import type { ESTree } from 'rolldown/utils';
import { RolldownMagicString } from 'rolldown';

function isFalsyIdentifier(identifier: Extract<ESTree.Node, { type: 'Identifier' }>): boolean {
	return identifier.name === 'undefined' || identifier.name === 'NaN';
}

function normalizeClassWalker(tree: ESTree.Node, stack: string | undefined): string | null {
	if (tree.type === 'Identifier') return isFalsyIdentifier(tree) ? '' : null;
	if (tree.type === 'Literal') return typeof tree.value === 'string' ? tree.value : '';
	if (tree.type === 'BinaryExpression') {
		if (tree.operator !== '+') return null;
		const left = normalizeClassWalker(tree.left, stack);
		const right = normalizeClassWalker(tree.right, stack);
		if (left === null || right === null) return null;
		return `${left}${right}`;
	}
	if (tree.type === 'TemplateLiteral') {
		if (tree.expressions.some((x) => x.type !== 'Literal' && (x.type !== 'Identifier' || !isFalsyIdentifier(x)))) return null;
		return tree.quasis.reduce((a, c, i) => {
			const v = i === tree.quasis.length - 1 ? '' : (tree.expressions[i] as Partial<Extract<ESTree.Node, { type: 'Literal' }>>).value;
			return a + c.value.raw + (typeof v === 'string' ? v : '');
		}, '');
	}
	if (tree.type === 'ArrayExpression') {
		const values = tree.elements.map((treeNode) => {
			if (treeNode === null) return '';
			if (treeNode.type === 'SpreadElement') return normalizeClassWalker(treeNode.argument, stack);
			return normalizeClassWalker(treeNode, stack);
		});
		if (values.some((x) => x === null)) return null;
		return values.join(' ');
	}
	if (tree.type === 'ObjectExpression') {
		const values = tree.properties.map((treeNode) => {
			if (treeNode.type === 'SpreadElement') return normalizeClassWalker(treeNode.argument, stack);
			let x = treeNode.value;
			let inveted = false;
			while (x.type === 'UnaryExpression' && x.operator === '!') {
				x = x.argument;
				inveted = !inveted;
			}
			if (x.type === 'Literal') {
				if (inveted === !x.value) {
					return treeNode.key.type === 'Identifier' ? treeNode.computed ? null : treeNode.key.name : treeNode.key.type === 'Literal' ? treeNode.key.value : '';
				} else {
					return '';
				}
			}
			if (x.type === 'Identifier') {
				if (inveted !== isFalsyIdentifier(x)) {
					return '';
				} else {
					return null;
				}
			}
			return null;
		});
		if (values.some((x) => x === null)) return null;
		return values.join(' ');
	}
	if (
		tree.type !== 'CallExpression' &&
		tree.type !== 'ChainExpression' &&
		tree.type !== 'ConditionalExpression' &&
		tree.type !== 'LogicalExpression' &&
		tree.type !== 'MemberExpression'
	) {
		console.error(stack ? `Unexpected node type: ${tree.type} (in ${stack})` : `Unexpected node type: ${tree.type}`);
	}
	return null;
}

export function normalizeClass(tree: ESTree.Node, stack?: string): string | null {
	const walked = normalizeClassWalker(tree, stack);
	return walked && walked.replace(/^\s+|\s+(?=\s)|\s+$/g, '');
}

function getPropertyName(node: ESTree.Node, computed: boolean): string | null {
	if (node.type === 'Identifier') return computed ? null : node.name;
	if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
	return null;
}

function getMemberPropertyName(node: ESTree.MemberExpression['property'], computed: boolean): string | null {
	if (node.type === 'Identifier') return computed ? null : node.name;
	if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
	return null;
}

function findVariableDeclaration(program: ESTree.Program, name: string): ESTree.VariableDeclaration | null {
	return program.body.find((x) => {
		if (x.type !== 'VariableDeclaration') return false;
		if (x.declarations.length !== 1) return false;
		if (x.declarations[0].id.type !== 'Identifier') return false;
		return x.declarations[0].id.name === name;
	}) as ESTree.VariableDeclaration | null;
}

function resolveObjectExpression(program: ESTree.Program, tree: ESTree.Expression): ESTree.ObjectExpression | null {
	if (tree.type === 'ObjectExpression') return tree;
	if (tree.type !== 'Identifier') return null;
	const declaration = findVariableDeclaration(program, tree.name);
	if (declaration?.declarations[0].init?.type !== 'ObjectExpression') return null;
	return declaration.declarations[0].init;
}

function resolveComponentOptions(program: ESTree.Program, tree: ESTree.Expression): ESTree.ObjectExpression | null {
	const target = tree.type === 'Identifier'
		? findVariableDeclaration(program, tree.name)?.declarations[0].init ?? null
		: tree;
	if (target?.type === 'ObjectExpression') return target;
	if (target?.type !== 'CallExpression') return null;
	if (target.arguments.length !== 1) return null;
	if (target.arguments[0].type !== 'ObjectExpression') return null;
	return target.arguments[0];
}

function resolveModuleTree(program: ESTree.Program, tree: ESTree.Expression): Map<string, string> | null {
	const objectExpression = resolveObjectExpression(program, tree);
	if (objectExpression === null) return null;
	return new Map(objectExpression.properties.flatMap((property) => {
		if (property.type !== 'Property') return [];
		const actualKey = getPropertyName(property.key, property.computed);
		if (actualKey === null) return [];
		if (property.value.type === 'Literal') {
			return typeof property.value.value === 'string' ? [[actualKey, property.value.value]] : [];
		}
		if (property.value.type === 'Identifier') {
			const actualValue = findVariableDeclaration(program, property.value.name);
			if (actualValue?.declarations[0].init?.type !== 'Literal') return [];
			return typeof actualValue.declarations[0].init.value === 'string' ? [[actualKey, actualValue.declarations[0].init.value]] : [];
		}
		return [];
	}));
}

function resolveModuleForest(program: ESTree.Program, tree: ESTree.Expression): Map<string, Map<string, string>> | null {
	const objectExpression = resolveObjectExpression(program, tree);
	if (objectExpression === null) return null;
	return new Map(objectExpression.properties.flatMap((property) => {
		if (property.type !== 'Property') return [];
		const actualKey = getPropertyName(property.key, property.computed);
		if (actualKey === null) return [];
		const moduleTree = resolveModuleTree(program, property.value);
		return moduleTree === null ? [] : [[actualKey, moduleTree]];
	}));
}

function findRenderArrow(options: ESTree.ObjectExpression): Extract<ESTree.Node, { type: 'ArrowFunctionExpression' }> | null {
	const setup = options.properties.find((x) => {
		if (x.type !== 'Property') return false;
		return getPropertyName(x.key, x.computed) === 'setup';
	}) as Extract<ESTree.Node, { type: 'Property' }> | undefined;
	if (setup?.value.type !== 'FunctionExpression' && setup?.value.type !== 'ArrowFunctionExpression') return null;
	if (setup.value.body == null) return null;
	if (setup.value.body.type !== 'BlockStatement') return null;
	const render = setup.value.body.body.find((x) => x.type === 'ReturnStatement');
	if (render?.type !== 'ReturnStatement') return null;
	return render.argument?.type === 'ArrowFunctionExpression' ? render.argument : null;
}

function isCssModuleAccess(node: ESTree.Node, ctxName: string, key: string): node is Extract<ESTree.Node, { type: 'MemberExpression' }> {
	if (node.type !== 'MemberExpression') return false;
	if (node.object.type !== 'MemberExpression') return false;
	if (node.object.object.type !== 'Identifier') return false;
	if (node.object.object.name !== ctxName) return false;
	return getMemberPropertyName(node.object.property, node.object.computed) === key;
	}

function isCssModuleReference(node: ESTree.Node, ctxName: string, key: string): node is Extract<ESTree.Node, { type: 'MemberExpression' }> {
	if (!isCssModuleAccess(node, ctxName, key)) return false;
	return getMemberPropertyName(node.property, node.computed) !== null;
}

function isClassProperty(node: ESTree.Node | null): node is Extract<ESTree.Node, { type: 'Property' }> {
	return node?.type === 'Property' && getPropertyName(node.key, node.computed) === 'class';
}

export function unwindCssModuleClassName(ast: ESTree.Node, magicString: RolldownMagicString): void {
	(estreeWalker.walk as any)(ast, {
		enter(node: ESTree.Node, parent: ESTree.Node | null): void {
			//#region
			if (parent?.type !== 'Program') return;
			if (ast.type !== 'Program') return;
			if (node.type !== 'VariableDeclaration') return;
			if (node.declarations.length !== 1) return;
			if (node.declarations[0].id.type !== 'Identifier') return;
			const name = node.declarations[0].id.name;
			if (node.declarations[0].init?.type !== 'CallExpression') return;
			if (node.declarations[0].init.arguments.length !== 2) return;
			const componentNode = node.declarations[0].init.arguments[0];
			if (componentNode.type !== 'Identifier' && componentNode.type !== 'CallExpression' && componentNode.type !== 'ObjectExpression') return;
			if (node.declarations[0].init.arguments[1].type !== 'ArrayExpression') return;
			if (node.declarations[0].init.arguments[1].elements.length === 0) return;
			const cssModulesEntry = node.declarations[0].init.arguments[1].elements.find((x) => {
				if (x?.type !== 'ArrayExpression') return false;
				if (x.elements.length !== 2) return false;
				if (x.elements[0]?.type !== 'Literal') return false;
				if (x.elements[0].value !== '__cssModules') return false;
				return true;
			}) as ESTree.ArrayExpression | undefined;
			const __cssModulesIndex = node.declarations[0].init.arguments[1].elements.indexOf(cssModulesEntry ?? null);
			if (cssModulesEntry === undefined || __cssModulesIndex < 0) return;
			/* This region assumeed that the entered node looks like the following code.
			 *
			 * ```ts
			 * const SomeComponent = _export_sfc(_sfc_main, [["foo", bar], ["__cssModules", cssModules]]);
			 * ```
			 */
			//#endregion
			//#region
			const cssModuleForest = cssModulesEntry.elements[1];
			if (cssModuleForest?.type !== 'Identifier' && cssModuleForest?.type !== 'ObjectExpression') return;
			const moduleForest = resolveModuleForest(ast, cssModuleForest);
			if (moduleForest === null) return;
			/* This region collected a VariableDeclaration node in the module that looks like the following code.
			 *
			 * ```ts
			 * const cssModules = {
			 *   "$style": style0,
			 * };
			 * ```
			 */
			//#endregion
			//#region
			const options = resolveComponentOptions(ast, componentNode);
			if (options === null) return;
			const render = findRenderArrow(options);
			if (render === null) return;
			if (render.params.length !== 2) return;
			const ctx = render.params[0];
			if (ctx.type !== 'Identifier') return;
			/* This region assumed that `sfcMain` looks like the following code.
			 *
			 * ```ts
			 * const _sfc_main = defineComponent({
			 *   setup(_props) {
			 *     ...
			 *     return (_ctx, _cache) => {
			 *       ...
			 *     };
			 *   },
			 * });
			 * ```
			 */
			//#endregion
			for (const [key, moduleTree] of moduleForest) {
				//#region
				/* This region collected VariableDeclaration nodes in the module that looks like the following code.
				 *
				 * ```ts
				 * const foo = "bar";
				 * const baz = "qux";
				 * const style0 = {
				 *   foo: foo,
				 *   baz: baz,
				 * };
				 * ```
				 */
				//#endregion
				//#region
				(estreeWalker.walk as any)(render.body, {
					enter(childNode: ESTree.Node) {
						if (!isCssModuleReference(childNode, ctx.name, key)) return;
						const actualKey = getMemberPropertyName(childNode.property, childNode.computed);
						if (actualKey === null) return;
						const actualValue = moduleTree.get(actualKey);
						if (actualValue === undefined) return;
						magicString.overwrite(childNode.start, childNode.end, JSON.stringify(actualValue));
						this.replace({
							type: 'Literal',
							value: actualValue,
						});
					},
				});
				/* This region inlined the reference identifier of the class name in the render function into the actual literal, as in the following code.
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass(_ctx.$style.foo),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 *
				 * ↓
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass("bar"),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 */
				//#endregion
				//#region
				(estreeWalker.walk as any)(render.body, {
					enter(childNode: ESTree.Node) {
						if (!isCssModuleReference(childNode, ctx.name, key)) return;
						const actualKey = getMemberPropertyName(childNode.property, childNode.computed);
						if (actualKey === null) return;
						console.error(`Undefined style detected: ${key}.${actualKey} (in ${name})`);
						magicString.overwrite(childNode.start, childNode.end, 'undefined');
					},
				});
				/* This region replaced the reference identifier of missing class names in the render function with `undefined`, as in the following code.
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock('div', {
				 *         class: normalizeClass(_ctx.$style.hoge),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 *
				 * ↓
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock('div', {
				 *         class: normalizeClass(undefined),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 */
				//#endregion
				//#region
				(estreeWalker.walk as any)(render.body, {
					enter(childNode: ESTree.Node, childParent: ESTree.Node | null) {
						if (childNode.type !== 'CallExpression') return;
						if (childNode.arguments.length !== 1) return;
						if (childNode.callee.type === 'Identifier' && childNode.callee.name !== 'normalizeClass' && !isClassProperty(childParent)) return;
						if (childNode.callee.type !== 'Identifier' && !isClassProperty(childParent)) return;
						const normalized = normalizeClass(childNode.arguments[0], name);
						if (normalized === null) return;
						magicString.overwrite(childNode.start, childNode.end, JSON.stringify(normalized));
					},
				});
				/* This region compiled the `normalizeClass` call into a pseudo-AOT compilation, as in the following code.
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass("bar"),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 *
				 * ↓
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: "bar",
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 */
				//#endregion
			}
			const hasRemainingCssModuleReference = Array.from(moduleForest.keys()).some((key) => {
				let found = false;
				(estreeWalker.walk as any)(render.body, {
					enter(childNode: ESTree.Node) {
						if (!isCssModuleAccess(childNode, ctx.name, key)) return;
						found = true;
						this.skip();
					},
				});
				return found;
			});
			if (hasRemainingCssModuleReference) return;
			//#region
			if (node.declarations[0].init.arguments[1].elements.length === 1) {
				if (componentNode.type === 'Identifier') {
					(estreeWalker.walk as any)(ast, {
						enter(childNode: ESTree.Node) {
							if (childNode.type !== 'Identifier') return;
							if (childNode.name !== componentNode.name) return;
							magicString.overwrite(childNode.start, childNode.end, name);
						},
					});
					magicString.remove(node.start, node.end);
				} else {
					const removeStart = cssModulesEntry.start;
					const removeEnd = node.declarations[0].init.arguments[1].end - 1;
					magicString.remove(removeStart, removeEnd);
				}
				/* NOTE: The above logic is valid as long as the following two conditions are met.
				 *
				 * - the uniqueness of `ident` is kept throughout the module
				 * - `_export_sfc` is noop when the second argument is an empty array
				 *
				 * Otherwise, the below logic should be used instead.

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
				 */
			} else {
				const nextElement = node.declarations[0].init.arguments[1].elements[__cssModulesIndex + 1];
				const removeStart = node.declarations[0].init.arguments[1].elements[__cssModulesIndex]!.start;
				const removeEnd = nextElement ? nextElement.start : node.declarations[0].init.arguments[1].end - 1;
				magicString.remove(removeStart, removeEnd);
			}
			/* This region removed the `__cssModules` reference from the second argument of `_export_sfc`, as in the following code.
			 *
			 * ```ts
			 * const SomeComponent = _export_sfc(_sfc_main, [["foo", bar], ["__cssModules", cssModules]]);
			 * ```
			 *
			 * ↓
			 *
			 * ```ts
			 * const SomeComponent = _export_sfc(_sfc_main, [["foo", bar]]);
			 * ```
			 *
			 * When the declaration becomes noop, it is removed as follows.
			 *
			 * ```ts
			 * const _sfc_main = defineComponent({
			 *   ...
			 * });
			 * const SomeComponent = _export_sfc(_sfc_main, []);
			 * ```
			 *
			 * ↓
			 *
			 * ```ts
			 * const SomeComponent = defineComponent({
			 *   ...
			 * });
			 */
			//#endregion
		},
	});
}

// eslint-disable-next-line import/no-default-export
export default function pluginUnwindCssModuleClassName(): Plugin {
	return {
		name: 'UnwindCssModuleClassName',
		renderChunk(code, _chunk, _options, meta) {
			const ast = ('ast' in meta ? meta.ast ?? this.parse(code) : this.parse(code)) as ESTree.Program;
			const magicString = meta.magicString ?? new RolldownMagicString(code);
			unwindCssModuleClassName(ast, magicString);
			return magicString;
		},
	};
}
