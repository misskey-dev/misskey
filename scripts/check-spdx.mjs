/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// @ts-check
/**
 * Misskey SPDX ヘッダーの検査 / 自動修正。
 *
 * 使い方:
 *   node scripts/check-spdx.mjs                    ローカル検査 (repo 全体 + HTML コメント形式)
 *   node scripts/check-spdx.mjs --check            同上 (明示形)
 *   node scripts/check-spdx.mjs --ci               CI 互換検査 (現行の OR 判定を維持)
 *   node scripts/check-spdx.mjs --fix [--base REF] このブランチの欠落だけ自動修正して全体を再検査
 *
 * 終了コード:
 *   0 = 選択したモードの検査に合格
 *   1 = SPDX 欠落またはローカル検査でのコメント形式違反
 *   2 = 引数、Git ref、ファイル列挙・読取などの理由で検査不能
 *
 * CI 互換判定は、現行 CI と同じく copyright 行または AGPL license 行のどちらか
 * 一方が全文のどこかにあれば pass する。この判定はライセンス表記の完全性や正当性を
 * 保証しない。ローカル検査は、加えて .vue / .html のコメント形式を検査する。
 *
 * --check / --ci の合否はブランチの所有権で絞らない。--fix だけが統合先との差分を
 * 使い、自分の変更に含まれる欠落へ修正対象を限定する。修正後は必ず全体を再検査する。
 */

import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { TextDecoder } from 'node:util';

/** CI の対象ディレクトリ。この配列を CI とローカル検査の両方が使う。 */
const TARGET_DIRECTORIES = [
	'packages/backend/migration',
	'packages/backend/src',
	'packages/backend/test',
	'packages/frontend-shared/@types',
	'packages/frontend-shared/js',
	'packages/frontend-builder',
	'packages/frontend/.storybook',
	'packages/frontend/@types',
	'packages/frontend/lib',
	'packages/frontend/public',
	'packages/frontend/src',
	'packages/frontend/test',
	'packages/frontend-embed/@types',
	'packages/frontend-embed/src',
	'packages/icons-subsetter/src',
	'packages/misskey-bubble-game/src',
	'packages/misskey-reversi/src',
	'packages/sw/src',
	'scripts',
];

const TARGET_EXTENSIONS = new Set(['.cjs', '.html', '.js', '.mjs', '.scss', '.ts', '.vue']);
const EXCLUDED_CONFIG_EXTENSIONS = new Set(['.cjs', '.js', '.mjs', '.ts']);
const HTML_COMMENT_EXTENSIONS = new Set(['.vue', '.html']);

const COPYRIGHT_LINE = 'SPDX-FileCopyrightText: syuilo and misskey-project';
const LICENSE_LINE = 'SPDX-License-Identifier: AGPL-3.0-only';

const HTML_HEADER = `<!--\n${COPYRIGHT_LINE}\n${LICENSE_LINE}\n-->\n\n`;
const BLOCK_HEADER = `/*\n * ${COPYRIGHT_LINE}\n * ${LICENSE_LINE}\n */\n\n`;

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });
const INTEGRATION_REFS = ['origin/develop', 'develop', 'origin/master', 'master'];

/** @typedef {'check' | 'fix' | 'ci'} Mode */
/** @typedef {'missing' | 'wrong-form' | 'ok'} Verdict */

class OperationalError extends Error {}

/**
 * @param {string[]} args
 * @param {{ quiet?: boolean }} [options]
 * @returns {Buffer}
 */
function gitBuffer(args, options = {}) {
	return execFileSync('git', args, {
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', options.quiet === true ? 'ignore' : 'inherit'],
	});
}

/**
 * @param {Buffer} buffer
 * @param {string} context
 * @returns {string}
 */
function decodeGitOutput(buffer, context) {
	try {
		return UTF8_DECODER.decode(buffer);
	} catch {
		throw new OperationalError(`${context}: Git 出力に UTF-8 でないファイル名が含まれる`);
	}
}

/**
 * @param {string[]} args
 * @param {{ quiet?: boolean }} [options]
 * @returns {string[]}
 */
function gitLines(args, options = {}) {
	return decodeGitOutput(gitBuffer(args, options), `git ${args[0]}`)
		.split('\n')
		.filter((line) => line !== '');
}

/**
 * NUL 区切りの Git パス出力を、空白・改行を壊さず配列化する。
 *
 * @param {string[]} args
 * @param {{ quiet?: boolean }} [options]
 * @returns {string[]}
 */
