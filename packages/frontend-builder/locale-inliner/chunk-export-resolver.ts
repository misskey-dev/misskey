/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as path from 'node:path';
import { declsOfPattern, getModuleExportName } from '../utils.js';
import type { ESTree } from 'rolldown/utils';

/**
 * The binding that is defined (not re-exported) in some chunk.
 */
export interface ResolvedBinding {
	fileName: string;
	exportName: string;
}

type ExportEntry =
	// defined in this chunk (or something we cannot follow, like namespace object)
	| { type: 'local' }
	// re-exported from another module
	| { type: 'reexport', source: string, name: string };

interface ChunkExports {
	named: Map<string, ExportEntry>;
	// `export * from "source"`
	stars: string[];
}

/**
 * Resolves exports of the bundled chunks only using semantics of ES Modules.
 *
 * The bundler may emit facade chunks to keep entry signatures, and the shape of the facade chunk
 * (e.g. `import { t } from "x"; export { t as i18n };` or `export { t as i18n } from "x";`)
 * may change between bundler versions. By following the import / export statements, we can find the
 * chunk which actually defines the binding regardless of the shape of the facade.
 */
export class ChunkExportResolver {
	#chunks = new Map<string, ChunkExports>();

	constructor(chunks: Iterable<{ fileName: string, program: ESTree.Program }>) {
		for (const chunk of chunks) {
			this.#chunks.set(chunk.fileName, collectExports(chunk.program));
		}
	}

	/**
	 * Resolves a relative import source in `importerFileName` to the file name of the chunk.
	 * Returns null if the source is not one of the known chunks (e.g. external modules).
	 */
	resolveSource(importerFileName: string, source: string): string | null {
		if (!source.startsWith('./') && !source.startsWith('../')) return null;
		const fileName = path.posix.join(path.posix.dirname(importerFileName), source);
		return this.#chunks.has(fileName) ? fileName : null;
	}

	/**
	 * Resolves the export `exportName` of the chunk `fileName` to the chunk and export name that defines it.
	 * Returns null if the export does not exist or cannot be resolved.
	 */
	resolveExport(fileName: string, exportName: string, visited = new Set<string>()): ResolvedBinding | null {
		const key = `${fileName}\0${exportName}`;
		if (visited.has(key)) return null; // circular re-export
		visited.add(key);

		const chunk = this.#chunks.get(fileName);
		if (chunk == null) return null;

		const entry = chunk.named.get(exportName);
		if (entry != null) {
			switch (entry.type) {
				case 'local':
					return { fileName, exportName };
				case 'reexport': {
					const source = this.resolveSource(fileName, entry.source);
					if (source == null) return null;
					return this.resolveExport(source, entry.name, visited);
				}
			}
		}

		// `export *` does not re-export default
		if (exportName === 'default') return null;
		for (const star of chunk.stars) {
			const source = this.resolveSource(fileName, star);
			if (source == null) continue;
			const resolved = this.resolveExport(source, exportName, visited);
			if (resolved != null) return resolved;
		}

		return null;
	}

	/**
	 * Resolves the binding imported by the import specifier in the chunk `importerFileName`.
	 */
	resolveImport(importerFileName: string, source: string, importedName: string): ResolvedBinding | null {
		const sourceFileName = this.resolveSource(importerFileName, source);
		if (sourceFileName == null) return null;
		return this.resolveExport(sourceFileName, importedName);
	}
}

function collectExports(program: ESTree.Program): ChunkExports {
	// local name => imported binding
	const imports = new Map<string, ExportEntry>();
	for (const stmt of program.body) {
		if (stmt.type !== 'ImportDeclaration') continue;
		for (const specifier of stmt.specifiers) {
			switch (specifier.type) {
				case 'ImportSpecifier':
					imports.set(specifier.local.name, { type: 'reexport', source: stmt.source.value, name: getModuleExportName(specifier.imported) });
					break;
				case 'ImportDefaultSpecifier':
					imports.set(specifier.local.name, { type: 'reexport', source: stmt.source.value, name: 'default' });
					break;
				case 'ImportNamespaceSpecifier':
					// namespace object is a new object, so we treat it as local
					imports.set(specifier.local.name, { type: 'local' });
					break;
			}
		}
	}

	const named = new Map<string, ExportEntry>();
	const stars: string[] = [];
	for (const stmt of program.body) {
		switch (stmt.type) {
			case 'ExportNamedDeclaration': {
				if (stmt.declaration != null) {
					for (const name of declaredNames(stmt.declaration)) {
						named.set(name, { type: 'local' });
					}
				}
				for (const spec of stmt.specifiers) {
					const localName = getModuleExportName(spec.local);
					const exportedName = getModuleExportName(spec.exported);
					if (stmt.source != null) {
						// export { local as exported } from "source";
						named.set(exportedName, { type: 'reexport', source: stmt.source.value, name: localName });
					} else {
						// export { local as exported }; where local may be imported binding
						named.set(exportedName, imports.get(localName) ?? { type: 'local' });
					}
				}
				break;
			}
			case 'ExportAllDeclaration':
				if (stmt.exported == null) {
					stars.push(stmt.source.value);
				} else {
					// export * as ns from "source"; creates new namespace object
					named.set(getModuleExportName(stmt.exported), { type: 'local' });
				}
				break;
			case 'ExportDefaultDeclaration':
				named.set('default', { type: 'local' });
				break;
		}
	}

	return { named, stars };
}

function declaredNames(declaration: ESTree.Declaration): string[] {
	switch (declaration.type) {
		case 'VariableDeclaration':
			return declaration.declarations.flatMap(x => declsOfPattern(x.id));
		case 'FunctionDeclaration':
		case 'ClassDeclaration':
			return declaration.id != null ? [declaration.id.name] : [];
		default:
			// TypeScript only declarations, which never appear in the bundled output
			return [];
	}
}
