/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseAst } from 'vite';
import * as estreeWalker from 'estree-walker';
import { assertNever, assertType } from '../utils.js';
import type { AstNode, ProgramNode } from 'rollup';
import type * as estree from 'estree';
import type { LocaleInliner, TextModification } from '../locale-inliner.js';
import type { Logger } from '../logger.js';

// WalkerContext is not exported from estree-walker, so we define it here
interface WalkerContext {
	skip: () => void;
}

export function collectModifications(sourceCode: string, fileName: string, fileLogger: Logger, inliner: LocaleInliner): TextModification[] {
	let programNode: ProgramNode;
	try {
		programNode = parseAst(sourceCode);
	} catch (err) {
		fileLogger.error(`Failed to parse source code: ${err}`);
		return [];
	}
	if (programNode.sourceType !== 'module') {
		fileLogger.error('Source code is not a module.');
		return [];
	}

	const modifications: TextModification[] = [];

	// first
	// 1) replace all `scripts/` path literals with locale code
	// 2) replace all `localStorage.getItem("lang")` with `localeName` variable
	// 3) replace all `await window.fetch(`/assets/locales/${d}.${x}.json`).then(u=>u.json())` with `localeJson` variable
	estreeWalker.walk(programNode, {
		enter(this: WalkerContext, node: Node) {
			assertType<AstNode>(node);

			if (node.type === 'Literal' && typeof node.value === 'string' && node.raw) {
				if (node.raw.substring(1).startsWith(inliner.scriptsDir)) {
					// we find `scripts/\w+\.js` literal and replace 'scripts' part with locale code
					fileLogger.debug(`${lineCol(sourceCode, node)}: found ${inliner.scriptsDir}/ path literal ${node.raw}`);
					modifications.push({
						type: 'locale-name',
						begin: node.start + 1,
						end: node.start + 1 + inliner.scriptsDir.length,
						literal: false,
						localizedOnly: true,
					});
				}
				if (node.raw.substring(1, node.raw.length - 1) === `${inliner.scriptsDir}/${inliner.i18nFileName}`) {
					// we find `scripts/i18n.ts` literal.
					// This is tipically in depmap and replace with this file name to avoid unnecessary loading i18n script
					fileLogger.debug(`${lineCol(sourceCode, node)}: found ${inliner.i18nFileName} path literal ${node.raw}`);
					modifications.push({
						type: 'replace',
						begin: node.end - 1 - inliner.i18nFileName.length,
						end: node.end - 1,
						text: fileName,
						localizedOnly: true,
					});
				}
			}

			if (isLocalStorageGetItemLang(node)) {
				fileLogger.debug(`${lineCol(sourceCode, node)}: found localStorage.getItem("lang") call`);
				modifications.push({
					type: 'locale-name',
					begin: node.start,
					end: node.end,
					literal: true,
					localizedOnly: true,
				});
			}

			if (isAwaitFetchLocaleThenJson(node)) {
				// await window.fetch(`/assets/locales/${d}.${x}.json`).then(u=>u.json(), () => null)
				fileLogger.debug(`${lineCol(sourceCode, node)}: found await window.fetch(\`/assets/locales/\${d}.\${x}.json\`).then(u=>u.json()) call`);
				modifications.push({
					type: 'locale-json',
					begin: node.start,
					end: node.end,
					localizedOnly: true,
				});
			}
		},
	});

	const importSpecifierResult = findImportSpecifier(programNode, inliner.i18nFileName, 'i18n');

	switch (importSpecifierResult.type) {
		case 'no-import':
			fileLogger.debug('No import of i18n found, skipping inlining.');
			return modifications;
		case 'no-specifiers':
			fileLogger.debug('Importing i18n without specifiers, removing the import.');
			modifications.push({
				type: 'delete',
				begin: importSpecifierResult.importNode.start,
				end: importSpecifierResult.importNode.end,
				localizedOnly: false,
			});
			return modifications;
		case 'unexpected-specifiers':
			fileLogger.info(`Importing ${inliner.i18nFileName} found but with unexpected specifiers. Skipping inlining.`);
			return modifications;
		case 'specifier':
			fileLogger.debug(`Found import i18n as ${importSpecifierResult.localI18nIdentifier}`);
			break;
	}

	const i18nImport = importSpecifierResult.importNode;
	const localI18nIdentifier = importSpecifierResult.localI18nIdentifier;

	// Check if the identifier is already declared in the file.
	// If it is, we may overwrite it and cause issues so we skip inlining
	let isSupported = true;
	estreeWalker.walk(programNode, {
		enter(node) {
			if (node.type === 'VariableDeclaration') {
				assertType<estree.VariableDeclaration>(node);
				for (const id of node.declarations.flatMap(x => declsOfPattern(x.id))) {
					if (id === localI18nIdentifier) {
						isSupported = false;
					}
				}
			}
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!isSupported) {
		fileLogger.error(`Duplicated identifier "${localI18nIdentifier}" in variable declaration. Skipping inlining.`);
		return modifications;
	}

	fileLogger.debug(`imports i18n as ${localI18nIdentifier}`);

	// In case of substitution failure, we will preserve the import statement
	// otherwise we will remove it.
	let preserveI18nImport = false;

	const toSkip = new Set();
	toSkip.add(i18nImport);
	estreeWalker.walk(programNode, {
		enter(this: WalkerContext, node, parent, property) {
			assertType<AstNode>(node);
			assertType<AstNode>(parent);
			if (toSkip.has(node)) {
				// This is the import specifier, skip processing it
				this.skip();
				return;
			}

			// We don't care original name part of the import declaration
			if (node.type === 'ImportDeclaration') this.skip();

			if (node.type === 'Identifier') {
				assertType<estree.Identifier>(node);
				assertType<estree.Property | estree.MemberExpression | estree.ExportSpecifier>(parent);
				if (parent.type === 'Property' && !parent.computed && property === 'key') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'MemberExpression' && !parent.computed && property === 'property') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'ExportSpecifier' && property === 'exported') return; // we don't care 'id' part of { id: expr }
				if (node.name === localI18nIdentifier) {
					fileLogger.error(`${lineCol(sourceCode, node)}: Using i18n identifier "${localI18nIdentifier}" directly. Skipping inlining.`);
					preserveI18nImport = true;
				}
			} else if (node.type === 'MemberExpression') {
				assertType<estree.MemberExpression>(node);
				const i18nPath = parseI18nPropertyAccess(node);
				if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] === 'ts') {
					if (parent.type === 'CallExpression' && property === 'callee') return; // we don't want to process `i18n.ts.property.stringBuiltinMethod()`
					if (i18nPath.at(-1)?.startsWith('_')) fileLogger.debug(`found i18n grouped property access ${i18nPath.join('.')}`);
					else fileLogger.debug(`${lineCol(sourceCode, node)}: found i18n property access ${i18nPath.join('.')}`);
					// it's i18n.ts.propertyAccess
					// i18n.ts.* will always be resolved to string or object containing strings
					modifications.push({
						type: 'localized',
						begin: node.start,
						end: node.end,
						localizationKey: i18nPath.slice(1), // remove 'ts' prefix
						localizedOnly: true,
					});
					this.skip();
				} else if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] === 'tsx') {
					// it's parameterized locale substitution (`i18n.tsx.property(parameters)`)
					// we expect the parameter to be an object literal
					fileLogger.debug(`${lineCol(sourceCode, node)}: found i18n function access (object) ${i18nPath.join('.')}`);
					modifications.push({
						type: 'parameterized-function',
						begin: node.start,
						end: node.end,
						localizationKey: i18nPath.slice(1), // remove 'tsx' prefix
						localizedOnly: true,
					});
					this.skip();
				}
			} else if (node.type === 'ArrowFunctionExpression') {
				assertType<estree.ArrowFunctionExpression>(node);
				// If there is 'i18n' in the parameters, we care interior of the function
				if (node.params.flatMap(param => declsOfPattern(param)).includes(localI18nIdentifier)) this.skip();
			}
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!preserveI18nImport) {
		fileLogger.debug('removing i18n import statement');
		modifications.push({
			type: 'delete',
			begin: i18nImport.start,
			end: i18nImport.end,
			localizedOnly: true,
		});
	}

	function parseI18nPropertyAccess(node: estree.Expression | estree.Super): string[] | null {
		if (node.type === 'Identifier' && node.name === localI18nIdentifier) return []; // i18n itself
		if (node.type !== 'MemberExpression') return null;
		// super.*
		if (node.object.type === 'Super') return null;

		// i18n?.property is not supported
		if (node.optional) return null;

		let id: string | null = null;
		if (node.computed) {
			if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
				id = node.property.value;
			}
		} else {
			if (node.property.type === 'Identifier') {
				id = node.property.name;
			}
		}
		// non-constant property access
		if (id == null) return null;

		const parentAccess = parseI18nPropertyAccess(node.object);
		if (parentAccess == null) return null;
		return [...parentAccess, id];
	}

	return modifications;
}