function gitPaths(args, options = {}) {
	return decodeGitOutput(gitBuffer(args, options), `git ${args[0]}`)
		.split('\0')
		.filter((path) => path !== '');
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isRegularFile(file) {
	try {
		return lstatSync(file).isFile();
	} catch (error) {
		if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return false;
		throw new OperationalError(`${file}: ファイル種別を確認できない`);
	}
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isTargetPath(file) {
	const ext = extname(file);
	if (!TARGET_EXTENSIONS.has(ext)) return false;

	const name = basename(file);
	if (name.includes('eslint')) return false;
	if (EXCLUDED_CONFIG_EXTENSIONS.has(ext) && name.endsWith(`.config${ext}`)) return false;

	return isRegularFile(file);
}

/**
 * @param {boolean} includeUntracked
 * @returns {string[]}
 */
function listTargetFiles(includeUntracked) {
	const args = ['ls-files', '--cached'];
	if (includeUntracked) args.push('--others', '--exclude-standard');
	args.push('-z', '--', ...TARGET_DIRECTORIES);

	return [...new Set(gitPaths(args))].filter(isTargetPath);
}

/**
 * @param {string} ref
 * @returns {string}
 */
function mergeBaseFor(ref) {
	try {
		const base = gitLines(['merge-base', ref, 'HEAD'], { quiet: true })[0];
		if (base === undefined) throw new Error('empty merge-base');
		return base;
	} catch {
		throw new OperationalError(`merge-base を解決できない: ${ref}`);
	}
}

/**
 * @param {string | null} explicitRef
 * @returns {string}
 */
function resolveMergeBase(explicitRef) {
	if (explicitRef !== null) return mergeBaseFor(explicitRef);

	/** @type {{ base: string, distance: number }[]} */
	const candidates = [];
	for (const ref of INTEGRATION_REFS) {
		try {
			const base = mergeBaseFor(ref);
			const distanceText = gitLines(['rev-list', '--count', `${base}..HEAD`], { quiet: true })[0];
			const distance = Number(distanceText);
			if (Number.isInteger(distance)) candidates.push({ base, distance });
		} catch {
			// この環境に無い統合先 ref は候補から外す。
		}
	}

	if (candidates.length === 0) {
		throw new OperationalError('統合先の merge-base を解決できない。--base <ref> を指定すること');
	}

	candidates.sort((a, b) => a.distance - b.distance);
	return candidates[0].base;
}

/**
 * @param {string | null} explicitRef
 * @returns {Set<string>}
 */
function listLocalChanges(explicitRef) {
	const base = resolveMergeBase(explicitRef);
	return new Set([
		...gitPaths(['diff', '--name-only', '--diff-filter=d', '-z', `${base}...HEAD`]),
		...gitPaths(['diff', '--name-only', '--diff-filter=d', '-z', 'HEAD']),
		...gitPaths(['ls-files', '--others', '--exclude-standard', '-z']),
	]);
}

/**
 * @param {string} text
 * @param {number} index
 * @returns {boolean}
 */
function isInsideHtmlComment(text, index) {
	const before = text.slice(0, index);
	const lastOpen = before.lastIndexOf('<!--');
	if (lastOpen === -1) return false;
	const close = text.indexOf('-->', lastOpen + '<!--'.length);
	return close !== -1 && index < close;
}

/**
 * @param {string} file
 * @returns {Verdict}
 */
function judge(file) {
	let text;
	try {
		text = readFileSync(file, 'utf8');
	} catch {
		throw new OperationalError(`${file}: 内容を読み取れない`);
	}

	const positions = [text.indexOf(COPYRIGHT_LINE), text.indexOf(LICENSE_LINE)].filter((index) => index >= 0);
	if (positions.length === 0) return 'missing';
	if (!HTML_COMMENT_EXTENSIONS.has(extname(file))) return 'ok';

	return positions.every((position) => isInsideHtmlComment(text, position)) ? 'ok' : 'wrong-form';
}

/**
 * @param {string} file
 * @returns {void}
 */
function insertHeader(file) {
	const original = readFileSync(file, 'utf8');
	const bom = original.charCodeAt(0) === 0xfeff ? '﻿' : '';
	const body = bom === '' ? original : original.slice(1);
	const eol = body.includes('\r\n') ? '\r\n' : '\n';

	/** @param {string} header */
	const withEol = (header) => (eol === '\n' ? header : header.replaceAll('\n', eol));

	if (HTML_COMMENT_EXTENSIONS.has(extname(file))) {
		writeFileSync(file, bom + withEol(HTML_HEADER) + body);
		return;
	}

	const newlineIndex = body.indexOf('\n');
	const firstLine = (newlineIndex === -1 ? body : body.slice(0, newlineIndex)).replace(/\r$/, '');

	if (firstLine.startsWith('#!') || firstLine.startsWith('@charset')) {
		const rest = newlineIndex === -1 ? '' : body.slice(newlineIndex + 1);
		writeFileSync(file, bom + firstLine + eol + eol + withEol(BLOCK_HEADER) + rest);
		return;
	}

	writeFileSync(file, bom + withEol(BLOCK_HEADER) + body);
}

/**
 * @param {string[]} args
 * @returns {{ mode: Mode, baseRef: string | null } | null}
 */
function parseArgs(args) {
	/** @type {Mode} */ let mode = 'check';
	let explicitMode = false;
	/** @type {string | null} */ let baseRef = null;

	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === '--check' || arg === '--fix' || arg === '--ci') {
			if (explicitMode) return null;
			mode = arg === '--check' ? 'check' : arg === '--fix' ? 'fix' : 'ci';
			explicitMode = true;
			continue;
		}
		if (arg === '--base') {
			if (baseRef !== null || args[index + 1] === undefined || args[index + 1].startsWith('--')) return null;
			baseRef = args[++index];
			continue;
		}
		return null;
	}

	if (baseRef !== null && mode !== 'fix') return null;
	return { mode, baseRef };
}

