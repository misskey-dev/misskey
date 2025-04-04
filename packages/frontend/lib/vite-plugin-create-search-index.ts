/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse as vueSfcParse } from 'vue/compiler-sfc';
import {
	createLogger,
	EnvironmentModuleGraph,
	normalizePath,
	type LogErrorOptions,
	type LogOptions,
	type Plugin,
	type PluginOption
} from 'vite';
import fs from 'node:fs';
import { glob } from 'glob';
import JSON5 from 'json5';
import MagicString, { SourceMap } from 'magic-string';
import path from 'node:path'
import { hash, toBase62 } from '../vite.config';
import { minimatch } from 'minimatch';
import type {
	AttributeNode, CompoundExpressionNode, DirectiveNode,
	ElementNode,
	RootNode, SimpleExpressionNode,
	TemplateChildNode,
} from '@vue/compiler-core';
import { NodeTypes } from '@vue/compiler-core';

export type AnalysisResult<T = SearchIndexItem> = {
	filePath: string;
	usage: T[];
}

export type SearchIndexItem = SearchIndexItemLink<SearchIndexItem>;
export type SearchIndexStringItem = SearchIndexItemLink<string>;
export interface SearchIndexItemLink<T> {
	id: string;
	path?: string;
	label: string;
	keywords: string | string[];
	icon?: string;
	inlining?: string[];
	children?: T[];
}

export type Options = {
	targetFilePaths: string[],
	mainVirtualModule: string,
	modulesToHmrOnUpdate: string[],
	fileVirtualModulePrefix?: string,
	fileVirtualModuleSuffix?: string,
	verbose?: boolean,
};

// マーカー関係を表す型
interface MarkerRelation {
	parentId?: string;
	markerId: string;
	node: ElementNode;
}

