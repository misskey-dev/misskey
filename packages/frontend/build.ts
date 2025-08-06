import * as fs from 'fs/promises';
import url from 'node:url';
import path from 'node:path';
import { execa } from 'execa';
import locales from '../../locales/index.js';
import type { Manifest as ViteManifest } from 'vite';
import { parseAstAsync } from 'vite';
import type * as estree from 'estree';
import type { AstNode, ProgramNode } from 'rollup';
import * as estreeWalker from 'estree-walker';
import MagicString from 'magic-string';

// requires node 21 or later
// const __dirname = import.meta.dirname;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const outputDir = __dirname + '/../../built/_frontend_vite_';

const scriptsDir = 'scripts/';
const i18nFile = 'src/i18n.ts';

/**
 * @return {Promise<void>}
 */
async function viteBuild() {
	await execa('vite', ['build'], {
		cwd: __dirname,
		stdout: process.stdout,
		stderr: process.stderr,
	});
}

function stripScriptDir(fileName: string) {
	if (!fileName.startsWith(scriptsDir)) {
		throw new Error(`${fileName} does not start with ${scriptsDir}`);
	}
	return fileName.slice(scriptsDir.length);
}

function findLocaleDependentFiles(manifest: ViteManifest) {
	const chunksByDependency: Record<string, Set<string>> = {};

	for (const [file, chunk] of Object.entries(manifest)) {
		for (const dependency of (chunk.imports ?? []).concat(chunk.dynamicImports ?? [])) {
			chunksByDependency[dependency] ??= new Set();
			chunksByDependency[dependency].add(file);
		}
	}

	const localeDependentFiles = new Set<string>();
	localeDependentFiles.add(i18nFile)
	const processStack = [...localeDependentFiles];

	while (processStack.length > 0) {
		const currentFile = processStack.pop();
		if (!currentFile) continue;

		const dependentFiles = chunksByDependency[currentFile];
		if (!dependentFiles) continue;

		for (const dependentFile of dependentFiles) {
			if (!localeDependentFiles.has(dependentFile)) {
				localeDependentFiles.add(dependentFile);
				processStack.push(dependentFile);
			}
		}
	}

	return Array.from(localeDependentFiles).map(fileName => {
		const chunk = manifest[fileName];
		if (!chunk) throw new Error(`${fileName} not found`);
		return stripScriptDir(chunk.file);
	});
}

function lineCol(sourceCode: string, node: estree.Node): string {
	assertType<AstNode>(node);
	const leading = sourceCode.slice(0, node.start);
	const lines = leading.split('\n');
	const line = lines.length;
	const col = lines[lines.length - 1].length + 1; // +1 for 1-based index
	return `(${line}:${col})`;
}

function getPropertyByPath(localeJson: any, localizationKey: string[]): string | object | null {
	if (localizationKey.length === 0) return localeJson;
	let current: any = localeJson;
	for (const key of localizationKey) {
		if (typeof current !== 'object' || current === null || !(key in current)) {
			return null; // Key not found
		}
		current = current[key];
	}
	return current ?? null;
}

type EachTextModification = {
	type: 'delete';
	begin: number;
	end: number;
} | {
	// can be used later to insert '../scripts' for common files
	type: 'insert';
	begin: number;
	text: string;
} | {
	type: 'localized';
	begin: number;
	end: number;
	localizationKey: string[];
	localizedOnly: true;
} | {
	type: 'parameterized-function';
	begin: number;
	end: number;
	localizationKey: string[];
	localizedOnly: true;
} | {
	type: 'locale-name';
	begin: number;
	end: number;
	localizedOnly: true;
}
type TextModification = EachTextModification & {
	localizedOnly: boolean;
}

