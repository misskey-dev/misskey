/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ESTree } from 'rolldown/utils';

export function assertNever(x: never): never {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	throw new Error(`Unexpected type: ${(x as any)?.type ?? x}`);
}

export function assertType<T>(_node: unknown): asserts _node is T {
}

export function declsOfPattern(pattern: ESTree.BindingPattern | ESTree.ParamPattern | ESTree.ArrayAssignmentTarget | ESTree.ObjectAssignmentTarget | ESTree.AssignmentTargetMaybeDefault | ESTree.AssignmentTargetRest | null): string[] {
	if (pattern == null) return [];
	switch (pattern.type) {
		case 'Identifier':
			return [pattern.name];
		case 'ObjectPattern':
			return pattern.properties.flatMap(prop => {
				switch (prop.type) {
					case 'Property':
						return declsOfPattern(prop.value);
					case 'RestElement':
						return declsOfPattern(prop.argument);
					default:
						assertNever(prop);
				}
			});
		case 'ArrayPattern':
			return pattern.elements.flatMap(p => declsOfPattern(p));
		case 'RestElement':
			return declsOfPattern(pattern.argument);
		case 'AssignmentPattern':
			return declsOfPattern(pattern.left);
		case 'MemberExpression':
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
		case 'TSTypeAssertion':
		case 'TSNonNullExpression':
			return []; // not introducing new symbol
		case 'TSParameterProperty':
			throw new Error();
		default:
			assertNever(pattern);
	}
}

export function getModuleExportName(node: ESTree.ModuleExportName): string {
	return node.type === 'Literal' ? node.value : node.name;
}
