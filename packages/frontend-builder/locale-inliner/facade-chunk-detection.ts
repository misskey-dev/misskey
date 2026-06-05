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
	// if file is like following we treat them as facade.
	// ```
	// import { something } from "file";
	// export { something };
	// ```
	if (programNode.body.length !== 2) return null; // not a facade
	if (programNode.body[0].type !== 'ImportDeclaration') return null; // not a facade
	if (programNode.body[1].type !== 'ExportNamedDeclaration') return null; // not a facade
	const importDecl = programNode.body[0];
	const exportDecl = programNode.body[1];

	// the file is a facade file.

	const sourcePath = importDecl.source.value;
	const sourceName = path.posix.basename(sourcePath);

	const importNameMap = Object.fromEntries(importDecl.specifiers
		.map(specifier => {
			if (specifier.type !== 'ImportSpecifier') throw new Error(`${fileName}: Unexpected import specifier in facade module: ${specifier.type}`);
			const exportName = getExportName(specifier.imported);
			const localName = specifier.local.name;
			return [localName, exportName];
		}));
	const nameMap = Object.fromEntries(exportDecl.specifiers.map(spec => {
		const localName = getExportName(spec.local);
		const facadeExportName = getExportName(spec.exported);
		const moduleExportName = importNameMap[localName];
		return [facadeExportName, moduleExportName];
	}));

	return {
		fileName: sourceName,
		nameMap,
	};
}

function getExportName(node: RolldownESTree.ModuleExportName): string {
	return node.type === 'Literal' ? node.value : node.name;
}
