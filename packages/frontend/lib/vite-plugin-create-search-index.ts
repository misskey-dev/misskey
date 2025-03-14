/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse as vueSfcParse } from 'vue/compiler-sfc';
import type { LogOptions, Plugin } from 'vite';
import fs from 'node:fs';
import { glob } from 'glob';
import JSON5 from 'json5';
import MagicString from 'magic-string';
import path from 'node:path'
import { hash, toBase62 } from '../vite.config';
import { createLogger } from 'vite';

interface VueAstNode {
	type: number;
	tag?: string;
	loc?: {
		start: { offset: number, line: number, column: number },
		end: { offset: number, line: number, column: number },
		source?: string
	};
	props?: Array<{
		name: string;
		type: number;
		value?: { content?: string };
		arg?: { content?: string };
		exp?: { content?: string; loc?: any };
	}>;
	children?: VueAstNode[];
	content?: any;
	__markerId?: string;
	__children?: string[];
}

export type AnalysisResult = {
	filePath: string;
	usage: SearchIndexItem[];
}

export type SearchIndexItem = {
	id: string;
	path?: string;
	label: string;
	keywords: string | string[];
	icon?: string;
	inlining?: string[];
	children?: SearchIndexItem[];
};

export type Options = {
	targetFilePaths: string[],
	exportFilePath: string,
	verbose?: boolean,
};

// 関連するノードタイプの定数化
const NODE_TYPES = {
	ELEMENT: 1,
	EXPRESSION: 2,
	TEXT: 3,
	INTERPOLATION: 5, // Mustache
};

// マーカー関係を表す型
interface MarkerRelation {
	parentId?: string;
	markerId: string;
	node: VueAstNode;
}

// ロガー
let logger = {
	info: (msg: string, options?: LogOptions) => { },
	warn: (msg: string, options?: LogOptions) => { },
	error: (msg: string, options?: LogOptions) => { },
};
let loggerInitialized = false;

function initLogger(options: Options) {
	if (loggerInitialized) return;
	loggerInitialized = true;
	const viteLogger = createLogger(options.verbose ? 'info' : 'warn');

	logger.info = (msg, options) => {
		msg = `[create-search-index] ${msg}`;
		viteLogger.info(msg, options);
	}

	logger.warn = (msg, options) => {
		msg = `[create-search-index] ${msg}`;
		viteLogger.warn(msg, options);
	}

	logger.error = (msg, options) => {
		msg = `[create-search-index] ${msg}`;
		viteLogger.error(msg, options);
	}
}

/**
 * 解析結果をTypeScriptファイルとして出力する
 */
function outputAnalysisResultAsTS(outputPath: string, analysisResults: AnalysisResult[]): void {
	logger.info(`Processing ${analysisResults.length} files for output`);

	// 新しいツリー構造を構築
	const allMarkers = new Map<string, SearchIndexItem>();

	// 1. すべてのマーカーを一旦フラットに収集
	for (const file of analysisResults) {
		logger.info(`Processing file: ${file.filePath} with ${file.usage.length} markers`);

		for (const marker of file.usage) {
			if (marker.id) {
				// キーワードとchildren処理を共通化
				const processedMarker = {
					...marker,
					keywords: processMarkerProperty(marker.keywords, 'keywords'),
					children: processMarkerProperty(marker.children || [], 'children')
				};

				allMarkers.set(marker.id, processedMarker);
			}
		}
	}

	logger.info(`Collected total ${allMarkers.size} unique markers`);

	// 2. 子マーカーIDの収集
	const childIds = collectChildIds(allMarkers);
	logger.info(`Found ${childIds.size} child markers`);

	// 3. ルートマーカーの特定（他の誰かの子でないマーカー）
	const rootMarkers = identifyRootMarkers(allMarkers, childIds);
	logger.info(`Found ${rootMarkers.length} root markers`);

	// 4. 子マーカーの参照を解決
	const resolvedRootMarkers = resolveChildReferences(rootMarkers, allMarkers);

	// 5. デバッグ情報を生成
	const { totalMarkers, totalChildren } = countMarkers(resolvedRootMarkers);
	logger.info(`Total markers in tree: ${totalMarkers} (${resolvedRootMarkers.length} roots + ${totalChildren} nested children)`);

	// 6. 結果をTS形式で出力
	writeOutputFile(outputPath, resolvedRootMarkers);
}

/**
 * マーカーのプロパティ（keywordsやchildren）を処理する
 */