async function buildAllLocale() {
	const manifest: ViteManifest = JSON.parse(await fs.readFile(`${outputDir}/manifest.json`, 'utf-8'));
	const localeDependent = new Set(findLocaleDependentFiles(manifest));
	const i18nFileName = stripScriptDir(manifest[i18nFile].file);

	const scriptNameByPath = Object.fromEntries(Object.values(manifest).filter(chunk => chunk.file.startsWith(scriptsDir)).map(chunk => [stripScriptDir(chunk.file), chunk.name]));
	const allScriptFiles = Object.keys(scriptNameByPath);
	const filesToCopy = allScriptFiles;
	const parsedScripts = Object.fromEntries<readonly [ProgramNode, string]>(await Promise.all(allScriptFiles.map(async fileName => {
		const sourceCode = await fs.readFile(`${outputDir}/${scriptsDir}${fileName}`, 'utf-8');
		let parsedCode: ProgramNode;
		try {
			parsedCode = await parseAstAsync(sourceCode);
		} catch (error) {
			logger.error(`Failed to parse ${fileName}: ${error}`);
			throw error;
		}
		return [fileName, [parsedCode, sourceCode]] as const;
	})));
	const modificationsByFileName: Record<string, TextModification[]> = {};

	for (const [fileName, [programNode, sourceCode]] of Object.entries(parsedScripts)) {
		if (programNode.sourceType !== 'module') throw new Error(`${fileName} is not a module`);
		const fileLogger = logger.prefixed(`${fileName} (${scriptNameByPath[fileName]}): `);

		const imports = programNode.body.filter<estree.ImportDeclaration>(x => x.type === 'ImportDeclaration');
		const i18nImport = imports.find(x => x.source.value === `./${i18nFileName}`) as estree.ImportDeclaration;
		if (!i18nImport) continue; // We don't need to process i18n
		assertType<AstNode>(i18nImport);

		const modifications: TextModification[] = [];
		modificationsByFileName[fileName] = modifications;

		// first, replace all `scripts/` path literals with locale code
		estreeWalker.walk(programNode, {
			enter(this: import('estree-walker/types/walker').WalkerContext,node) {
				assertType<AstNode>(node)

				if (node.type === 'Literal') {
					assertType<estree.Literal>(node);
					if (typeof node.value === 'string' && node.raw) {
						// we find `scripts/\w+\.js` literal and replace 'scripts' part with locale code
						const match = node.raw.match(/^(['"])scripts\/([^']+\.js)\1$/);
						if (match) {
							fileLogger.debug(`${lineCol(sourceCode, node)}: found scripts/ path literal ${node.raw}`);
							modifications.push({
								type: 'locale-name',
								begin: node.start + 1,
								end: node.start + 1 + 'scripts'.length,
								localizedOnly: true,
							});
						}
					}
				}
			}
		})

		if (i18nImport.specifiers.length == 0) {
			fileLogger.info(`Importing i18n without specifiers, removing the import.`);
			modifications.push({
				type: 'delete',
				begin: i18nImport.start,
				end: i18nImport.end,
				localizedOnly: false,
			});
			continue;
		}

		if (i18nImport.specifiers.length != 1) {
			fileLogger.info(`There are multiple identifiers imported. Skipping inlining.`);
			continue;
		}
		const i18nImportSpecifier = i18nImport.specifiers[0];
		if (i18nImportSpecifier.type !== 'ImportSpecifier') {
			fileLogger.warn(`Unexpected import specifier type ${i18nImportSpecifier.type}. Skipping inlining.`);
			continue;
		}

		const importingIdentifier = i18nImportSpecifier.imported.type === 'Identifier' ? i18nImportSpecifier.imported.name : i18nImportSpecifier.imported.value;
		if (importingIdentifier !== 'i18n') {
			fileLogger.warn(`Unexpected import identifier ${importingIdentifier}. Skipping inlining.`);
			continue;
		}
		const localI18nIdentifier = i18nImportSpecifier.local.name;

		// Check if the identifier is already declared in the file.
		// If it is, we may overwrite it and cause issues so we skip inlining
		let isSupported = true;
		estreeWalker.walk(programNode, {
			enter(node) {
				if (node.type == 'VariableDeclaration') {
					assertType<estree.VariableDeclaration>(node);
					for (let id of node.declarations.flatMap(x => declsOfPattern(x.id))) {
						if (id == localI18nIdentifier) {
							isSupported = false;
						}
					}
				}
			}
		})

		if (!isSupported) {
			fileLogger.error(`Duplicated identifier "${localI18nIdentifier}" in variable declaration. Skipping inlining.`);
			continue;
		}

		fileLogger.debug(`imports i18n as ${localI18nIdentifier}`);

		// In case of substitution failure, we will preserve the import statement
		// otherwise we will remove it.
		let preserveI18nImport = false;

		const nodesToSkip = new Set<estree.Node>();
		nodesToSkip.add(i18nImportSpecifier);
		estreeWalker.walk(programNode, {
			enter(this: import('estree-walker/types/walker').WalkerContext, node, parent, property) {
				assertType<AstNode>(node)
				assertType<AstNode>(parent)
				if (nodesToSkip.has(node)) {
					// This is the import specifier, skip processing it
					this.skip();
					return;
				}

				// We don't care original name part of the import declaration
				if (node.type == 'ImportDeclaration') this.skip();

				if (node.type === 'Identifier') {
					assertType<estree.Identifier>(node)
					assertType<estree.Property | estree.MemberExpression | estree.ExportSpecifier>(parent)
					if (parent.type === 'Property' && !parent.computed && property == 'key') return; // we don't care 'id' part of { id: expr }
					if (parent.type === 'MemberExpression' && !parent.computed && property == 'property') return; // we don't care 'id' part of { id: expr }
					if (parent.type === 'ExportSpecifier' && property == 'exported') return; // we don't care 'id' part of { id: expr }
					if (node.name == localI18nIdentifier) {
						fileLogger.error(`${lineCol(sourceCode, node)}: Using i18n identifier "${localI18nIdentifier}" directly. Skipping inlining.`);
						preserveI18nImport = true;
					}
				} else if (node.type === 'CallExpression') {
					assertType<estree.CallExpression>(node)
					const i18nPath = parseI18nPropertyAccess(node.callee);
					if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] == 'tsx' && node.arguments.length == 1) {
						// it's parameterized locale substitution (`i18n.tsx.property(parameters)`)
						// we expect the parameter to be an object literal
						assertType<AstNode>(node.callee);
						const codeSnippet = sourceCode.substring(node.start, node.end);
						fileLogger.debug(`${lineCol(sourceCode, node)}: found i18n function access ${codeSnippet}`);
						modifications.push({
							type: 'parameterized-function',
							begin: node.callee.start,
							end: node.callee.end,
							localizationKey: i18nPath.slice(1), // remove 'tsx' prefix
							localizedOnly: true,
						});
						this.skip();
					}
				} else if (node.type === 'MemberExpression') {
					assertType<estree.MemberExpression>(node);
					if (parent.type === 'CallExpression' && property == 'callee') return; // we don't want to process `i18n.ts.property.stringBuiltinMethod()`
					const i18nPath = parseI18nPropertyAccess(node);
					if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] == 'ts') {
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
					}
				} else if (node.type === 'Literal') {
					assertType<estree.Literal>(node);
					if (typeof node.value === 'string' && node.raw) {
						// we find `scripts/\w+\.js` literal and replace 'scripts' part with locale code
						const match = node.raw.match(/^(['"])scripts\/([^']+\.js)\1$/);
						if (match) {
							fileLogger.debug(`${lineCol(sourceCode, node)}: found scripts/ path literal ${node.raw}`);
							modifications.push({
								type: 'locale-name',
								begin: node.start + 1,
								end: node.start + 1 + 'scripts'.length,
								localizedOnly: true,
							});
						}
					}
				} else if (node.type === 'ArrowFunctionExpression') {
					assertType<estree.ArrowFunctionExpression>(node);
					// If there is 'i18n' in the parameters, we care interior of the function
					if (node.params.flatMap(param => declsOfPattern(param)).includes(localI18nIdentifier)) this.skip();
				}
			}
		})

		if (!preserveI18nImport) {
			fileLogger.debug(`removing i18n import statement`);
			modifications.push({
				type: 'delete',
				begin: i18nImport.start,
				end: i18nImport.end,
				localizedOnly: true,
			});
		}

		function parseI18nPropertyAccess(node: estree.Expression | estree.Super): string[] | null {
			if (node.type === 'Identifier' && node.name == localI18nIdentifier) return []; // i18n itself
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
	}

	const localeNames = Object.keys(locales);
	for (const localeName of localeNames) {
		const localeLogger = localeName == 'ja-JP' ? logger : blankLogger; // we want to log for single locale only
		const localeDir = path.join(outputDir, localeName);
		await fs.mkdir(localeDir, { recursive: true });

		const localeJson = locales[localeName];

		for (const fileName of filesToCopy) {
			const fileLogger = localeLogger.prefixed(`${fileName} (${scriptNameByPath[fileName]}): `);
			const [, sourceCode] = parsedScripts[fileName];
			const outPath = path.join(localeDir, fileName);

			const magicString = new MagicString(sourceCode);

			for (const modification of modificationsByFileName[fileName] ?? []) {
				switch (modification.type) {
					case "delete":
						magicString.remove(modification.begin, modification.end);
						break;
					case "insert":
						magicString.appendRight(modification.begin, modification.text);
						break;
					case "localized": {
						const accessed = getPropertyByPath(localeJson, modification.localizationKey);
						if (accessed == null) {
							fileLogger.error(`Cannot find localization key ${modification.localizationKey.join('.')}`);
						}
						let replacement: string;
						if (typeof accessed === 'string') {
							replacement = JSON.stringify(accessed);
						} else {
							const jsonString = JSON.stringify(JSON.stringify(accessed));
							replacement = `JSON.parse(${jsonString})`;
						}
						magicString.update(modification.begin, modification.end, replacement);
						break;
					}
					case "parameterized-function":{
						const accessed = getPropertyByPath(localeJson, modification.localizationKey);
						let replacement: string;
						if (typeof accessed !== 'string') {
							fileLogger.error(`Cannot find localization key ${modification.localizationKey.join('.')}`);
							replacement = '(() => "")'; // placeholder for missing locale
						} else {
							const params = new Set<string>();
							const components: string[] = [];
							let lastIndex = 0;
							for (const match of accessed.matchAll(/\{(.+?)}/g)) {
								const [fullMatch, paramName] = match;
								if (lastIndex < match.index) {
									components.push(JSON.stringify(accessed.slice(lastIndex, match.index)));
								}
								params.add(paramName);
								components.push(paramName);
								lastIndex = match.index + fullMatch.length;
							}
							components.push(JSON.stringify(accessed.slice(lastIndex)));

							// we replace with `(({name,count})=>(name+count+"some"))`
							const paramList = Array.from(params).join(',');
							let body = components.filter(x => x != '""').join('+');
							if (body == '') body = '""'; // if the body is empty, we return empty string
							replacement = `(({${paramList}})=>(${body}))`;
						}
						magicString.update(modification.begin, modification.end, replacement);
						break;
					}
					case "locale-name": {
						magicString.update(modification.begin, modification.end, localeName);
						break;
					}
					default: {
						assertNever(modification);
					}
				}
			}

			await fs.writeFile(outPath, magicString.toString(), 'utf-8');
		}
	}
}