function declsOfPattern(pattern: estree.Pattern | null): string[] {
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
			// assignment pattern so no new variable is declared
			return [];
		default:
			assertNever(pattern);
	}
}

function lineCol(sourceCode: string, node: estree.Node): string {
	assertType<AstNode>(node);
	const leading = sourceCode.slice(0, node.start);
	const lines = leading.split('\n');
	const line = lines.length;
	const col = lines[lines.length - 1].length + 1; // +1 for 1-based index
	return `(${line}:${col})`;
}

//region checker functions

type Node =
	| estree.AssignmentProperty
	| estree.CatchClause
	| estree.Class
	| estree.ClassBody
	| estree.Expression
	| estree.Function
	| estree.Identifier
	| estree.Literal
	| estree.MethodDefinition
	| estree.ModuleDeclaration
	| estree.ModuleSpecifier
	| estree.Pattern
	| estree.PrivateIdentifier
	| estree.Program
	| estree.Property
	| estree.PropertyDefinition
	| estree.SpreadElement
	| estree.Statement
	| estree.Super
	| estree.SwitchCase
	| estree.TemplateElement
	| estree.VariableDeclarator
	;

// localStorage.getItem("lang")
function isLocalStorageGetItemLang(getItemCall: Node): boolean {
	if (getItemCall.type !== 'CallExpression') return false;
	if (getItemCall.arguments.length !== 1) return false;

	const langLiteral = getItemCall.arguments[0];
	if (!isStringLiteral(langLiteral, 'lang')) return false;

	const getItemFunction = getItemCall.callee;
	if (!isMemberExpression(getItemFunction, 'getItem')) return false;

	const localStorageObject = getItemFunction.object;
	if (!isIdentifier(localStorageObject, 'localStorage')) return false;

	return true;
}