function processMarkerProperty(propValue: any, propType: 'keywords' | 'children'): any {
	// 文字列の配列表現を解析
	if (typeof propValue === 'string' && propValue.startsWith('[') && propValue.endsWith(']')) {
		try {
			// JSON5解析を試みる
			return JSON5.parse(propValue.replace(/'/g, '"'));
		} catch (e) {
			// 解析に失敗した場合
			logger.warn(`Could not parse ${propType}: ${propValue}, using ${propType === 'children' ? 'empty array' : 'as is'}`);
			return propType === 'children' ? [] : propValue;
		}
	}

	return propValue;
}

/**
 * 全マーカーから子IDを収集する
 */
function collectChildIds(allMarkers: Map<string, SearchIndexItem>): Set<string> {
	const childIds = new Set<string>();

	allMarkers.forEach((marker, id) => {
		// 通常のchildren処理
		const children = marker.children;
		if (Array.isArray(children)) {
			children.forEach(childId => {
				if (typeof childId === 'string') {
					if (!allMarkers.has(childId)) {
						logger.warn(`Warning: Child marker ID ${childId} referenced but not found`);
					} else {
						childIds.add(childId);
					}
				}
			});
		}

		// inlining処理を追加
		if (marker.inlining) {
			let inliningIds: string[] = [];

			// 文字列の場合は配列に変換
			if (typeof marker.inlining === 'string') {
				try {
					const inliningStr = (marker.inlining as string).trim();
					if (inliningStr.startsWith('[') && inliningStr.endsWith(']')) {
						inliningIds = JSON5.parse(inliningStr.replace(/'/g, '"'));
						logger.info(`Parsed inlining string to array: ${inliningStr} -> ${JSON.stringify(inliningIds)}`);
					} else {
						inliningIds = [inliningStr];
					}
				} catch (e) {
					logger.error(`Failed to parse inlining string: ${marker.inlining}`, e);
				}
			}
			// 既に配列の場合
			else if (Array.isArray(marker.inlining)) {
				inliningIds = marker.inlining;
			}

			// inliningで指定されたIDを子セットに追加
			for (const inlineId of inliningIds) {
				if (typeof inlineId === 'string') {
					if (!allMarkers.has(inlineId)) {
						logger.warn(`Warning: Inlining marker ID ${inlineId} referenced but not found`);
					} else {
						// inliningで参照されているマーカーも子として扱う
						childIds.add(inlineId);
						logger.info(`Added inlined marker ${inlineId} as child in collectChildIds`);
					}
				}
			}
		}
	});

	return childIds;
}

/**
 * ルートマーカー（他の子でないマーカー）を特定する
 */
function identifyRootMarkers(
	allMarkers: Map<string, SearchIndexItem>,
	childIds: Set<string>
): SearchIndexItem[] {
	const rootMarkers: SearchIndexItem[] = [];

	allMarkers.forEach((marker, id) => {
		if (!childIds.has(id)) {
			rootMarkers.push(marker);
			logger.info(`Added root marker to output: ${id} with label ${marker.label}`);
		}
	});

	return rootMarkers;
}

/**
 * 子マーカーの参照をIDから実際のオブジェクトに解決する
 */
function resolveChildReferences(
	rootMarkers: SearchIndexItem[],
	allMarkers: Map<string, SearchIndexItem>
): SearchIndexItem[] {
	function resolveChildrenForMarker(marker: SearchIndexItem): SearchIndexItem {
		// マーカーのディープコピーを作成
		const resolvedMarker = { ...marker };
		// 明示的に子マーカー配列を作成
		const resolvedChildren: SearchIndexItem[] = [];

		// 通常のchildren処理
		if (Array.isArray(marker.children)) {
			for (const childId of marker.children) {
				if (typeof childId === 'string') {
					const childMarker = allMarkers.get(childId);
					if (childMarker) {
						// 子マーカーの子も再帰的に解決
						const resolvedChild = resolveChildrenForMarker(childMarker);
						resolvedChildren.push(resolvedChild);
						logger.info(`Resolved regular child ${childId} for parent ${marker.id}`);
					}
				}
			}
		}

		// inlining属性の処理
		let inliningIds: string[] = [];

		// 文字列の場合は配列に変換。例: "['2fa']" -> ['2fa']
		if (typeof marker.inlining === 'string') {
			try {
				// 文字列形式の配列を実際の配列に変換
				const inliningStr = (marker.inlining as string).trim();
				if (inliningStr.startsWith('[') && inliningStr.endsWith(']')) {
					inliningIds = JSON5.parse(inliningStr.replace(/'/g, '"'));
					logger.info(`Converted string inlining to array: ${inliningStr} -> ${JSON.stringify(inliningIds)}`);
				} else {
					// 単一値の場合は配列に
					inliningIds = [inliningStr];
					logger.info(`Converted single string inlining to array: ${inliningStr}`);
				}
			} catch (e) {
				logger.error(`Failed to parse inlining string: ${marker.inlining}`, e);
			}
		}
		// 既に配列の場合はそのまま使用
		else if (Array.isArray(marker.inlining)) {
			inliningIds = marker.inlining;
		}

		// インライン指定されたマーカーを子として追加
		for (const inlineId of inliningIds) {
			if (typeof inlineId === 'string') {
				const inlineMarker = allMarkers.get(inlineId);
				if (inlineMarker) {
					// インライン指定されたマーカーを再帰的に解決
					const resolvedInline = resolveChildrenForMarker(inlineMarker);
					delete resolvedInline.path
					resolvedChildren.push(resolvedInline);
					logger.info(`Added inlined marker ${inlineId} as child to ${marker.id}`);
				} else {
					logger.warn(`Inlining target not found: ${inlineId} referenced by ${marker.id}`);
				}
			}
		}

		// 解決した子が存在する場合のみchildrenプロパティを設定
		if (resolvedChildren.length > 0) {
			resolvedMarker.children = resolvedChildren;
		} else {
			delete resolvedMarker.children;
		}

		return resolvedMarker;
	}

	// すべてのルートマーカーの子を解決
	return rootMarkers.map(marker => resolveChildrenForMarker(marker));
}

/**
 * マーカー数を数える（デバッグ用）
 */
function countMarkers(markers: SearchIndexItem[]): { totalMarkers: number, totalChildren: number } {
	let totalMarkers = markers.length;
	let totalChildren = 0;

	function countNested(items: SearchIndexItem[]): void {
		for (const marker of items) {
			if (marker.children && Array.isArray(marker.children)) {
				totalChildren += marker.children.length;
				totalMarkers += marker.children.length;
				countNested(marker.children as SearchIndexItem[]);
			}
		}
	}

	countNested(markers);
	return { totalMarkers, totalChildren };
}

/**
 * 最終的なTypeScriptファイルを出力
 */
function writeOutputFile(outputPath: string, resolvedRootMarkers: SearchIndexItem[]): void {
	try {
		const tsOutput = generateTypeScriptCode(resolvedRootMarkers);
		fs.writeFileSync(outputPath, tsOutput, 'utf-8');
		// 強制的に出力させるためにViteロガーを使わない
		console.log(`Successfully wrote search index to ${outputPath} with ${resolvedRootMarkers.length} root entries`);
	} catch (error) {
		logger.error('[create-search-index]: error writing output: ', error);
	}
}

/**
 * TypeScriptコード生成
 */
function generateTypeScriptCode(resolvedRootMarkers: SearchIndexItem[]): string {
	return `
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// This file was automatically generated by create-search-index.
// Do not edit this file.

import { i18n } from '@/i18n.js';

export type SearchIndexItem = {
	id: string;
	path?: string;
	label: string;
	keywords: string[];
	icon?: string;
	children?: SearchIndexItem[];
};

export const searchIndexes: SearchIndexItem[] = ${customStringify(resolvedRootMarkers)} as const;

export type SearchIndex = typeof searchIndexes;
`;
}

/**
 * オブジェクトを特殊な形式の文字列に変換する
 * i18n参照を保持しつつ適切な形式に変換
 */
function customStringify(obj: any, depth = 0): string {
	const INDENT_STR = '\t';

	// 配列の処理
	if (Array.isArray(obj)) {
		if (obj.length === 0) return '[]';
		const indent = INDENT_STR.repeat(depth);
		const childIndent = INDENT_STR.repeat(depth + 1);

		// 配列要素の処理
		const items = obj.map(item => {
			// オブジェクト要素
			if (typeof item === 'object' && item !== null) {
				return `${childIndent}${customStringify(item, depth + 1)}`;
			}

			// i18n参照を含む文字列要素
			if (typeof item === 'string' && item.includes('i18n.ts.')) {
				return `${childIndent}${item}`; // クォートなしでそのまま出力
			}

			// その他の要素
			return `${childIndent}${JSON5.stringify(item)}`;
		}).join(',\n');

		return `[\n${items},\n${indent}]`;
	}

	// null または非オブジェクト
	if (obj === null || typeof obj !== 'object') {
		return JSON5.stringify(obj);
	}

	// オブジェクトの処理
	const indent = INDENT_STR.repeat(depth);
	const childIndent = INDENT_STR.repeat(depth + 1);

	const entries = Object.entries(obj)
		// 不要なプロパティを除去
		.filter(([key, value]) => {
			if (value === undefined) return false;
			if (key === 'children' && Array.isArray(value) && value.length === 0) return false;
			if (key === 'inlining') return false;
			return true;
		})
		// 各プロパティを変換
		.map(([key, value]) => {
			// 子要素配列の特殊処理
			if (key === 'children' && Array.isArray(value) && value.length > 0) {
				return `${childIndent}${key}: ${customStringify(value, depth + 1)}`;
			}

			// ラベルやその他プロパティを処理
			return `${childIndent}${key}: ${formatSpecialProperty(key, value)}`;
		});

	if (entries.length === 0) return '{}';
	return `{\n${entries.join(',\n')},\n${indent}}`;
}

/**
 * 特殊プロパティの書式設定
 */
function formatSpecialProperty(key: string, value: any): string {
	// 値がundefinedの場合は空文字列を返す
	if (value === undefined) {
		return '""';
	}

	// childrenが配列の場合は特別に処理
	if (key === 'children' && Array.isArray(value)) {
		return customStringify(value);
	}

	// keywordsが配列の場合、特別に処理
	if (key === 'keywords' && Array.isArray(value)) {
		return `[${formatArrayForOutput(value)}]`;
	}

	// 文字列値の場合の特別処理
	if (typeof value === 'string') {
		// i18n.ts 参照を含む場合 - クォートなしでそのまま出力
		if (isI18nReference(value)) {
			logger.info(`Preserving i18n reference in output: ${value}`);
			return value;
		}

		// keywords が配列リテラルの形式の場合
		if (key === 'keywords' && value.startsWith('[') && value.endsWith(']')) {
			return value;
		}
	}

	// 上記以外は通常の JSON5 文字列として返す
	return JSON5.stringify(value);
}

/**
 * 配列式の文字列表現を生成
 */
function formatArrayForOutput(items: any[]): string {
	return items.map(item => {
		// i18n.ts. 参照の文字列はそのままJavaScript式として出力
		if (typeof item === 'string' && isI18nReference(item)) {
			logger.info(`Preserving i18n reference in array: ${item}`);
			return item; // クォートなしでそのまま
		}

		// その他の値はJSON5形式で文字列化
		return JSON5.stringify(item);
	}).join(', ');
}

/**
 * 要素ノードからテキスト内容を抽出する
 * 各抽出方法を分離して可読性を向上
 */
function extractElementText(node: VueAstNode): string | null {
	if (!node) return null;

	logger.info(`Extracting text from node type=${node.type}, tag=${node.tag || 'unknown'}`);

	// 1. 直接コンテンツの抽出を試行
	const directContent = extractDirectContent(node);
	if (directContent) return directContent;

	// 子要素がない場合は終了
	if (!node.children || !Array.isArray(node.children)) {
		return null;
	}

	// 2. インターポレーションノードを検索
	const interpolationContent = extractInterpolationContent(node.children);
	if (interpolationContent) return interpolationContent;

	// 3. 式ノードを検索
	const expressionContent = extractExpressionContent(node.children);
	if (expressionContent) return expressionContent;

	// 4. テキストノードを検索
	const textContent = extractTextContent(node.children);
	if (textContent) return textContent;

	// 5. 再帰的に子ノードを探索
	return extractNestedContent(node.children);
}
/**
 * ノードから直接コンテンツを抽出
 */
function extractDirectContent(node: VueAstNode): string | null {
	if (!node.content) return null;

	const content = typeof node.content === 'string'
		? node.content.trim()
		: (node.content.content ? node.content.content.trim() : null);

	if (!content) return null;

	logger.info(`Direct node content found: ${content}`);

	// Mustache構文のチェック
	const mustachePattern = /^\s*{{\s*(.*?)\s*}}\s*$/;
	const mustacheMatch = content.match(mustachePattern);

	if (mustacheMatch && mustacheMatch[1] && isI18nReference(mustacheMatch[1])) {
		const extractedContent = mustacheMatch[1].trim();
		logger.info(`Extracted i18n reference from mustache: ${extractedContent}`);
		return extractedContent;
	}

	// 直接i18n参照を含む場合
	if (isI18nReference(content)) {
		logger.info(`Direct i18n reference found: ${content}`);
		return content;
	}

	// その他のコンテンツ
	return content;
}

/**
 * インターポレーションノード（Mustache）からコンテンツを抽出
 */
function extractInterpolationContent(children: VueAstNode[]): string | null {
	for (const child of children) {
		if (child.type === NODE_TYPES.INTERPOLATION) {
			logger.info(`Found interpolation node (Mustache): ${JSON.stringify(child.content).substring(0, 100)}...`);

			if (child.content && child.content.type === 4 && child.content.content) {
				const content = child.content.content.trim();
				logger.info(`Interpolation content: ${content}`);

				if (isI18nReference(content)) {
					return content;
				}
			} else if (child.content && typeof child.content === 'object') {
				// オブジェクト形式のcontentを探索
				logger.info(`Complex interpolation node: ${JSON.stringify(child.content).substring(0, 100)}...`);

				if (child.content.content) {
					const content = child.content.content.trim();

					if (isI18nReference(content)) {
						logger.info(`Found i18n reference in complex interpolation: ${content}`);
						return content;
					}
				}
			}
		}
	}

	return null;
}

/**
 * 式ノードからコンテンツを抽出
 */
function extractExpressionContent(children: VueAstNode[]): string | null {
	// i18n.ts. 参照パターンを持つものを優先
	for (const child of children) {
		if (child.type === NODE_TYPES.EXPRESSION && child.content) {
			const expr = child.content.trim();

			if (isI18nReference(expr)) {
				logger.info(`Found i18n reference in expression node: ${expr}`);
				return expr;
			}
		}
	}

	// その他の式
	for (const child of children) {
		if (child.type === NODE_TYPES.EXPRESSION && child.content) {
			const expr = child.content.trim();
			logger.info(`Found expression: ${expr}`);
			return expr;
		}
	}

	return null;
}

/**
 * テキストノードからコンテンツを抽出
 */
function extractTextContent(children: VueAstNode[]): string | null {
	for (const child of children) {
		if (child.type === NODE_TYPES.TEXT && child.content) {
			const text = child.content.trim();

			if (text) {
				logger.info(`Found text node: ${text}`);

				// Mustache構文のチェック
				const mustachePattern = /^\s*{{\s*(.*?)\s*}}\s*$/;
				const mustacheMatch = text.match(mustachePattern);

				if (mustacheMatch && mustacheMatch[1] && isI18nReference(mustacheMatch[1])) {
					logger.info(`Extracted i18n ref from text mustache: ${mustacheMatch[1]}`);
					return mustacheMatch[1].trim();
				}

				return text;
			}
		}
	}

	return null;
}

/**
 * 子ノードを再帰的に探索してコンテンツを抽出
 */
function extractNestedContent(children: VueAstNode[]): string | null {
	for (const child of children) {
		if (child.children && Array.isArray(child.children) && child.children.length > 0) {
			const nestedContent = extractElementText(child);

			if (nestedContent) {
				logger.info(`Found nested content: ${nestedContent}`);
				return nestedContent;
			}
		} else if (child.type === NODE_TYPES.ELEMENT) {
			// childrenがなくても内部を調査
			const nestedContent = extractElementText(child);

			if (nestedContent) {
				logger.info(`Found content in childless element: ${nestedContent}`);
				return nestedContent;
			}
		}
	}

	return null;
}


/**
 * SearchLabelとSearchKeywordを探して抽出する関数
 */
function extractLabelsAndKeywords(nodes: VueAstNode[]): { label: string | null, keywords: any[] } {
	let label: string | null = null;
	const keywords: any[] = [];

	logger.info(`Extracting labels and keywords from ${nodes.length} nodes`);

	// 再帰的にSearchLabelとSearchKeywordを探索（ネストされたSearchMarkerは処理しない）
	function findComponents(nodes: VueAstNode[]) {
		for (const node of nodes) {
			if (node.type === NODE_TYPES.ELEMENT) {
				logger.info(`Checking element: ${node.tag}`);

				// SearchMarkerの場合は、その子要素は別スコープなのでスキップ
				if (node.tag === 'SearchMarker') {
					logger.info(`Found nested SearchMarker - skipping its content to maintain scope isolation`);
					continue; // このSearchMarkerの中身は処理しない (スコープ分離)
				}

				// SearchLabelの処理
				if (node.tag === 'SearchLabel') {
					logger.info(`Found SearchLabel node, structure: ${JSON.stringify(node).substring(0, 200)}...`);

					// まず完全なノード内容の抽出を試みる
					const content = extractElementText(node);
					if (content) {
						label = content;
						logger.info(`SearchLabel content extracted: ${content}`);
					} else {
						logger.info(`SearchLabel found but extraction failed, trying direct children inspection`);

						// バックアップ: 子直接確認 - type=5のMustacheインターポレーションを重点的に確認
						if (node.children && Array.isArray(node.children)) {
							for (const child of node.children) {
								// Mustacheインターポレーション
								if (child.type === NODE_TYPES.INTERPOLATION && child.content) {
									// content内の式を取り出す
									const expression = child.content.content ||
										(child.content.type === 4 ? child.content.content : null) ||
										JSON.stringify(child.content);

									logger.info(`Interpolation expression: ${expression}`);
									if (typeof expression === 'string' && isI18nReference(expression)) {
										label = expression.trim();
										logger.info(`Found i18n in interpolation: ${label}`);
										break;
									}
								}
								// 式ノード
								else if (child.type === NODE_TYPES.EXPRESSION && child.content && isI18nReference(child.content)) {
									label = child.content.trim();
									logger.info(`Found i18n in expression: ${label}`);
									break;
								}
								// テキストノードでもMustache構文を探す
								else if (child.type === NODE_TYPES.TEXT && child.content) {
									const mustacheMatch = child.content.trim().match(/^\s*{{\s*(.*?)\s*}}\s*$/);
									if (mustacheMatch && mustacheMatch[1] && isI18nReference(mustacheMatch[1])) {
										label = mustacheMatch[1].trim();
										logger.info(`Found i18n in text mustache: ${label}`);
										break;
									}
								}
							}
						}
					}
				}
				// SearchKeywordの処理
				else if (node.tag === 'SearchKeyword') {
					logger.info(`Found SearchKeyword node`);

					// まず完全なノード内容の抽出を試みる
					const content = extractElementText(node);
					if (content) {
						keywords.push(content);
						logger.info(`SearchKeyword content extracted: ${content}`);
					} else {
						logger.info(`SearchKeyword found but extraction failed, trying direct children inspection`);

						// バックアップ: 子直接確認 - type=5のMustacheインターポレーションを重点的に確認
						if (node.children && Array.isArray(node.children)) {
							for (const child of node.children) {
								// Mustacheインターポレーション
								if (child.type === NODE_TYPES.INTERPOLATION && child.content) {
									// content内の式を取り出す
									const expression = child.content.content ||
										(child.content.type === 4 ? child.content.content : null) ||
										JSON.stringify(child.content);

									logger.info(`Keyword interpolation: ${expression}`);
									if (typeof expression === 'string' && isI18nReference(expression)) {
										const keyword = expression.trim();
										keywords.push(keyword);
										logger.info(`Found i18n keyword in interpolation: ${keyword}`);
										break;
									}
								}
								// 式ノード
								else if (child.type === NODE_TYPES.EXPRESSION && child.content && isI18nReference(child.content)) {
									const keyword = child.content.trim();
									keywords.push(keyword);
									logger.info(`Found i18n keyword in expression: ${keyword}`);
									break;
								}
								// テキストノードでもMustache構文を探す
								else if (child.type === NODE_TYPES.TEXT && child.content) {
									const mustacheMatch = child.content.trim().match(/^\s*{{\s*(.*?)\s*}}\s*$/);
									if (mustacheMatch && mustacheMatch[1] && isI18nReference(mustacheMatch[1])) {
										const keyword = mustacheMatch[1].trim();
										keywords.push(keyword);
										logger.info(`Found i18n keyword in text mustache: ${keyword}`);
										break;
									}
								}
							}
						}
					}
				}

				// 子要素を再帰的に調査（ただしSearchMarkerは除外）
				if (node.children && Array.isArray(node.children)) {
					findComponents(node.children);
				}
			}
		}
	}

	findComponents(nodes);

	// デバッグ情報
	logger.info(`Extraction completed: label=${label}, keywords=[${keywords.join(', ')}]`);
	return { label, keywords };
}


function extractUsageInfoFromTemplateAst(
	templateAst: any,
	id: string,
): SearchIndexItem[] {
	const allMarkers: SearchIndexItem[] = [];
	const markerMap = new Map<string, SearchIndexItem>();
	const childrenIds = new Set<string>();
	const normalizedId = id.replace(/\\/g, '/');

	if (!templateAst) return allMarkers;

	// マーカーの基本情報を収集
	function collectMarkers(node: VueAstNode, parentId: string | null = null) {
		if (node.type === 1 && node.tag === 'SearchMarker') {
			// マーカーID取得
			const markerIdProp = node.props?.find((p: any) => p.name === 'markerId');
			const markerId = markerIdProp?.value?.content ||
				node.__markerId;

			// SearchMarkerにマーカーIDがない場合はエラー
			if (markerId == null) {
				logger.error(`Marker ID not found for node: ${JSON.stringify(node)}`);
				throw new Error(`Marker ID not found in file ${id}`);
			}

			// マーカー基本情報
			const markerInfo: SearchIndexItem = {
				id: markerId,
				children: [],
				label: '', // デフォルト値
				keywords: [],
			};

			// 静的プロパティを取得
			if (node.props && Array.isArray(node.props)) {
				for (const prop of node.props) {
					if (prop.type === 6 && prop.name && prop.name !== 'markerId') {
						if (prop.name === 'path') markerInfo.path = prop.value?.content || '';
						else if (prop.name === 'icon') markerInfo.icon = prop.value?.content || '';
						else if (prop.name === 'label') markerInfo.label = prop.value?.content || '';
					}
				}
			}

			// バインドプロパティを取得
			const bindings = extractNodeBindings(node);
			if (bindings.path) markerInfo.path = bindings.path;
			if (bindings.icon) markerInfo.icon = bindings.icon;
			if (bindings.label) markerInfo.label = bindings.label;
			if (bindings.children) markerInfo.children = bindings.children;
			if (bindings.inlining) {
				markerInfo.inlining = bindings.inlining;
				logger.info(`Added inlining ${JSON.stringify(bindings.inlining)} to marker ${markerId}`);
			}
			if (bindings.keywords) {
				if (Array.isArray(bindings.keywords)) {
					markerInfo.keywords = bindings.keywords;
				} else {
					markerInfo.keywords = bindings.keywords || [];
				}
			}

			//pathがない場合はファイルパスを設定
			if (markerInfo.path == null && parentId == null) {
				markerInfo.path = normalizedId.match(/.*(\/(admin|settings)\/[^\/]+)\.vue$/)?.[1];
			}

			// SearchLabelとSearchKeywordを抽出 (AST全体を探索)
			if (node.children && Array.isArray(node.children)) {
				logger.info(`Processing marker ${markerId} for labels and keywords`);
				const extracted = extractLabelsAndKeywords(node.children);

				// SearchLabelからのラベル取得は最優先で適用
				if (extracted.label) {
					markerInfo.label = extracted.label;
					logger.info(`Using extracted label for ${markerId}: ${extracted.label}`);
				} else if (markerInfo.label) {
					logger.info(`Using existing label for ${markerId}: ${markerInfo.label}`);
				} else {
					markerInfo.label = 'Unnamed marker';
					logger.info(`No label found for ${markerId}, using default`);
				}

				// SearchKeywordからのキーワード取得を追加
				if (extracted.keywords.length > 0) {
					const existingKeywords = Array.isArray(markerInfo.keywords) ?
						[...markerInfo.keywords] :
						(markerInfo.keywords ? [markerInfo.keywords] : []);

					// i18n参照のキーワードは最優先で追加
					const combinedKeywords = [...existingKeywords];
					for (const kw of extracted.keywords) {
						combinedKeywords.push(kw);
						logger.info(`Added extracted keyword to ${markerId}: ${kw}`);
					}

					markerInfo.keywords = combinedKeywords;
				}
			}

			// マーカーを登録
			markerMap.set(markerId, markerInfo);
			allMarkers.push(markerInfo);

			// 親子関係を記録
			if (parentId) {
				const parent = markerMap.get(parentId);
				if (parent) {
					childrenIds.add(markerId);
				}
			}

			// 子ノードを処理
			if (node.children && Array.isArray(node.children)) {
				node.children.forEach((child: VueAstNode) => {
					collectMarkers(child, markerId);
				});
			}

			return markerId;
		}
		// SearchMarkerでない場合は再帰的に子ノードを処理
		else if (node.children && Array.isArray(node.children)) {
			node.children.forEach((child: VueAstNode) => {
				collectMarkers(child, parentId);
			});
		}

		return null;
	}

	// AST解析開始
	collectMarkers(templateAst);
	return allMarkers;
}

// バインドプロパティの処理を修正する関数
function extractNodeBindings(node: VueAstNode): Record<keyof SearchIndexItem, any> {
	const bindings: Record<string, any> = {};

	if (!node.props || !Array.isArray(node.props)) return bindings;

	// バインド式を収集
	for (const prop of node.props) {
		if (prop.type === 7 && prop.name === 'bind' && prop.arg?.content) {
			const propName = prop.arg.content;
			const propContent = prop.exp?.content || '';

			logger.info(`Processing bind prop ${propName}: ${propContent}`);

			// inliningプロパティの処理を追加
			if (propName === 'inlining') {
				try {
					const content = propContent.trim();

					// 配列式の場合
					if (content.startsWith('[') && content.endsWith(']')) {
						// 配列要素を解析
						const elements = parseArrayExpression(content);
						if (elements.length > 0) {
							bindings.inlining = elements;
							logger.info(`Parsed inlining array: ${JSON5.stringify(elements)}`);
						} else {
							bindings.inlining = [];
						}
					}
					// 文字列の場合は配列に変換
					else if (content) {
						bindings.inlining = [content]; // 単一の値を配列に
						logger.info(`Converting inlining to array: [${content}]`);
					}
				} catch (e) {
					logger.error(`Failed to parse inlining binding: ${propContent}`, e);
				}
			}
			// keywordsの特殊処理
			if (propName === 'keywords') {
				try {
					const content = propContent.trim();

					// 配列式の場合
					if (content.startsWith('[') && content.endsWith(']')) {
						// i18n参照や特殊な式を保持するため、各要素を個別に解析
						const elements = parseArrayExpression(content);
						if (elements.length > 0) {
							bindings.keywords = elements;
							logger.info(`Parsed keywords array: ${JSON5.stringify(elements)}`);
						} else {
							bindings.keywords = [];
							logger.info('Empty keywords array');
						}
					}
					// その他の式（非配列）
					else if (content) {
						bindings.keywords = content; // 式をそのまま保持
						logger.info(`Keeping keywords as expression: ${content}`);
					} else {
						bindings.keywords = [];
						logger.info('No keywords provided');
					}
				} catch (e) {
					logger.error(`Failed to parse keywords binding: ${propContent}`, e);
					// エラーが起きても何らかの値を設定
					bindings.keywords = propContent || [];
				}
			}
			// その他のプロパティ
			else if (propName === 'label') {
				// ラベルの場合も式として保持
				bindings[propName] = propContent;
				logger.info(`Set label from bind expression: ${propContent}`);
			}
			else {
				bindings[propName] = propContent;
			}
		}
	}

	return bindings;
}

// 配列式をパースする補助関数（文字列リテラル処理を改善）
function parseArrayExpression(expr: string): any[] {
	try {
		// 単純なケースはJSON5でパースを試みる
		return JSON5.parse(expr.replace(/'/g, '"'));
	} catch (e) {
		// 複雑なケース（i18n.ts.xxx などの式を含む場合）は手動パース
		logger.info(`Complex array expression, trying manual parsing: ${expr}`);

		// "["と"]"を取り除く
		const content = expr.substring(1, expr.length - 1).trim();
		if (!content) return [];

		const result: any[] = [];
		let currentItem = '';
		let depth = 0;
		let inString = false;
		let stringChar = '';

		// カンマで区切る（ただし文字列内や入れ子の配列内のカンマは無視）
		for (let i = 0; i < content.length; i++) {
			const char = content[i];

			if (inString) {
				if (char === stringChar && content[i - 1] !== '\\') {
					inString = false;
				}
				currentItem += char;
			} else if (char === '"' || char === "'") {
				inString = true;
				stringChar = char;
				currentItem += char;
			} else if (char === '[') {
				depth++;
				currentItem += char;
			} else if (char === ']') {
				depth--;
				currentItem += char;
			} else if (char === ',' && depth === 0) {
				// 項目の区切りを検出
				const trimmed = currentItem.trim();

				// 純粋な文字列リテラルの場合、実際の値に変換
				if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
					(trimmed.startsWith('"') && trimmed.endsWith('"'))) {
					try {
						result.push(JSON5.parse(trimmed));
					} catch (err) {
						result.push(trimmed);
					}
				} else {
					// それ以外の式はそのまま（i18n.ts.xxx など）
					result.push(trimmed);
				}

				currentItem = '';
			} else {
				currentItem += char;
			}
		}

		// 最後の項目を処理
		if (currentItem.trim()) {
			const trimmed = currentItem.trim();

			// 純粋な文字列リテラルの場合、実際の値に変換
			if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
				(trimmed.startsWith('"') && trimmed.endsWith('"'))) {
				try {
					result.push(JSON5.parse(trimmed));
				} catch (err) {
					result.push(trimmed);
				}
			} else {
				// それ以外の式はそのまま（i18n.ts.xxx など）
				result.push(trimmed);
			}
		}

		logger.info(`Parsed complex array expression: ${expr} -> ${JSON.stringify(result)}`);
		return result;
	}
}

export async function analyzeVueProps(options: Options & {
	transformedCodeCache: Record<string, string>,
}): Promise<void> {
	initLogger(options);

	const allMarkers: SearchIndexItem[] = [];

	//  対象ファイルパスを glob で展開
	const filePaths = options.targetFilePaths.reduce<string[]>((acc, filePathPattern) => {
		const matchedFiles = glob.sync(filePathPattern);
		return [...acc, ...matchedFiles];
	}, []);

	logger.info(`Found ${filePaths.length} matching files to analyze`);

	for (const filePath of filePaths) {
		const absolutePath = path.join(process.cwd(), filePath);
		const id = absolutePath.replace(/\\/g, '/'); // 絶対パスに変換
		const code = options.transformedCodeCache[id]; // options 経由でキャッシュ参照
		if (!code) { // キャッシュミスの場合
			logger.error(`Error: No cached code found for: ${id}.`); // エラーログ
			throw new Error(`No cached code found for: ${id}.`); // エラーを投げる
		}

		try {
			const { descriptor, errors } = vueSfcParse(options.transformedCodeCache[id], {
				filename: filePath,
			});

			if (errors.length > 0) {
				logger.error(`Compile Error: ${filePath}, ${errors}`);
				continue; // エラーが発生したファイルはスキップ
			}

			const fileMarkers = extractUsageInfoFromTemplateAst(descriptor.template?.ast, id);

			if (fileMarkers && fileMarkers.length > 0) {
				allMarkers.push(...fileMarkers); // すべてのマーカーを収集
				logger.info(`Successfully extracted ${fileMarkers.length} markers from ${filePath}`);
			} else {
				logger.info(`No markers found in ${filePath}`);
			}
		} catch (error) {
			logger.error(`Error analyzing file ${filePath}:`, error);
		}
	}

	// 収集したすべてのマーカー情報を使用
	const analysisResult: AnalysisResult[] = [
		{
			filePath: "combined-markers", // すべてのファイルのマーカーを1つのエントリとして扱う
			usage: allMarkers,
		}
	];

	outputAnalysisResultAsTS(options.exportFilePath, analysisResult); // すべてのマーカー情報を渡す
}

interface MarkerRelation {
	parentId?: string;
	markerId: string;
	node: VueAstNode;
}

async function processVueFile(
	code: string,
	id: string,
	options: Options,
	transformedCodeCache: Record<string, string>
): Promise<{
	code: string,
	map: any,
	transformedCodeCache: Record<string, string>
}> {
	const normalizedId = id.replace(/\\/g, '/'); // ファイルパスを正規化

	// 開発モード時はコード内容に変更があれば常に再処理する
	// コード内容が同じ場合のみキャッシュを使用
	const isDevMode = process.env.NODE_ENV === 'development';

	const s = new MagicString(code); // magic-string のインスタンスを作成

	if (!isDevMode && transformedCodeCache[normalizedId] && transformedCodeCache[normalizedId].includes('markerId=')) {
		logger.info(`Using cached version for ${id}`);
		return {
			code: transformedCodeCache[normalizedId],
			map: s.generateMap({ source: id, includeContent: true }),
			transformedCodeCache
		};
	}

	// すでに処理済みのファイルでコードに変更がない場合はキャッシュを返す
	if (transformedCodeCache[normalizedId] === code) {
		logger.info(`Code unchanged for ${id}, using cached version`);
		return {
			code: transformedCodeCache[normalizedId],
			map: s.generateMap({ source: id, includeContent: true }),
			transformedCodeCache
		};
	}

	const parsed = vueSfcParse(code, { filename: id });
	if (!parsed.descriptor.template) {
		return {
			code,
			map: s.generateMap({ source: id, includeContent: true }),
			transformedCodeCache
		};
	}
	const ast = parsed.descriptor.template.ast; // テンプレート AST を取得
	const markerRelations: MarkerRelation[] = []; //  MarkerRelation 配列を初期化

	if (ast) {
		function traverse(node: any, currentParent?: any) {
			if (node.type === 1 && node.tag === 'SearchMarker') {
				// 行番号はコード先頭からの改行数で取得
				const lineNumber = code.slice(0, node.loc.start.offset).split('\n').length;
				// ファイルパスと行番号からハッシュ値を生成
				// この際実行環境で差が出ないようにファイルパスを正規化
				const idKey = id.replace(/\\/g, '/').split('packages/frontend/')[1]
				const generatedMarkerId = toBase62(hash(`${idKey}:${lineNumber}`));

				const props = node.props || [];
				const hasMarkerIdProp = props.some((prop: any) => prop.type === 6 && prop.name === 'markerId');
				const nodeMarkerId = hasMarkerIdProp
					? props.find((prop: any) => prop.type === 6 && prop.name === 'markerId')?.value?.content as string
					: generatedMarkerId;
				node.__markerId = nodeMarkerId;

				// 子マーカーの場合、親ノードに __children を設定しておく
				if (currentParent && currentParent.type === 1 && currentParent.tag === 'SearchMarker') {
					currentParent.__children = currentParent.__children || [];
					currentParent.__children.push(nodeMarkerId);
				}

				const parentMarkerId = currentParent && currentParent.__markerId;
				markerRelations.push({
					parentId: parentMarkerId,
					markerId: nodeMarkerId,
					node: node,
				});

				if (!hasMarkerIdProp) {
					const nodeStart = node.loc.start.offset;
					let endOfStartTag;

					if (node.children && node.children.length > 0) {
						// 子要素がある場合、最初の子要素の開始位置を基準にする
						endOfStartTag = code.lastIndexOf('>', node.children[0].loc.start.offset);
					} else if (node.loc.end.offset > nodeStart) {
						// 子要素がない場合、自身の終了位置から逆算
						const nodeSource = code.substring(nodeStart, node.loc.end.offset);
						// 自己終了タグか通常の終了タグかを判断
						if (nodeSource.includes('/>')) {
							endOfStartTag = code.indexOf('/>', nodeStart) - 1;
						} else {
							endOfStartTag = code.indexOf('>', nodeStart);
						}
					}

					if (endOfStartTag !== undefined && endOfStartTag !== -1) {
						// markerId が既に存在しないことを確認
						const tagText = code.substring(nodeStart, endOfStartTag + 1);
						const markerIdRegex = /\s+markerId\s*=\s*["'][^"']*["']/;

						if (!markerIdRegex.test(tagText)) {
							s.appendRight(endOfStartTag, ` markerId="${generatedMarkerId}" data-in-app-search-marker-id="${generatedMarkerId}"`);
							logger.info(`Adding markerId="${generatedMarkerId}" to ${id}:${lineNumber}`);
						} else {
							logger.info(`markerId already exists in ${id}:${lineNumber}`);
						}
					}
				}
			}

			const newParent = node.type === 1 && node.tag === 'SearchMarker' ? node : currentParent;
			if (node.children && Array.isArray(node.children)) {
				node.children.forEach(child => traverse(child, newParent));
			}
		}

		traverse(ast); // AST を traverse (1段階目: ID 生成と親子関係記録)

		// 2段階目: :children 属性の追加
		// 最初に親マーカーごとに子マーカーIDを集約する処理を追加
		const parentChildrenMap = new Map<string, string[]>();

		// 1. まず親ごとのすべての子マーカーIDを収集
		markerRelations.forEach(relation => {
			if (relation.parentId) {
				if (!parentChildrenMap.has(relation.parentId)) {
					parentChildrenMap.set(relation.parentId, []);
				}
				parentChildrenMap.get(relation.parentId)?.push(relation.markerId);
			}
		});

		// 2. 親ごとにまとめて :children 属性を処理
		for (const [parentId, childIds] of parentChildrenMap.entries()) {
			const parentRelation = markerRelations.find(r => r.markerId === parentId);
			if (!parentRelation || !parentRelation.node) continue;

			const parentNode = parentRelation.node;
			const childrenProp = parentNode.props?.find((prop: any) => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'children');

			// 親ノードの開始位置を特定
			const parentNodeStart = parentNode.loc!.start.offset;
			const endOfParentStartTag = parentNode.children && parentNode.children.length > 0
				? code.lastIndexOf('>', parentNode.children[0].loc!.start.offset)
				: code.indexOf('>', parentNodeStart);

			if (endOfParentStartTag === -1) continue;

			// 親タグのテキストを取得
			const parentTagText = code.substring(parentNodeStart, endOfParentStartTag + 1);

			if (childrenProp) {
				// AST で :children 属性が検出された場合、それを更新
				try {
					const childrenStart = code.indexOf('[', childrenProp.exp!.loc.start.offset);
					const childrenEnd = code.indexOf(']', childrenProp.exp!.loc.start.offset);
					if (childrenStart !== -1 && childrenEnd !== -1) {
						const childrenArrayStr = code.slice(childrenStart, childrenEnd + 1);
						let childrenArray = JSON5.parse(childrenArrayStr.replace(/'/g, '"'));

						// 新しいIDを追加（重複は除外）
						const newIds = childIds.filter(id => !childrenArray.includes(id));
						if (newIds.length > 0) {
							childrenArray = [...childrenArray, ...newIds];
							const updatedChildrenArrayStr = JSON5.stringify(childrenArray).replace(/"/g, "'");
							s.overwrite(childrenStart, childrenEnd + 1, updatedChildrenArrayStr);
							logger.info(`Added ${newIds.length} child markerIds to existing :children in ${id}`);
						}
					}
				} catch (e) {
					logger.error('Error updating :children attribute:', e);
				}
			} else {
				// AST では検出されなかった場合、タグテキストを調べる
				const childrenRegex = /:children\s*=\s*["']\[(.*?)\]["']/;
				const childrenMatch = parentTagText.match(childrenRegex);

				if (childrenMatch) {
					// テキストから :children 属性値を解析して更新
					try {
						const childrenContent = childrenMatch[1];
						const childrenArrayStr = `[${childrenContent}]`;
						const childrenArray = JSON5.parse(childrenArrayStr.replace(/'/g, '"'));

						// 新しいIDを追加（重複は除外）
						const newIds = childIds.filter(id => !childrenArray.includes(id));
						if (newIds.length > 0) {
							childrenArray.push(...newIds);

							// :children="[...]" の位置を特定して上書き
							const attrStart = parentTagText.indexOf(':children=');
							if (attrStart > -1) {
								const attrValueStart = parentTagText.indexOf('[', attrStart);
								const attrValueEnd = parentTagText.indexOf(']', attrValueStart) + 1;
								if (attrValueStart > -1 && attrValueEnd > -1) {
									const absoluteStart = parentNodeStart + attrValueStart;
									const absoluteEnd = parentNodeStart + attrValueEnd;
									const updatedArrayStr = JSON5.stringify(childrenArray).replace(/"/g, "'");
									s.overwrite(absoluteStart, absoluteEnd, updatedArrayStr);
									logger.info(`Updated existing :children in tag text for ${id}`);
								}
							}
						}
					} catch (e) {
						logger.error('Error updating :children in tag text:', e);
					}
				} else {
					// :children 属性がまだない場合、新規作成
					s.appendRight(endOfParentStartTag, ` :children="${JSON5.stringify(childIds).replace(/"/g, "'")}"`);
					logger.info(`Created new :children attribute with ${childIds.length} markerIds in ${id}`);
				}
			}
		}
	}

	const transformedCode = s.toString(); //  変換後のコードを取得
	transformedCodeCache[normalizedId] = transformedCode; //  変換後のコードをキャッシュに保存

	return {
		code: transformedCode, // 変更後のコードを返す
		map: s.generateMap({ source: id, includeContent: true }), // ソースマップも生成 (sourceMap: true が必要)
		transformedCodeCache // キャッシュも返す
	};
}

export async function generateSearchIndex(options: Options, transformedCodeCache: Record<string, string> = {}) {
	const filePaths = options.targetFilePaths.reduce<string[]>((acc, filePathPattern) => {
		const matchedFiles = glob.sync(filePathPattern);
		return [...acc, ...matchedFiles];
	}, []);

	for (const filePath of filePaths) {
		const id = path.resolve(filePath); // 絶対パスに変換
		const code = fs.readFileSync(filePath, 'utf-8'); // ファイル内容を読み込む
		const { transformedCodeCache: newCache } = await processVueFile(code, id, options, transformedCodeCache); // processVueFile 関数を呼び出す
		transformedCodeCache = newCache; // キャッシュを更新
	}

	await analyzeVueProps({ ...options, transformedCodeCache }); // 開発サーバー起動時にも analyzeVueProps を実行

	return transformedCodeCache; // キャッシュを返す
}

// Rollup プラグインとして export
export default function pluginCreateSearchIndex(options: Options): Plugin {
	let transformedCodeCache: Record<string, string> = {}; //  キャッシュオブジェクトをプラグインスコープで定義
	const isDevServer = process.env.NODE_ENV === 'development'; // 開発サーバーかどうか

	initLogger(options); // ロガーを初期化

	return {
		name: 'createSearchIndex',
		enforce: 'pre',

		async buildStart() {
			if (!isDevServer) {
				return;
			}

			transformedCodeCache = await generateSearchIndex(options, transformedCodeCache);
		},

		async transform(code, id) {
			if (!id.endsWith('.vue')) {
				return;
			}

			// targetFilePaths にマッチするファイルのみ処理を行う
			// glob パターンでマッチング
			let isMatch = false; // isMatch の初期値を false に設定
			for (const pattern of options.targetFilePaths) { // パターンごとにマッチング確認
				const globbedFiles = glob.sync(pattern);
				for (const globbedFile of globbedFiles) {
					const normalizedGlobbedFile = path.resolve(globbedFile); // glob 結果を絶対パスに
					const normalizedId = path.resolve(id); // id を絶対パスに
					if (normalizedGlobbedFile === normalizedId) { // 絶対パス同士で比較
						isMatch = true;
						break; // マッチしたらループを抜ける
					}
				}
				if (isMatch) break; // いずれかのパターンでマッチしたら、outer loop も抜ける
			}

			if (!isMatch) {
				return;
			}

			// ファイルの内容が変更された場合は再処理を行う
			const normalizedId = id.replace(/\\/g, '/');
			const hasContentChanged = !transformedCodeCache[normalizedId] || transformedCodeCache[normalizedId] !== code;

			const transformed = await processVueFile(code, id, options, transformedCodeCache);
			transformedCodeCache = transformed.transformedCodeCache; // キャッシュを更新

			if (isDevServer && hasContentChanged) {
				await analyzeVueProps({ ...options, transformedCodeCache }); // ファイルが変更されたときのみ分析を実行
			}

			return transformed;
		},

		async writeBundle() {
			await analyzeVueProps({ ...options, transformedCodeCache }); // ビルド時にも analyzeVueProps を実行
		},
	};
}

// i18n参照を検出するためのヘルパー関数を追加
function isI18nReference(text: string | null | undefined): boolean {
	if (!text) return false;
	// ドット記法（i18n.ts.something）
	const dotPattern = /i18n\.ts\.\w+/;
	// ブラケット記法（i18n.ts['something']）
	const bracketPattern = /i18n\.ts\[['"][^'"]+['"]\]/;
	return dotPattern.test(text) || bracketPattern.test(text);
}
