/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'fs/promises';
import * as path from 'node:path';
import MagicString from 'magic-string';
import { parseAst } from 'rolldown/parseAst';
import { collectModifications } from './locale-inliner/collect-modifications.js';
import { applyWithLocale } from './locale-inliner/apply-with-locale.js';
import { blankLogger } from './logger.js';
import { ChunkExportResolver } from './locale-inliner/chunk-export-resolver.js';
import type { Logger } from './logger.js';
import type { ESTree } from 'rolldown/utils';
import type { Locale } from 'i18n';
import type { Manifest as ViteManifest } from 'vite';

export class LocaleInliner {
	outputDir: string;
	scriptsDir: string;
	i18nFile: string;
	i18nFileName: string;
	i18nSymbol: string;
	logger: Logger;
	chunks: ScriptChunk[];

	static async create(options: {
		outputDir: string,
		scriptsDir: string,
		i18nFile: string,
		logger: Logger,
	}): Promise<LocaleInliner> {
		const manifest: ViteManifest = JSON.parse(await fs.readFile(`${options.outputDir}/manifest.json`, 'utf-8'));
		return new LocaleInliner({ ...options, manifest });
	}

	constructor(options: {
		outputDir: string,
		scriptsDir: string,
		i18nFile: string,
		manifest: ViteManifest,
		logger: Logger,
	}) {
		this.outputDir = options.outputDir;
		this.scriptsDir = options.scriptsDir;
		this.i18nFile = options.i18nFile;
		this.i18nFileName = this.stripScriptDir(options.manifest[this.i18nFile].file);
		this.logger = options.logger;
		this.i18nSymbol = 'i18n';
		this.chunks = Object.values(options.manifest).filter(chunk => this.isScriptFile(chunk.file)).map(chunk => ({
			fileName: this.stripScriptDir(chunk.file),
			src: chunk.src,
			chunkName: chunk.name,
		}));
	}

	async loadFiles() {
		await Promise.all(this.chunks.map(async chunk => {
			const filePath = path.join(this.outputDir, this.scriptsDir, chunk.fileName);
			chunk.sourceCode = await fs.readFile(filePath, 'utf-8');
		}));
	}

	collectsModifications() {
		this.#detectI18nFacadeChunk();

		for (const chunk of this.chunks) {
			if (chunk.sourceCode == null) {
				throw new Error(`Source code for ${chunk.fileName} is not loaded.`);
			}
			if (chunk.isFacadeOfI18n) {
				chunk.modifications = [];
				continue;
			}
			const fileLogger = this.logger.prefixed(`${chunk.fileName} (${chunk.chunkName}): `);
			chunk.modifications = collectModifications(chunk.sourceCode, chunk.fileName, fileLogger, this);
		}

		if (!this.chunks.flatMap(x => x.modifications ?? []).some(x => x.type === 'localized')) {
			throw new Error('No localizations are inlined! this should mean locale inliner is not working well!');
		}
	}

	#detectI18nFacadeChunk() {
		// For some reason, even with `preserveEntrySignatures: 'allow-extension'`, rolldown may generate facade chunk
		// This method detects facade chunk and replace i18nFile / i18nFileName with correct file name.
		// The shape of the facade chunk depends on the bundler version, so we follow the import / export statements
		// to find the chunk and the export name that defines i18n instead of matching the shape of the facade chunk.
		const entryChunk = this.chunks.find(x => x.fileName === this.i18nFileName);
		if (entryChunk == null) throw new Error(`i18n script file '${this.i18nFile}' not found`);

		const programs = this.chunks.flatMap(chunk => {
			if (chunk.sourceCode == null) throw new Error(`Source code for ${chunk.fileName} is not loaded.`);
			if (chunk.sourceCode === '') return [];
			let program: ESTree.Program;
			try {
				program = parseAst(chunk.sourceCode);
			} catch {
				return []; // reported by collectModifications
			}
			return [{ fileName: chunk.fileName, program }];
		});
		const resolver = new ChunkExportResolver(programs);

		const resolved = resolver.resolveExport(this.i18nFileName, this.i18nSymbol);
		if (resolved == null) {
			throw new Error(`Failed to resolve export '${this.i18nSymbol}' of i18n script file '${this.i18nFile}' (${this.i18nFileName}).`);
		}
		if (resolved.fileName !== this.i18nFileName) {
			// facade chunk is skipped from collectModifications, so it must not contain anything other than imports and re-exports.
			const entryProgram = programs.find(x => x.fileName === this.i18nFileName)?.program;
			const isFacade = entryProgram?.body.every(stmt => stmt.type === 'ImportDeclaration'
				|| stmt.type === 'ExportAllDeclaration'
				|| (stmt.type === 'ExportNamedDeclaration' && stmt.declaration == null));
			if (!isFacade) {
				throw new Error(`i18n script file '${this.i18nFile}' (${this.i18nFileName}) re-exports ${this.i18nSymbol} from ${resolved.fileName}, but it is not a facade chunk consisting only of imports and re-exports.`);
			}
			this.logger.info(`We detected ${this.i18nFileName} is facade chunk maps ${resolved.fileName} with ${resolved.exportName} as ${this.i18nSymbol}`);
			entryChunk.isFacadeOfI18n = true;
			this.i18nFileName = resolved.fileName;
		}
		this.i18nSymbol = resolved.exportName;
	}

	async saveAllLocales(locales: Record<string, Locale>) {
		const localeNames = Object.keys(locales);
		for (const localeName of localeNames) {
			this.logger.info(`Creating bundle for ${localeName}`);
			await this.saveLocale(localeName, locales[localeName]);
		}
		this.logger.info('Done');
	}

	async saveLocale(localeName: string, localeJson: Locale) {
		// create directory
		await fs.mkdir(path.join(this.outputDir, localeName), { recursive: true });
		const localeLogger = localeName === 'ja-JP' ? this.logger : blankLogger; // we want to log for single locale only
		for (const chunk of this.chunks) {
			if (chunk.sourceCode == null || !chunk.modifications) {
				throw new Error(`Source code or modifications for ${chunk.fileName} is not available.`);
			}
			const fileLogger = localeLogger.prefixed(`${chunk.fileName} (${chunk.chunkName}): `);
			const magicString = new MagicString(chunk.sourceCode);
			applyWithLocale(magicString, chunk.modifications, localeName, localeJson, fileLogger);

			await fs.writeFile(path.join(this.outputDir, localeName, chunk.fileName), magicString.toString());
		}
	}

	isScriptFile(fileName: string) {
		return fileName.startsWith(this.scriptsDir + '/') && fileName.endsWith('.js');
	}

	stripScriptDir(fileName: string) {
		if (!fileName.startsWith(this.scriptsDir + '/')) {
			throw new Error(`${fileName} does not start with ${this.scriptsDir}/`);
		}
		return fileName.slice(this.scriptsDir.length + 1);
	}
}

interface ScriptChunk {
	fileName: string;
	chunkName?: string;
	sourceCode?: string;
	isFacadeOfI18n?: true;
	modifications?: TextModification[];
}

export type TextModification = {
	type: 'delete';
	begin: number;
	end: number;
	localizedOnly: boolean;
} | {
	// can be used later to insert '../scripts' for common files
	type: 'insert';
	begin: number;
	text: string;
	localizedOnly: boolean;
} | {
	type: 'replace';
	begin: number;
	end: number;
	text: string;
	localizedOnly: boolean;
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
	literal: boolean;
	localizedOnly: true;
} | {
	type: 'locale-json';
	begin: number;
	end: number;
	localizedOnly: true;
};
