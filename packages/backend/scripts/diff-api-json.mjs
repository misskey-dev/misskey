/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Normalized diff tool for `packages/backend/built/api.json` (the generated OpenAPI 3.1 spec).
 *
 * Purpose: during the AJV/json-schema -> Valibot migration, we want a cheap way to prove that
 * a batch of schema rewrites did not change the *observable* API contract. Since object key
 * order in the generated spec is an implementation detail (and `required` array order is not
 * meaningful either), a naive `diff built/api.json baseline.json` is too noisy to be useful.
 * This tool normalizes both sides (sorted object keys, sorted `required` arrays) before
 * comparing, and reports differences as a list of JSON Pointer paths.
 *
 * No external dependencies - only Node.js builtins (node:fs, node:path, node:url).
 *
 * Usage:
 *   node scripts/diff-api-json.mjs --snapshot [--out <path>] [--target <path>]
 *   node scripts/diff-api-json.mjs --baseline <path> [--target <path>] [--allow <allowlist.json>]
 *   node scripts/diff-api-json.mjs --help
 *
 * See --help for details.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_API_JSON = path.join(BACKEND_ROOT, 'built', 'api.json');
const DEFAULT_BASELINE = path.join(BACKEND_ROOT, '.api-json-baseline.json');

const HELP_TEXT = `\
diff-api-json.mjs - normalized comparator for packages/backend/built/api.json

Modes (mutually exclusive):

  --snapshot [--out <path>] [--target <path>]
      Normalize an api.json and save it as a baseline.
        --target <path>   source api.json to snapshot (default: ${relToCwd(DEFAULT_API_JSON)})
        --out <path>      where to write the normalized baseline (default: ${relToCwd(DEFAULT_BASELINE)})

  --baseline <path> [--target <path>] [--allow <allowlist.json>]
      Normalize both baseline and target, then report differences as JSON Pointer paths.
        --baseline <path>  previously saved baseline (required)
        --target <path>    api.json to compare against baseline (default: ${relToCwd(DEFAULT_API_JSON)})
        --allow <path>     JSON allowlist file (see below)

  --help, -h
      Show this message.

Normalization rules:
  - All object keys are sorted recursively (key order in the source spec is not significant).
  - The array under a "required" key is sorted (element order there is not significant).
  - All other arrays (enum, oneOf, anyOf, allOf, prefixItems, ...) keep their original order;
    order is treated as part of the value there.

Diff format:
  Each difference is { path, op, before, after } where:
    - path is an RFC 6901 JSON Pointer (~0 = "~", ~1 = "/") into the normalized document.
    - op is one of "add" (only in target), "remove" (only in baseline), "change" (present in
      both, different value).
    - If a node's type differs between baseline/target, or both are arrays of different
      length, the whole node is reported as one "change" - it is not recursed into.
    - Displayed before/after values are JSON-stringified and truncated to 200 characters.

Allowlist file format (JSON array):
  [
    { "pattern": "/paths/*/post/responses/404", "op": "add", "reason": "why this is expected" }
  ]
  - "pattern" is a glob over JSON Pointer segments: "*" matches exactly one segment, "**"
    matches zero or more segments.
  - "op" is optional; when omitted the entry matches any op (add/remove/change).
  - Allowlist entries that never match any actual difference are reported as warnings
    (stale/unused entries).

Exit code:
  0 if there are no unexpected (non-allowlisted) differences.
  1 otherwise, or on usage/IO errors.
`;

function relToCwd(p) {
	const rel = path.relative(process.cwd(), p);
	return rel.startsWith('..') ? p : rel;
}

function printHelp(stream) {
	stream.write(HELP_TEXT);
}

class UsageError extends Error {}

function parseArgs(argv) {
	const args = { snapshot: false, help: false };
	const valueFlags = ['out', 'baseline', 'target', 'allow'];
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--help' || a === '-h') {
			args.help = true;
			continue;
		}
		if (a === '--snapshot') {
			args.snapshot = true;
			continue;
		}
		let matched = false;
		for (const name of valueFlags) {
			if (a === `--${name}`) {
				const value = argv[i + 1];
				if (value === undefined) {
					throw new UsageError(`Missing value for --${name}`);
				}
				args[name] = value;
				i++;
				matched = true;
				break;
			}
			if (a.startsWith(`--${name}=`)) {
				args[name] = a.slice(name.length + 3);
				matched = true;
				break;
			}
		}
		if (!matched) {
			throw new UsageError(`Unknown argument: ${a}`);
		}
	}
	return args;
}

//#region normalization

function kindOf(v) {
	if (v === null) return 'null';
	if (Array.isArray(v)) return 'array';
	const t = typeof v;
	if (t === 'object') return 'object';
	return t; // 'string' | 'number' | 'boolean' | 'undefined'
}

/**
 * Recursively sort object keys. The array value of a "required" key is sorted too (its element
 * order is not semantically meaningful), but no other array is reordered.
 */