function declsOfPattern(pattern: estree.Pattern | null): string[] {
	if (pattern == null) return [];
	switch (pattern?.type) {
		case "Identifier":
			return [pattern.name];
		case "ObjectPattern":
			return pattern.properties.flatMap(prop => {
				switch (prop.type) {
					case 'Property':
						return declsOfPattern(prop.value);
					case 'RestElement':
						return declsOfPattern(prop.argument);
					default:
						assertNever(prop)
				}
			});
		case "ArrayPattern":
			return pattern.elements.flatMap(p => declsOfPattern(p));
		case "RestElement":
			return declsOfPattern(pattern.argument);
		case "AssignmentPattern":
			return declsOfPattern(pattern.left);
		case "MemberExpression":
			// assignment pattern so no new variable is declared
			return [];
		default:
			assertNever(pattern);
	}
}


function assertNever(x: never): never {
	throw new Error(`Unexpected type: ${(x as any)?.type ?? x}`);
}


function assertType<T>(node: unknown): asserts node is T {
}

async function build() {
	await fs.rm(outputDir, { recursive: true, force: true });
	await viteBuild();
	await buildAllLocale();
}

const debug = false;
type Logger = ReturnType<typeof loggerFactory>;
function loggerFactory(prefix: string) {
	return {
		debug: (message: string) => void (debug && console.log(`[DBG] ${prefix}${message}`)),
		warn: (message: string) => console.log(`${debug ? '[WRN]' : 'w:'} ${prefix}${message}`),
		error: (message: string) => console.error(`${debug ? '[ERR]' : 'e:'} ${prefix}${message}`),
		info: (message: string) => console.error(`${debug ? '[INF]' : 'i:'} ${prefix}${message}`),
		prefixed: (newPrefix: string) => loggerFactory(`${prefix}${newPrefix}`),
	};
}
const blankLogger: Logger = {
	debug: () => void 0,
	warn: () => void 0,
	error: () => void 0,
	info: () => void 0,
	prefixed: () => blankLogger,
}
const logger = loggerFactory('');

await build();