/**
 * @param {string[]} targets
 * @returns {{ missing: string[], wrongForm: string[] }}
 */
function inspectTargets(targets) {
	/** @type {string[]} */ const missing = [];
	/** @type {string[]} */ const wrongForm = [];

	for (const file of targets) {
		const verdict = judge(file);
		if (verdict === 'missing') missing.push(file);
		if (verdict === 'wrong-form') wrongForm.push(file);
	}

	return { missing, wrongForm };
}

/**
 * @returns {number}
 */
function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options === null) {
		console.error('usage: node scripts/check-spdx.mjs [--check | --ci | --fix [--base <ref>]]');
		return 2;
	}

	try {
		const root = gitLines(['rev-parse', '--show-toplevel'])[0];
		if (root === undefined) throw new OperationalError('git リポジトリの外で実行された');
		process.chdir(root);

		const includeUntracked = options.mode !== 'ci';
		let targets = listTargetFiles(includeUntracked);
		/** @type {string[]} */ const fixed = [];

		if (options.mode === 'fix') {
			const localChanges = listLocalChanges(options.baseRef);
			const initial = inspectTargets(targets);
			for (const file of initial.missing) {
				if (!localChanges.has(file)) continue;
				insertHeader(file);
				fixed.push(file);
			}
			targets = listTargetFiles(true);
		}

		const result = inspectTargets(targets);
		for (const file of fixed) console.log(`fixed:      ${file}`);
		for (const file of result.missing) console.log(`missing:    ${file}`);
		if (options.mode !== 'ci') {
			for (const file of result.wrongForm) console.log(`wrong-form: ${file}`);
		}
		if (fixed.length > 0 || result.missing.length > 0 || (options.mode !== 'ci' && result.wrongForm.length > 0)) {
			console.log('');
		}

		const failed = result.missing.length > 0 || (options.mode !== 'ci' && result.wrongForm.length > 0);
		if (!failed) {
			if (options.mode === 'ci') {
				console.log(`SPDX CI: OK — 現行 OR 判定を対象 ${targets.length} ファイルが通過した。`);
			} else {
				const prefix = fixed.length > 0 ? `${fixed.length} ファイルを修正し、` : '';
				console.log(`SPDX: OK — ${prefix}CI 判定と HTML コメント形式を対象 ${targets.length} ファイルが通過した。追加確認は不要。`);
			}
			return 0;
		}

		if (result.missing.length > 0) {
			console.log(`SPDX: CI 判定上の欠落 ${result.missing.length} 件。`);
			if (options.mode === 'check') {
				console.log("SPDX: 統合先との差分に含まれる欠落は '--fix' で自動修正できる。");
			} else if (options.mode === 'fix') {
				console.log('SPDX: --fix の対象外を含む欠落が残っているため、CI は通らない。');
			}
		}
		if (options.mode !== 'ci' && result.wrongForm.length > 0) {
			console.log(`SPDX: HTML コメント形式違反 ${result.wrongForm.length} 件。`);
		}
		return 1;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`SPDX: 検査不能 — ${message}`);
		return 2;
	}
}

// process.exit() だと stdout が pipe のとき未フラッシュの出力が切り捨てられる。
process.exitCode = main();
