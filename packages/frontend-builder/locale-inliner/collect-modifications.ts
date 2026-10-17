/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { walk } from 'oxc-walker';
import { declsOfPattern, getModuleExportName } from '../utils.js';
import type { ESTree } from 'rolldown/utils';
import type { LocaleInliner, TextModification } from '../locale-inliner.js';
import type { Logger } from '../logger.js';
import type { ChunkExportResolver, ResolvedBinding } from './chunk-export-resolver.js';

export function collectModifications(
	sourceCode: string,
	programNode: ESTree.Program,
	fileName: string,
	fileLogger: Logger,
	inliner: LocaleInliner,
	resolver: ChunkExportResolver,
	i18nBinding: ResolvedBinding,
): TextModification[] {
	const modifications: TextModification[] = [];

	// first
	// 1) replace all `scripts/` path literals with locale code
	// 2) replace all `localStorage.getItem("lang")` with `localeName` variable
	// 3) replace all `await window.fetch(`/assets/locales/${d}.${x}.json`).then(u=>u.json())` with `localeJson` variable
	walk(programNode, {
		enter(this, node) {
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

	const importResult = findI18nImport(programNode, fileName, resolver, i18nBinding);

	for (const importNode of importResult.sideEffectImports) {
		fileLogger.debug('Importing i18n without specifiers, removing the import.');
		modifications.push({
			type: 'delete',
			begin: importNode.start,
			end: importNode.end,
			localizedOnly: false,
		});
	}

	switch (importResult.type) {
		case 'no-import':
			fileLogger.debug('No import of i18n found, skipping inlining.');
			return modifications;
		case 'unexpected-import':
			fileLogger.error(`Importing ${inliner.i18nFileName} found but ${importResult.reason}. Skipping inlining.`);
			return modifications;
		case 'specifier':
			fileLogger.debug(`Found import i18n as ${importResult.specifier.local.name}`);
			break;
	}

	const i18nImport = importResult.importNode;
	const i18nImportSpecifier = importResult.specifier;
	const localI18nIdentifier = i18nImportSpecifier.local.name;

	fileLogger.debug(`imports ${i18nBinding.exportName} /*i18n*/ as ${localI18nIdentifier}`);

	// In case of substitution failure, we will preserve the import statement
	// otherwise we will remove it.
	let preserveI18nImport = false;

	const codeModifications: TextModification[] = [];

	const toSkip = new Set();
	toSkip.add(i18nImport);
	walk(programNode, {
		enter(this, node, parent, ctx) {
			if (toSkip.has(node)) {
				// This is the import specifier, skip processing it
				this.skip();
				return;
			}

			const property = ctx.key;

			// We don't care original name part of the import declaration
			if (node.type === 'ImportDeclaration') this.skip();

			if (node.type === 'Identifier') {
				if (parent == null) throw new Error();
				if (parent.type === 'Property' && !parent.computed && property === 'key') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'MemberExpression' && !parent.computed && property === 'property') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'ExportSpecifier' && property === 'exported') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'ExportSpecifier' && node.name === localI18nIdentifier) {
					// re-exporting i18n (e.g. facade chunk of i18n entry). we need to keep the import for the re-export.
					fileLogger.debug(`${lineCol(sourceCode, node)}: re-exporting i18n identifier "${localI18nIdentifier}". Keeping the import.`);
					preserveI18nImport = true;
					return;
				}
				if (node.name === localI18nIdentifier) {
					// the use of identifier is either direct reference to i18n, or unsupported conflict of the identifier, which should report error.
					fileLogger.error(`${lineCol(sourceCode, node)}: Using i18n identifier "${localI18nIdentifier}" directly. Skipping inlining.`);
					preserveI18nImport = true;
				}
			} else if (node.type === 'MemberExpression') {
				const i18nPath = parseI18nPropertyAccess(node);
				if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] === 'ts') {
					if (parent != null && parent.type === 'CallExpression' && property === 'callee') return; // we don't want to process `i18n.ts.property.stringBuiltinMethod()`
					if (i18nPath.at(-1)?.startsWith('_')) fileLogger.debug(`found i18n grouped property access ${i18nPath.join('.')}`);
					else fileLogger.debug(`${lineCol(sourceCode, node)}: found i18n property access ${i18nPath.join('.')}`);
					// it's i18n.ts.propertyAccess
					// i18n.ts.* will always be resolved to string or object containing strings
					codeModifications.push({
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
					codeModifications.push({
						type: 'parameterized-function',
						begin: node.start,
						end: node.end,
						localizationKey: i18nPath.slice(1), // remove 'tsx' prefix
						localizedOnly: true,
					});
					this.skip();
				}
			}

			// Scope check
			if (node.type === 'FunctionDeclaration'
				|| node.type === 'FunctionExpression'
				|| node.type === 'ArrowFunctionExpression') {
				// if i18n is introduced as the Named Function Expression, interior of the function does not matter
				if (node.id?.name === localI18nIdentifier) this.skip();
				// If there is 'i18n' in the parameters, we care interior of the function
				if (node.params.flatMap(param => declsOfPattern(param)).includes(localI18nIdentifier)) this.skip();

				// We find var declation inside the function and if there are
				if (findFunctionScopeDecls(node).includes(localI18nIdentifier)) this.skip();
			}

			if (node.type === 'BlockStatement') {
				// We find block-scope declaration inside the block, or from parent node if the block is part of for statement or catch clause
				if (findBlockScopeDecls(node).includes(localI18nIdentifier)) this.skip();
			}

			// statements and clauses introduces new variables in variable scope
			if (node.type === 'CatchClause') {
				if (node.param != null) {
					if (declsOfPattern(node.param).includes(localI18nIdentifier)) this.skip();
				}
			} else if (node.type === 'ForStatement') {
				if (node.init?.type === 'VariableDeclaration') {
					if (node.init.declarations.flatMap(x => declsOfPattern(x.id)).includes(localI18nIdentifier)) this.skip();
				}
			} else if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
				if (node.left.type === 'VariableDeclaration') {
					if (node.left.declarations.flatMap(x => declsOfPattern(x.id)).includes(localI18nIdentifier)) this.skip();
				} else {
					if (declsOfPattern(node.left).includes(localI18nIdentifier)) this.skip();
				}
			}
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!preserveI18nImport) {
		fileLogger.debug('removing i18n import');
		codeModifications.push({
			type: 'delete',
			...importSpecifierDeletionRange(i18nImport, i18nImportSpecifier),
			localizedOnly: true,
		});
	}

	function parseI18nPropertyAccess(node: ESTree.Expression | ESTree.Super): string[] | null {
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
			if (node.property.type === 'TemplateLiteral' && node.property.quasis.length === 1) {
				id = node.property.quasis[0].value.cooked;
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

	return [...modifications, ...codeModifications];
}

function lineCol(sourceCode: string, node: ESTree.Node): string {
	const leading = sourceCode.slice(0, node.start);
	const lines = leading.split('\n');
	const line = lines.length;
	const col = lines[lines.length - 1].length + 1; // +1 for 1-based index
	return `(${line}:${col})`;
}

function findFunctionScopeDecls(fn: ESTree.Function | ESTree.ArrowFunctionExpression): string[] {
	if (fn.body == null) return [];
	const decls: string[] = [];
	walk(fn.body, {
		enter(node) {
			// The only function-scoped symbol declaration in strict mode is 'var'
			// If it's non-strict mode, function declaration will also in function scope.
			if (node.type === 'VariableDeclaration' && node.kind === 'var') {
				decls.push(...node.declarations.flatMap(x => declsOfPattern(x.id)));
			}

			if (node.type === 'FunctionDeclaration'
				|| node.type === 'FunctionExpression'
				|| node.type === 'ArrowFunctionExpression') {
				// The function makes new inner scope
				this.skip();
			}
		},
	});
	return decls;
}

function findBlockScopeDecls(block: ESTree.BlockStatement): string[] {
	const decls: string[] = [];

	for (const body of block.body) {
		walk(body, {
			enter(node) {
				if (node.type === 'VariableDeclaration' && node.kind !== 'var') {
					decls.push(...node.declarations.flatMap(x => declsOfPattern(x.id)));
				} else if (node.type === 'FunctionDeclaration') {
					if (node.id != null) decls.push(node.id.name);
				} else if (node.type === 'ClassDeclaration') {
					if (node.id != null) decls.push(node.id.name);
				}

				if (
					node.type === 'FunctionDeclaration'
					|| node.type === 'FunctionExpression'
					|| node.type === 'ArrowFunctionExpression'
					|| node.type === 'BlockStatement'
					|| node.type === 'CatchClause'
					|| node.type === 'ForStatement'
					|| node.type === 'ForInStatement'
					|| node.type === 'ForOfStatement'
				) {
					// The function makes new inner scope
					this.skip();
				}
			},
		});
	}
	return decls;
}

//region checker functions

// localStorage.getItem("lang")
function isLocalStorageGetItemLang(getItemCall: ESTree.Node): boolean {
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
function isAwaitFetchLocaleThenJson(awaitNode: ESTree.Node): boolean {
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

type I18nImportResult = { sideEffectImports: ESTree.ImportDeclaration[] } & (
	| { type: 'no-import' }
	| { type: 'unexpected-import', reason: string }
	| { type: 'specifier', importNode: ESTree.ImportDeclaration, specifier: ESTree.ImportSpecifier }
);

function findI18nImport(programNode: ESTree.Program, fileName: string, resolver: ChunkExportResolver, i18nBinding: ResolvedBinding): I18nImportResult {
	const sideEffectImports: ESTree.ImportDeclaration[] = [];
	const found: { importNode: ESTree.ImportDeclaration, specifier: ESTree.ImportSpecifier }[] = [];

	for (const importNode of programNode.body) {
		if (importNode.type !== 'ImportDeclaration') continue;
		const source = importNode.source.value;

		if (importNode.specifiers.length === 0) {
			// `import "./i18n.js"` is only for side effects of loading i18n chunk, which is not needed for localized bundles.
			if (resolver.resolveSource(fileName, source) === i18nBinding.fileName) sideEffectImports.push(importNode);
			continue;
		}

		for (const specifier of importNode.specifiers) {
			if (specifier.type === 'ImportNamespaceSpecifier') {
				if (resolver.resolveSource(fileName, source) === i18nBinding.fileName) {
					return { type: 'unexpected-import', reason: 'with namespace import', sideEffectImports };
				}
				continue;
			}

			const importedName = specifier.type === 'ImportDefaultSpecifier' ? 'default' : getModuleExportName(specifier.imported);
			const resolved = resolver.resolveImport(fileName, source, importedName);
			if (resolved == null || resolved.fileName !== i18nBinding.fileName || resolved.exportName !== i18nBinding.exportName) continue;
			if (specifier.type === 'ImportDefaultSpecifier') {
				return { type: 'unexpected-import', reason: 'with default import', sideEffectImports };
			}
			found.push({ importNode, specifier });
		}
	}

	if (found.length === 0) return { type: 'no-import', sideEffectImports };
	if (found.length > 1) return { type: 'unexpected-import', reason: `imported ${found.length} times`, sideEffectImports };
	return { type: 'specifier', ...found[0], sideEffectImports };
}

/**
 * Returns the range to remove the specifier from the import declaration.
 * If the specifier is the only one in the declaration, the whole declaration is removed.
 */
function importSpecifierDeletionRange(importNode: ESTree.ImportDeclaration, specifier: ESTree.ImportSpecifier): { begin: number, end: number } {
	if (importNode.specifiers.length === 1) return { begin: importNode.start, end: importNode.end };

	// remove the specifier with adjacent comma: `import { a, b } from "x"` => `import { b } from "x"`
	// if it's the only named specifier, `import d, { a } from "x"` => `import d, {} from "x"`, which is still valid.
	const namedSpecifiers = importNode.specifiers.filter(x => x.type === 'ImportSpecifier');
	const index = namedSpecifiers.indexOf(specifier);
	if (namedSpecifiers.length === 1) return { begin: specifier.start, end: specifier.end };
	if (index < namedSpecifiers.length - 1) return { begin: specifier.start, end: namedSpecifiers[index + 1].start };
	return { begin: namedSpecifiers[index - 1].end, end: specifier.end };
}

// checker helpers
function isMemberExpression(node: ESTree.Node, property: string): node is ESTree.MemberExpression {
	return node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.property.name === property;
}

function isStringLiteral(node: ESTree.Node, value: string): node is ESTree.StringLiteral {
	return node.type === 'Literal' && typeof node.value === 'string' && node.value === value;
}

function isIdentifier(node: ESTree.Node, name: string): node is ESTree.IdentifierReference {
	return node.type === 'Identifier' && node.name === name;
}

//endregion