// ロガー
let logger = {
	info: (msg: string, options?: LogOptions) => { },
	warn: (msg: string, options?: LogOptions) => { },
	error: (msg: string, options?: LogErrorOptions) => { },
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

function collectSearchItemIndexes(analysisResults: AnalysisResult<SearchIndexStringItem>[]): SearchIndexItem[] {
	logger.info(`Processing ${analysisResults.length} files for output`);

	// 新しいツリー構造を構築
	const allMarkers = new Map<string, SearchIndexStringItem>();

	// 1. すべてのマーカーを一旦フラットに収集
	for (const file of analysisResults) {
		logger.info(`Processing file: ${file.filePath} with ${file.usage.length} markers`);

		for (const marker of file.usage) {
			if (marker.id) {
				// キーワードとchildren処理を共通化
				const processedMarker: SearchIndexStringItem = {
					...marker,
					keywords: processMarkerProperty(marker.keywords, 'keywords'),
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

	return resolvedRootMarkers;
}

/**
 * マーカーのプロパティ（keywordsやchildren）を処理する
 */
function processMarkerProperty(propValue: string | string[], propType: 'keywords' | 'children'): string | string[] {
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
function collectChildIds(allMarkers: Map<string, SearchIndexStringItem>): Set<string> {
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
	allMarkers: Map<string, SearchIndexStringItem>,
	childIds: Set<string>
): SearchIndexStringItem[] {
	const rootMarkers: SearchIndexStringItem[] = [];

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
	rootMarkers: SearchIndexStringItem[],
	allMarkers: Map<string, SearchIndexStringItem>
): SearchIndexItem[] {
	function resolveChildrenForMarker(marker: SearchIndexStringItem): SearchIndexItem {
		// マーカーのディープコピーを作成
		const resolvedMarker: SearchIndexItem = { ...marker, children: [] };
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
 * TypeScriptコード生成
 */
function generateJavaScriptCode(resolvedRootMarkers: SearchIndexItem[]): string {
	return `import { i18n } from '@/i18n.js';\n`
		+ `export const searchIndexes = ${customStringify(resolvedRootMarkers)};\n`;
}

/**
 * オブジェクトを特殊な形式の文字列に変換する
 * i18n参照を保持しつつ適切な形式に変換
 */
function customStringify(obj: unknown, depth = 0): string {
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
function formatSpecialProperty(key: string, value: unknown): string {
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
function formatArrayForOutput(items: unknown[]): string {
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
function extractElementText(node: TemplateChildNode): string | null {
	if (!node) return null;
	if (node.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error("Unexpected COMPOUND_EXPRESSION");

	logger.info(`Extracting text from node type=${node.type}, tag=${'tag' in node ? node.tag : 'unknown'}`);

	// 1. 直接コンテンツの抽出を試行
	const directContent = extractDirectContent(node);
	if (directContent) return directContent;

	// 子要素がない場合は終了
	if (!('children' in node) || !Array.isArray(node.children)) {
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
function extractDirectContent(node: TemplateChildNode): string | null {
	if (!('content' in node)) return null;
	if (typeof node.content == 'object' && node.content.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error("Unexpected COMPOUND_EXPRESSION");

	const content = typeof node.content === 'string' ? node.content.trim()
		: node.content.type !== NodeTypes.INTERPOLATION ? node.content.content.trim()
		: null;

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
function extractInterpolationContent(children: TemplateChildNode[]): string | null {
	for (const child of children) {
		if (child.type === NodeTypes.INTERPOLATION) {
			logger.info(`Found interpolation node (Mustache): ${JSON.stringify(child.content).substring(0, 100)}...`);

			if (child.content && child.content.type === 4 && child.content.content) {
				const content = child.content.content.trim();
				logger.info(`Interpolation content: ${content}`);

				if (isI18nReference(content)) {
					return content;
				}
			} else if (child.content && typeof child.content === 'object') {
				if (child.content.type == NodeTypes.COMPOUND_EXPRESSION) throw new Error("Unexpected COMPOUND_EXPRESSION");
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
function extractExpressionContent(children: TemplateChildNode[]): string | null {
	// i18n.ts. 参照パターンを持つものを優先
	for (const child of children) {
		if (child.type === NodeTypes.TEXT && child.content) {
			const expr = child.content.trim();

			if (isI18nReference(expr)) {
				logger.info(`Found i18n reference in expression node: ${expr}`);
				return expr;
			}
		}
	}

	// その他の式
	for (const child of children) {
		if (child.type === NodeTypes.TEXT && child.content) {
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
function extractTextContent(children: TemplateChildNode[]): string | null {
	for (const child of children) {
		if (child.type === NodeTypes.COMMENT && child.content) {
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
function extractNestedContent(children: TemplateChildNode[]): string | null {
	for (const child of children) {
		if ('children' in child && Array.isArray(child.children) && child.children.length > 0) {
			const nestedContent = extractElementText(child);

			if (nestedContent) {
				logger.info(`Found nested content: ${nestedContent}`);
				return nestedContent;
			}
		} else if (child.type === NodeTypes.ELEMENT) {
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
function extractLabelsAndKeywords(nodes: TemplateChildNode[]): { label: string | null, keywords: string[] } {
	let label: string | null = null;
	const keywords: string[] = [];

	logger.info(`Extracting labels and keywords from ${nodes.length} nodes`);

	// 再帰的にSearchLabelとSearchKeywordを探索（ネストされたSearchMarkerは処理しない）
	function findComponents(nodes: TemplateChildNode[]) {
		for (const node of nodes) {
			if (node.type === NodeTypes.ELEMENT) {
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
						{
							for (const child of node.children) {
								// Mustacheインターポレーション
								if (child.type === NodeTypes.INTERPOLATION && child.content) {
									// content内の式を取り出す
									if (child.content.type == NodeTypes.COMPOUND_EXPRESSION) throw new Error("unexpected COMPOUND_EXPRESSION");
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
								else if (child.type === NodeTypes.TEXT && child.content && isI18nReference(child.content)) {
									label = child.content.trim();
									logger.info(`Found i18n in expression: ${label}`);
									break;
								}
								// テキストノードでもMustache構文を探す
								else if (child.type === NodeTypes.COMMENT && child.content) {
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
						{
							for (const child of node.children) {
								// Mustacheインターポレーション
								if (child.type === NodeTypes.INTERPOLATION && child.content) {
									// content内の式を取り出す
									if (child.content.type == NodeTypes.COMPOUND_EXPRESSION) throw new Error("unexpected COMPOUND_EXPRESSION");
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
								else if (child.type === NodeTypes.TEXT && child.content && isI18nReference(child.content)) {
									const keyword = child.content.trim();
									keywords.push(keyword);
									logger.info(`Found i18n keyword in expression: ${keyword}`);
									break;
								}
								// テキストノードでもMustache構文を探す
								else if (child.type === NodeTypes.COMMENT && child.content) {
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
	templateAst: RootNode | undefined,
	id: string,
): SearchIndexStringItem[] {
	const allMarkers: SearchIndexStringItem[] = [];
	const markerMap = new Map<string, SearchIndexItemLink<string>>();
	const childrenIds = new Set<string>();
	const normalizedId = id.replace(/\\/g, '/');

	if (!templateAst) return allMarkers;

	// マーカーの基本情報を収集
	function collectMarkers(node: TemplateChildNode | RootNode, parentId: string | null = null) {
		if (node.type === NodeTypes.ELEMENT && node.tag === 'SearchMarker') {
			// マーカーID取得
			const markerIdProp = node.props?.find(p => p.name === 'markerId');
			const markerId = markerIdProp?.type == NodeTypes.ATTRIBUTE ? markerIdProp.value?.content : null;

			// SearchMarkerにマーカーIDがない場合はエラー
			if (markerId == null) {
				logger.error(`Marker ID not found for node: ${JSON.stringify(node)}`);
				throw new Error(`Marker ID not found in file ${id}`);
			}

			// マーカー基本情報
			const markerInfo: SearchIndexStringItem = {
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
			if (bindings.children) markerInfo.children = processMarkerProperty(bindings.children, 'children') as string[];
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
			for (const child of node.children) {
				collectMarkers(child, markerId);
			}

			return markerId;
		}
		// SearchMarkerでない場合は再帰的に子ノードを処理
		else if ('children' in node && Array.isArray(node.children)) {
			for (const child of node.children) {
				if (typeof child == 'object' && child.type !== NodeTypes.SIMPLE_EXPRESSION) {
					collectMarkers(child, parentId);
				}
			}
		}

		return null;
	}

	// AST解析開始
	collectMarkers(templateAst);
	return allMarkers;
}

type SpecialBindings = {
	inlining: string[];
	keywords: string[] | string;
};
type Bindings = Partial<Omit<Record<keyof SearchIndexItem, string>, keyof SpecialBindings> & SpecialBindings>;
// バインドプロパティの処理を修正する関数
function extractNodeBindings(node: TemplateChildNode | RootNode): Bindings {
	const bindings: Bindings = {};

	if (node.type !== NodeTypes.ELEMENT) return bindings;

	// バインド式を収集
	for (const prop of node.props) {
		if (prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.arg && 'content' in prop.arg) {
			const propName = prop.arg.content;
			if (prop.exp?.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error('unexpected COMPOUND_EXPRESSION');
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
function parseArrayExpression(expr: string): string[] {
	try {
		// 単純なケースはJSON5でパースを試みる
		return JSON5.parse(expr.replace(/'/g, '"'));
	} catch (e) {
		// 複雑なケース（i18n.ts.xxx などの式を含む場合）は手動パース
		logger.info(`Complex array expression, trying manual parsing: ${expr}`);

		// "["と"]"を取り除く
		const content = expr.substring(1, expr.length - 1).trim();
		if (!content) return [];

		const result: string[] = [];
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

export function collectFileMarkers(files: [id: string, code: string][]): AnalysisResult<SearchIndexStringItem> {
	const allMarkers: SearchIndexStringItem[] = [];
	for (const [id, code] of files) {
		try {
			const { descriptor, errors } = vueSfcParse(code, {
				filename: id,
			});

			if (errors.length > 0) {
				logger.error(`Compile Error: ${id}, ${errors}`);
				continue; // エラーが発生したファイルはスキップ
			}

			const fileMarkers = extractUsageInfoFromTemplateAst(descriptor.template?.ast, id);

			if (fileMarkers && fileMarkers.length > 0) {
				allMarkers.push(...fileMarkers); // すべてのマーカーを収集
				logger.info(`Successfully extracted ${fileMarkers.length} markers from ${id}`);
			} else {
				logger.info(`No markers found in ${id}`);
			}
		} catch (error) {
			logger.error(`Error analyzing file ${id}:`, error);
		}
	}

	// 収集したすべてのマーカー情報を使用
	return {
		filePath: "combined-markers", // すべてのファイルのマーカーを1つのエントリとして扱う
		usage: allMarkers,
	};
}

type TransformedCode = {
	code: string,
	map: SourceMap,
};

export class MarkerIdAssigner {
	// key: file id
	private cache: Map<string, TransformedCode>;

	constructor() {
		this.cache = new Map();
	}

	public onInvalidate(id: string) {
		this.cache.delete(id);
	}

	public processFile(id: string, code: string): TransformedCode {
		// try cache first
		if (this.cache.has(id)) {
			return this.cache.get(id)!;
		}
		const transformed = this.#processImpl(id, code);
		this.cache.set(id, transformed);
		return transformed;
	}

	#processImpl(id: string, code: string): TransformedCode {
		const s = new MagicString(code); // magic-string のインスタンスを作成

		const parsed = vueSfcParse(code, { filename: id });
		if (!parsed.descriptor.template) {
			return {
				code,
				map: s.generateMap({ source: id, includeContent: true }),
			};
		}
		const ast = parsed.descriptor.template.ast; // テンプレート AST を取得
		const markerRelations: MarkerRelation[] = []; //  MarkerRelation 配列を初期化

		if (!ast) {
			return {
				code: s.toString(), // 変更後のコードを返す
				map: s.generateMap({ source: id, includeContent: true }), // ソースマップも生成 (sourceMap: true が必要)
			};
		}

		type SearchMarkerElementNode = ElementNode & {
			__markerId?: string,
			__children?: string[],
		};

		function traverse(node: RootNode | TemplateChildNode | SimpleExpressionNode | CompoundExpressionNode, currentParent?: SearchMarkerElementNode) {
			if (node.type === NodeTypes.ELEMENT && node.tag === 'SearchMarker') {
				// 行番号はコード先頭からの改行数で取得
				const lineNumber = code.slice(0, node.loc.start.offset).split('\n').length;
				// ファイルパスと行番号からハッシュ値を生成
				// この際実行環境で差が出ないようにファイルパスを正規化
				const idKey = id.replace(/\\/g, '/').split('packages/frontend/')[1]
				const generatedMarkerId = toBase62(hash(`${idKey}:${lineNumber}`));

				const props = node.props || [];
				const hasMarkerIdProp = props.some((prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'markerId');
				const nodeMarkerId = hasMarkerIdProp
					? props.find((prop): prop is AttributeNode => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'markerId')?.value?.content as string
					: generatedMarkerId;
				(node as SearchMarkerElementNode).__markerId = nodeMarkerId;

				// 子マーカーの場合、親ノードに __children を設定しておく
				if (currentParent) {
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

			const newParent: SearchMarkerElementNode | undefined = node.type === NodeTypes.ELEMENT && node.tag === 'SearchMarker' ? node : currentParent;
			if ('children' in node) {
				for (const child of node.children) {
					if (typeof child == 'object') {
						traverse(child, newParent);
					}
				}
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
			const childrenProp = parentNode.props?.find((prop): prop is DirectiveNode =>
				prop.type === NodeTypes.DIRECTIVE &&
				prop.name === 'bind' &&
				prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
				prop.arg.content === 'children');

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

		return {
			code: s.toString(), // 変更後のコードを返す
			map: s.generateMap({ source: id, includeContent: true }), // ソースマップも生成 (sourceMap: true が必要)
		};
	}

	async getOrLoad(id: string) {
		// if there already exists a cache, return it
		// note cahce will be invalidated on file change so the cache must be up to date
		let code = this.getCached(id)?.code;
		if (code != null) {
			return code;
		}

		// if no cache found, read and parse the file
		const originalCode = await fs.promises.readFile(id, 'utf-8');

		// Other code may already parsed the file while we were waiting for the file to be read so re-check the cache
		code = this.getCached(id)?.code;
		if (code != null) {
			return code;
		}

		// parse the file
		code = this.processFile(id, originalCode)?.code;
		return code;
	}

	getCached(id: string) {
		return this.cache.get(id);
	}
}

// Rollup プラグインとして export
export default function pluginCreateSearchIndex(options: Options): PluginOption {
	const assigner = new MarkerIdAssigner();
	return [
		createSearchIndex(options, assigner),
		pluginCreateSearchIndexVirtualModule(options, assigner),
	]
}

function createSearchIndex(options: Options, assigner: MarkerIdAssigner): Plugin {
	initLogger(options); // ロガーを初期化
	const root = normalizePath(process.cwd());

	function isTargetFile(id: string): boolean {
		const relativePath = path.posix.relative(root, id);
		return options.targetFilePaths.some(pat => minimatch(relativePath, pat))
	}

	return {
		name: 'autoAssignMarkerId',
		enforce: 'pre',

		watchChange(id) {
			assigner.onInvalidate(id);
		},

		async transform(code, id) {
			if (!id.endsWith('.vue')) {
				return;
			}

			if (!isTargetFile(id)) {
				return;
			}

			return assigner.processFile(id, code);
		},
	};
}

export function pluginCreateSearchIndexVirtualModule(options: Options, asigner: MarkerIdAssigner): Plugin {
	const searchIndexPrefix = options.fileVirtualModulePrefix ?? 'search-index-individual:';
	const searchIndexSuffix = options.fileVirtualModuleSuffix ?? '.ts';
	const allSearchIndexFile = options.mainVirtualModule;
	const root = normalizePath(process.cwd());

	function isTargetFile(id: string): boolean {
		const relativePath = path.posix.relative(root, id);
		return options.targetFilePaths.some(pat => minimatch(relativePath, pat))
	}

	function parseSearchIndexFileId(id: string): string | null {
		const noQuery = id.split('?')[0];
		if (noQuery.startsWith(searchIndexPrefix) && noQuery.endsWith(searchIndexSuffix)) {
			const filePath = id.slice(searchIndexPrefix.length).slice(0, -searchIndexSuffix.length);
			if (isTargetFile(filePath)) {
				return filePath;
			}
		}
		return null;
	}

	return {
		name: 'generateSearchIndexVirtualModule',
		// hotUpdate hook を vite:vue よりもあとに実行したいため enforce: post
		enforce: 'post',

		async resolveId(id) {
			if (id == allSearchIndexFile) {
				return '\0' + allSearchIndexFile;
			}

			const searchIndexFilePath = parseSearchIndexFileId(id);
			if (searchIndexFilePath != null) {
				return id;
			}
			return undefined;
		},

		async load(id) {
			if (id == '\0' + allSearchIndexFile) {
				const files = await Promise.all(options.targetFilePaths.map(async (filePathPattern) => await glob(filePathPattern))).then(paths => paths.flat());
				let generatedFile = '';
				let arrayElements = '';
				for (let file of files) {
					const normalizedRelative = normalizePath(file);
					const absoluteId = normalizePath(path.join(process.cwd(), normalizedRelative)) + searchIndexSuffix;
					const variableName = normalizedRelative.replace(/[\/.-]/g, '_');
					generatedFile += `import { searchIndexes as ${variableName} } from '${searchIndexPrefix}${absoluteId}';\n`;
					arrayElements += `  ...${variableName},\n`;
				}
				generatedFile += `export let searchIndexes = [\n${arrayElements}];\n`;
				return generatedFile;
			}

			const searchIndexFilePath = parseSearchIndexFileId(id);
			if (searchIndexFilePath != null) {
				// call load to update the index file when the file is changed
				this.addWatchFile(searchIndexFilePath);

				const code = await asigner.getOrLoad(searchIndexFilePath);
				return generateJavaScriptCode(collectSearchItemIndexes([collectFileMarkers([[id, code]])]));
			}
			return null;
		},

		hotUpdate(this: { environment: { moduleGraph: EnvironmentModuleGraph } }, { file, modules }) {
			if (isTargetFile(file)) {
				const updateMods = options.modulesToHmrOnUpdate.map(id => this.environment.moduleGraph.getModuleById(path.posix.join(root, id))).filter(x => x != null);
				return [...modules, ...updateMods];
			}
			return modules;
		}
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
