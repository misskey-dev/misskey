/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import path from 'node:path';
import { parseAst } from 'rolldown/parseAst';
import type { Logger } from '../logger.js';
import type { ESTree as RolldownESTree } from 'rolldown/utils';

interface FacadeInfo {
	fileName: string,
	// facade export name => internal name
	nameMap: Partial<Record<string, string>>,
}

export function detectI18nFacadeChunk(
	sourceCode: string,
	fileName: string,
	fileLogger: Logger,
): FacadeInfo | null {
	let programNode: RolldownESTree.Program;
	try {
		programNode = parseAst(sourceCode);
	} catch (err) {
		fileLogger.error(`Failed to parse source code: ${err}`);
		return null;
	}
	if (programNode.sourceType !== 'module') {
		fileLogger.error('Source code is not a module.');
		return null;
	}

	// check if the file is like facade.
	// The exact shape of the facade chunk depends on the bundler version, so we accept any module
	// that consists only of import / re-export statements. e.g.
	// ```
	// import { something } from "file";
	// export { something };
	// ```
	// or
	// ```
	// export { something } from "file";
	// ```
	if (programNode.body.length === 0) return null;
	const isFacadeStatement = (stmt: RolldownESTree.Statement | RolldownESTree.Directive | RolldownESTree.ModuleDeclaration) =>
		stmt.type === 'ImportDeclaration'
		|| stmt.type === 'ExportAllDeclaration'
		|| (stmt.type === 'ExportNamedDeclaration' && stmt.declaration == null);
	if (!programNode.body.every(isFacadeStatement)) return null; // not a facade

	// the file is a facade file.

	// local name => [source, imported name]
	const importNameMap = new Map<string, [string, string]>();
	// facade export name => [source, imported name]
	const exportMap = new Map<string, [string, string]>();

	for (const stmt of programNode.body) {
		if (stmt.type === 'ImportDeclaration') {
			for (const specifier of stmt.specifiers) {
				if (specifier.type !== 'ImportSpecifier') throw new Error(`${fileName}: Unexpected import specifier in facade module: ${specifier.type}`);
				importNameMap.set(specifier.local.name, [stmt.source.value, getExportName(specifier.imported)]);
			}
		}
	}

	for (const stmt of programNode.body) {
		if (stmt.type === 'ExportAllDeclaration') {
			throw new Error(`${fileName}: Unsupported 'export *' statement in facade module`);
		}
		if (stmt.type !== 'ExportNamedDeclaration') continue;
		for (const spec of stmt.specifiers) {
			const localName = getExportName(spec.local);
			const facadeExportName = getExportName(spec.exported);
			if (stmt.source != null) {
				// export { local as exported } from "file";
				exportMap.set(facadeExportName, [stmt.source.value, localName]);
			} else {
				// import { imported as local } from "file"; export { local as exported };
				const imported = importNameMap.get(localName);
				if (imported == null) throw new Error(`${fileName}: Facade module exports '${localName}' which is not imported`);
				exportMap.set(facadeExportName, imported);
			}
		}
	}

	const sources = new Set([...exportMap.values()].map(([source]) => source));
	if (sources.size !== 1) {
		throw new Error(`${fileName}: Facade module is expected to re-export from exactly one module, but got: ${JSON.stringify([...sources])}`);
	}
	const [sourcePath] = sources;

	return {
		fileName: path.posix.basename(sourcePath),
		nameMap: Object.fromEntries([...exportMap].map(([exported, [, imported]]) => [exported, imported])),
	};
}

function getExportName(node: RolldownESTree.ModuleExportName): string {
	return node.type === 'Literal' ? node.value : node.name;
}