// await window.fetch(`/assets/locales/${d}.${x}.json`).then(u => u.json(), ....)
function isAwaitFetchLocaleThenJson(awaitNode: Node): boolean {
	if (awaitNode.type !== 'AwaitExpression') return false;

	const thenCall = awaitNode.argument;
	if (thenCall.type !== 'CallExpression') return false;
	if (thenCall.arguments.length < 1) return false;

	const arrowFunction = thenCall.arguments[0];
	if (arrowFunction.type !== 'ArrowFunctionExpression') return false;
	if (arrowFunction.params.length !== 1) return false;

	const arrowBodyCall = arrowFunction.body;
	if (arrowBodyCall.type !== 'CallExpression') return false;

	const jsonFunction = arrowBodyCall.callee;
	if (!isMemberExpression(jsonFunction, 'json')) return false;

	const thenFunction = thenCall.callee;
	if (!isMemberExpression(thenFunction, 'then')) return false;

	const fetchCall = thenFunction.object;
	if (fetchCall.type !== 'CallExpression') return false;
	if (fetchCall.arguments.length !== 1) return false;

	// `/assets/locales/${d}.${x}.json`
	const assetLocaleTemplate = fetchCall.arguments[0];
	if (assetLocaleTemplate.type !== 'TemplateLiteral') return false;
	if (assetLocaleTemplate.quasis.length !== 3) return false;
	if (assetLocaleTemplate.expressions.length !== 2) return false;
	if (assetLocaleTemplate.quasis[0].value.cooked !== '/assets/locales/') return false;
	if (assetLocaleTemplate.quasis[1].value.cooked !== '.') return false;
	if (assetLocaleTemplate.quasis[2].value.cooked !== '.json') return false;

	const fetchFunction = fetchCall.callee;
	if (!isMemberExpression(fetchFunction, 'fetch')) return false;
	const windowObject = fetchFunction.object;
	if (!isIdentifier(windowObject, 'window')) return false;

	return true;
}

type SpecifierResult =
	| { type: 'no-import' }
	| { type: 'no-specifiers', importNode: estree.ImportDeclaration & AstNode }
	| { type: 'unexpected-specifiers', importNode: estree.ImportDeclaration & AstNode }
	| { type: 'specifier', localI18nIdentifier: string, importNode: estree.ImportDeclaration & AstNode }
	;

function findImportSpecifier(programNode: ProgramNode, i18nFileName: string, i18nSymbol: string): SpecifierResult {
	const imports = programNode.body.filter(x => x.type === 'ImportDeclaration');
	const importNode = imports.find(x => x.source.value === `./${i18nFileName}`) as estree.ImportDeclaration | undefined;
	if (!importNode) return { type: 'no-import' };
	assertType<AstNode>(importNode);

	if (importNode.specifiers.length === 0) {
		return { type: 'no-specifiers', importNode };
	}

	if (importNode.specifiers.length !== 1) {
		return { type: 'unexpected-specifiers', importNode };
	}
	const i18nImportSpecifier = importNode.specifiers[0];
	if (i18nImportSpecifier.type !== 'ImportSpecifier') {
		return { type: 'unexpected-specifiers', importNode };
	}

	if (i18nImportSpecifier.imported.type !== 'Identifier') {
		return { type: 'unexpected-specifiers', importNode };
	}

	const importingIdentifier = i18nImportSpecifier.imported.name;
	if (importingIdentifier !== i18nSymbol) {
		return { type: 'unexpected-specifiers', importNode };
	}
	const localI18nIdentifier = i18nImportSpecifier.local.name;
	return { type: 'specifier', localI18nIdentifier, importNode };
}

// checker helpers
function isMemberExpression(node: Node, property: string): node is estree.MemberExpression {
	return node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.property.name === property;
}

function isStringLiteral(node: Node, value: string): node is estree.Literal {
	return node.type === 'Literal' && typeof node.value === 'string' && node.value === value;
}

function isIdentifier(node: Node, name: string): node is estree.Identifier {
	return node.type === 'Identifier' && node.name === name;
}

//endregion