function normalize(value) {
	const kind = kindOf(value);
	if (kind === 'array') {
		return value.map(normalize);
	}
	if (kind === 'object') {
		const out = {};
		for (const key of Object.keys(value).sort()) {
			const v = value[key];
			if (key === 'required' && Array.isArray(v) && v.every(x => typeof x === 'string')) {
				out[key] = [...v].sort();
			} else {
				out[key] = normalize(v);
			}
		}
		return out;
	}
	return value; // null, string, number, boolean
}

//#endregion

//#region JSON Pointer

function escapeToken(token) {
	return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescapeToken(token) {
	return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function buildPointer(segments) {
	if (segments.length === 0) return '';
	return '/' + segments.map(escapeToken).join('/');
}

function pointerToSegments(pointer) {
	if (pointer === '') return [];
	if (!pointer.startsWith('/')) {
		throw new Error(`Invalid JSON Pointer (must start with "/" or be ""): ${pointer}`);
	}
	return pointer.slice(1).split('/').map(unescapeToken);
}

//#endregion

//#region diff

function diffNode(before, after, pathSegs, results) {
	const kb = kindOf(before);
	const ka = kindOf(after);

	if (kb !== ka) {
		results.push(makeDiff(pathSegs, 'change', before, after));
		return;
	}

	if (kb === 'array') {
		if (before.length !== after.length) {
			results.push(makeDiff(pathSegs, 'change', before, after));
			return;
		}
		for (let i = 0; i < before.length; i++) {
			diffNode(before[i], after[i], [...pathSegs, String(i)], results);
		}
		return;
	}

	if (kb === 'object') {
		const beforeKeys = new Set(Object.keys(before));
		const afterKeys = new Set(Object.keys(after));
		const allKeys = new Set([...beforeKeys, ...afterKeys]);
		for (const k of [...allKeys].sort()) {
			const inBefore = beforeKeys.has(k);
			const inAfter = afterKeys.has(k);
			if (inBefore && !inAfter) {
				results.push(makeDiff([...pathSegs, k], 'remove', before[k], undefined));
			} else if (!inBefore && inAfter) {
				results.push(makeDiff([...pathSegs, k], 'add', undefined, after[k]));
			} else {
				diffNode(before[k], after[k], [...pathSegs, k], results);
			}
		}
		return;
	}

	// primitive: null, string, number, boolean
	if (!Object.is(before, after)) {
		results.push(makeDiff(pathSegs, 'change', before, after));
	}
}

function makeDiff(pathSegs, op, before, after) {
	return { path: buildPointer(pathSegs), op, before, after };
}

function diffDocuments(before, after) {
	const results = [];
	diffNode(before, after, [], results);
	return results;
}

//#endregion

//#region allowlist

function loadAllowlist(allowPath) {
	if (allowPath === undefined) return [];
	const raw = readJson(allowPath, 'allowlist');
	if (!Array.isArray(raw)) {
		throw new Error(`Allowlist file must be a JSON array: ${allowPath}`);
	}
	return raw.map((entry, i) => {
		if (typeof entry !== 'object' || entry === null || typeof entry.pattern !== 'string') {
			throw new Error(`Allowlist entry #${i} must be an object with a "pattern" string field`);
		}
		if (entry.op !== undefined && !['add', 'remove', 'change'].includes(entry.op)) {
			throw new Error(`Allowlist entry #${i} has invalid "op": ${JSON.stringify(entry.op)}`);
		}
		return {
			pattern: entry.pattern,
			op: entry.op,
			reason: typeof entry.reason === 'string' ? entry.reason : '',
			patternSegments: pointerToSegments(entry.pattern),
		};
	});
}

/** Glob match of JSON Pointer segments: "*" = exactly one segment, "**" = zero or more segments. */
function globMatchSegments(patternSegs, pathSegs) {
	function matchAt(pi, si) {
		if (pi === patternSegs.length) return si === pathSegs.length;
		const seg = patternSegs[pi];
		if (seg === '**') {
			for (let k = si; k <= pathSegs.length; k++) {
				if (matchAt(pi + 1, k)) return true;
			}
			return false;
		}
		if (si === pathSegs.length) return false;
		if (seg === '*' || seg === pathSegs[si]) return matchAt(pi + 1, si + 1);
		return false;
	}

	return matchAt(0, 0);
}

function allowlistEntryMatches(entry, diff) {
	if (entry.op !== undefined && entry.op !== diff.op) return false;
	return globMatchSegments(entry.patternSegments, pointerToSegments(diff.path));
}

//#endregion

//#region display

function stringifyForDisplay(v) {
	if (v === undefined) return '<absent>';
	try {
		return JSON.stringify(v);
	} catch {
		return String(v);
	}
}

function truncate(s, n = 200) {
	return s.length > n ? `${s.slice(0, n)}…(truncated)` : s;
}

function formatDiffLine(diff) {
	const before = truncate(stringifyForDisplay(diff.before));
	const after = truncate(stringifyForDisplay(diff.after));
	return `  [${diff.op}] ${diff.path === '' ? '(root)' : diff.path}\n    before: ${before}\n    after:  ${after}`;
}

//#endregion

//#region IO helpers

function readJson(filePath, label) {
	let raw;
	try {
		raw = fs.readFileSync(filePath, 'utf-8');
	} catch (e) {
		throw new Error(`Failed to read ${label} at ${filePath}: ${e.message}`);
	}
	try {
		return JSON.parse(raw);
	} catch (e) {
		throw new Error(`Failed to parse ${label} at ${filePath} as JSON: ${e.message}`);
	}
}

//#endregion

function runSnapshot(args) {
	const sourcePath = args.target ?? DEFAULT_API_JSON;
	const outPath = args.out ?? DEFAULT_BASELINE;

	const raw = readJson(sourcePath, 'source api.json');
	const normalized = normalize(raw);

	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, JSON.stringify(normalized, null, '\t') + '\n', 'utf-8');

	process.stdout.write(`Wrote normalized baseline to ${relToCwd(outPath)} (source: ${relToCwd(sourcePath)})\n`);
	return 0;
}

function runDiff(args) {
	const baselinePath = args.baseline;
	const targetPath = args.target ?? DEFAULT_API_JSON;

	const baselineRaw = readJson(baselinePath, 'baseline');
	const targetRaw = readJson(targetPath, 'target api.json');

	const baseline = normalize(baselineRaw);
	const target = normalize(targetRaw);

	const diffs = diffDocuments(baseline, target);
	const allowlist = loadAllowlist(args.allow);
	const allowlistUsed = new Array(allowlist.length).fill(false);

	const allowed = [];
	const unexpected = [];

	for (const diff of diffs) {
		let matchedEntryIndex = -1;
		for (let i = 0; i < allowlist.length; i++) {
			if (allowlistEntryMatches(allowlist[i], diff)) {
				matchedEntryIndex = i;
				break;
			}
		}
		if (matchedEntryIndex >= 0) {
			allowlistUsed[matchedEntryIndex] = true;
			allowed.push({ diff, entry: allowlist[matchedEntryIndex] });
		} else {
			unexpected.push(diff);
		}
	}

	process.stdout.write(`baseline: ${relToCwd(baselinePath)}\n`);
	process.stdout.write(`target:   ${relToCwd(targetPath)}\n\n`);

	if (allowed.length > 0) {
		process.stdout.write(`Allowed differences (${allowed.length}):\n`);
		for (const { diff, entry } of allowed) {
			process.stdout.write(`${formatDiffLine(diff)}\n    reason: ${entry.reason || '(no reason given)'}\n`);
		}
		process.stdout.write('\n');
	}

	const unusedEntries = allowlist.filter((_, i) => !allowlistUsed[i]);
	if (unusedEntries.length > 0) {
		process.stdout.write(`Warning: ${unusedEntries.length} unused allowlist entr${unusedEntries.length === 1 ? 'y' : 'ies'} (stale, consider removing):\n`);
		for (const entry of unusedEntries) {
			process.stdout.write(`  pattern: ${entry.pattern}${entry.op ? ` op: ${entry.op}` : ''}${entry.reason ? ` reason: ${entry.reason}` : ''}\n`);
		}
		process.stdout.write('\n');
	}

	if (unexpected.length === 0) {
		process.stdout.write('no unexpected differences\n');
		return 0;
	}

	process.stdout.write(`Unexpected differences (${unexpected.length}):\n`);
	for (const diff of unexpected) {
		process.stdout.write(`${formatDiffLine(diff)}\n`);
	}
	return 1;
}

function main() {
	const argv = process.argv.slice(2);

	if (argv.length === 0) {
		printHelp(process.stderr);
		return 1;
	}

	let args;
	try {
		args = parseArgs(argv);
	} catch (e) {
		if (e instanceof UsageError) {
			process.stderr.write(`${e.message}\n\n`);
			printHelp(process.stderr);
			return 1;
		}
		throw e;
	}

	if (args.help) {
		printHelp(process.stdout);
		return 0;
	}

	if (args.snapshot && args.baseline !== undefined) {
		process.stderr.write('Cannot combine --snapshot with --baseline. Choose one mode.\n\n');
		printHelp(process.stderr);
		return 1;
	}

	try {
		if (args.snapshot) {
			return runSnapshot(args);
		}
		if (args.baseline !== undefined) {
			return runDiff(args);
		}
		process.stderr.write('No mode selected: pass --snapshot or --baseline.\n\n');
		printHelp(process.stderr);
		return 1;
	} catch (e) {
		process.stderr.write(`Error: ${e.message}\n`);
		return 1;
	}
}

process.exit(main());
