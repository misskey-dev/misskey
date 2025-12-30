/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/// <reference lib="esnext" />

import { parse as vueSfcParse } from 'vue/compiler-sfc';
import {
	createLogger,
	type EnvironmentModuleGraph,
	type LogErrorOptions,
	type LogOptions,
	normalizePath,
	type Plugin,
	type PluginOption
} from 'vite';
import fs from 'node:fs';
import JSON5 from 'json5';
import MagicString, { SourceMap } from 'magic-string';
import path from 'node:path'
import { hash, toBase62 } from '../vite.config';
import { minimatch } from 'minimatch';
import {
	type AttributeNode,
	type DirectiveNode,
	type ElementNode,
	ElementTypes,
	NodeTypes,
	type RootNode,
	type SimpleExpressionNode,
	type TemplateChildNode,
} from '@vue/compiler-core';

export interface SearchIndexItem {
	id: string;
	parentId?: string;
	path?: string;
	label: string;
	keywords: string[];
	texts: string[];
	icon?: string;
	inlining?: string[];
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
	error: (msg: string, options?: LogErrorOptions | unknown) => { },
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

//region AST Utility

type WalkVueNode = RootNode | TemplateChildNode | SimpleExpressionNode;

/**
 * Walks the Vue AST.
 * @param nodes
 * @param context The context value passed to callback. you can update context for children by returning value in callback
 * @param callback Returns false if you don't want to walk inner tree
 */
function walkVueElements<C extends {} | null>(nodes: WalkVueNode[], context: C, callback: (node: ElementNode, context: C) => C | undefined | void | false): void {
	for (const node of nodes) {
		let currentContext = context;
		if (node.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error("Unexpected COMPOUND_EXPRESSION");
		if (node.type === NodeTypes.ELEMENT) {
			const result = callback(node, context);
			if (result === false) return;
			if (result !== undefined) currentContext = result;
		}
		if ('children' in node) {
			walkVueElements(node.children, currentContext, callback);
		}
	}
}

function findAttribute(props: Array<AttributeNode | DirectiveNode>, name: string): AttributeNode | DirectiveNode | null {
	for (const prop of props) {
		switch (prop.type) {
			case NodeTypes.ATTRIBUTE:
				if (prop.name === name) {
					return prop;
				}
				break;
			case NodeTypes.DIRECTIVE:
				if (prop.name === 'bind' && prop.arg && 'content' in prop.arg && prop.arg.content === name) {
					return prop;
				}
				break;
		}
	}
	return null;
}

function findEndOfStartTagAttributes(node: ElementNode): number {
	if (node.children.length > 0) {
		// 子要素がある場合、最初の子要素の開始位置を基準にする
		const nodeStart = node.loc.start.offset;
		const firstChildStart = node.children[0].loc.start.offset;
		const endOfStartTag = node.loc.source.lastIndexOf('>', firstChildStart - nodeStart);
		if (endOfStartTag === -1) throw new Error("Bug: Failed to find end of start tag");
		return nodeStart + endOfStartTag;
	} else {
		// 子要素がない場合、自身の終了位置から逆算
		return node.isSelfClosing ? node.loc.end.offset - 1 : node.loc.end.offset;
	}
}

//endregion

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
function customStringify(obj: unknown): string {
	return JSON.stringify(obj).replaceAll(/"(.*?)"/g, (all, group) => {
		// propertyAccessProxy が i18n 参照を "${i18n.xxx}"のような形に変換してるので、これをそのまま`${i18n.xxx}`
		// のような形にすると、実行時にi18nのプロパティにアクセスするようになる。
		// objectのkeyでは``が使えないので、${ が使われている場合にのみ``に置き換えるようにする
		return group.includes('${') ? '`' + group + '`' : all;
	});
}

// region extractElementText

/**
 * 要素のノードの中身のテキストを抽出する
 */
function extractElementText(node: ElementNode, id: string): string | null {
	return extractElementTextChecked(node, node.tag, id);
}

function extractElementTextChecked(node: ElementNode, processingNodeName: string, id: string): string | null {
	const result: string[] = [];
	for (const child of node.children) {
		const text = extractElementText2Inner(child, processingNodeName, id);
		if (text == null) return null;
		result.push(text);
	}
	return result.join('');
}

function extractElementText2Inner(node: TemplateChildNode, processingNodeName: string, id: string): string | null {
	if (node.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error("Unexpected COMPOUND_EXPRESSION");

	switch (node.type) {
		case NodeTypes.INTERPOLATION: {
			const expr = node.content;
			if (expr.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error(`Unexpected COMPOUND_EXPRESSION`);
			const exprResult = evalExpression(expr.content);
			if (typeof exprResult !== 'string') {
				logger.error(`Result of interpolation node is not string at line ${id}:${node.loc.start.line}`);
				return null;
			}
			return exprResult;
		}
		case NodeTypes.ELEMENT:
			if (node.tagType === ElementTypes.ELEMENT) {
				return extractElementTextChecked(node, processingNodeName, id);
			} else {
				logger.error(`Unexpected ${node.tag} extracting text of ${processingNodeName} ${id}:${node.loc.start.line}`);
				return null;
			}
		case NodeTypes.TEXT:
			return node.content;
		case NodeTypes.COMMENT:
			// We skip comments
			return '';
		case NodeTypes.IF:
		case NodeTypes.IF_BRANCH:
		case NodeTypes.FOR:
		case NodeTypes.TEXT_CALL:
			logger.error(`Unexpected controlflow element extracting text of ${processingNodeName} ${id}:${node.loc.start.line}`);
			return null;
	}
}

// endregion

// region extractUsageInfoFromTemplateAst

/**
 * SearchLabel/SearchText/SearchIconを探して抽出する関数
 */
function extractSugarTags(nodes: TemplateChildNode[], id: string): { label: string | null; texts: string[]; icon: string | null; } {
	let label: string | null | undefined = undefined;
	let icon: string | null | undefined = undefined;
	const texts: string[] = [];

	logger.info(`Extracting labels and texts from ${nodes.length} nodes`);

	walkVueElements(nodes, null, (node) => {
		switch (node.tag) {
			case 'SearchMarker':
				return false; // SearchMarkerはスキップ
			case 'SearchLabel':
				if (label !== undefined) {
					logger.warn(`Duplicate SearchLabel found, ignoring the second one at ${id}:${node.loc.start.line}`);
					break; // 2つ目のSearchLabelは無視
				}

				label = extractElementText(node, id);
				return;
			case 'SearchText':
				const content = extractElementText(node, id);
				if (content) {
					texts.push(content);
				}
				return;
			case 'SearchIcon':
				if (icon !== undefined) {
					logger.warn(`Duplicate SearchIcon found, ignoring the second one at ${id}:${node.loc.start.line}`);
					break; // 2つ目のSearchIconは無視
				}

				if (node.children.length !== 1) {
					logger.error(`SearchIcon must have exactly one child at ${id}:${node.loc.start.line}`);
					return;
				}

				const iconNode = node.children[0];
				if (iconNode.type !== NodeTypes.ELEMENT) {
					logger.error(`SearchIcon must have a child element at ${id}:${node.loc.start.line}`);
					return;
				}
				icon = getStringProp(findAttribute(iconNode.props, 'class'), id);
				return;
		}

		return;
	});

	// デバッグ情報
	logger.info(`Extraction completed: label=${label}, text=[${texts.join(', ')}, icon=${icon}]`);
	return { label: label ?? null, texts, icon: icon ?? null };
}

function getStringProp(attr: AttributeNode | DirectiveNode | null, id: string): string | null {
	switch (attr?.type) {
		case null:
		case undefined:
			return null;
		case NodeTypes.ATTRIBUTE:
			return attr.value?.content ?? null;
		case NodeTypes.DIRECTIVE:
			if (attr.exp == null) return null;
			if (attr.exp.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error('Unexpected COMPOUND_EXPRESSION');
			const value = evalExpression(attr.exp.content ?? '');
			if (typeof value !== 'string') {
				logger.error(`Expected string value, got ${typeof value} at ${id}:${attr.loc.start.line}`);
				return null;
			}
			return value;
	}
}

function getStringArrayProp(attr: AttributeNode | DirectiveNode | null, id: string): string[] | null {
	switch (attr?.type) {
		case null:
		case undefined:
			return null;
		case NodeTypes.ATTRIBUTE:
			logger.error(`Expected directive, got attribute at ${id}:${attr.loc.start.line}`);
			return null;
		case NodeTypes.DIRECTIVE:
			if (attr.exp == null) return null;
			if (attr.exp.type === NodeTypes.COMPOUND_EXPRESSION) throw new Error('Unexpected COMPOUND_EXPRESSION');
			const value = evalExpression(attr.exp.content ?? '');
			if (!Array.isArray(value) || !value.every(x => typeof x === 'string')) {
				logger.error(`Expected string array value, got ${typeof value} at ${id}:${attr.loc.start.line}`);
				return null;
			}
			return value;
	}
}

function extractUsageInfoFromTemplateAst(
	templateAst: RootNode | undefined,
	id: string,
): SearchIndexItem[] {
	const allMarkers: SearchIndexItem[] = [];
	const markerMap = new Map<string, SearchIndexItem>();

	if (!templateAst) return allMarkers;

	walkVueElements<string | null>([templateAst], null, (node, parentId) => {
		if (node.tag !== 'SearchMarker') {
			return;
		}

		// マーカーID取得
		const markerIdProp = node.props?.find(p => p.name === 'markerId');
		const markerId = markerIdProp?.type == NodeTypes.ATTRIBUTE ? markerIdProp.value?.content : null;

		// SearchMarkerにマーカーIDがない場合はエラー
		if (markerId == null) {
			logger.error(`Marker ID not found for node: ${JSON.stringify(node)}`);
			throw new Error(`Marker ID not found in file ${id}`);
		}

		// マーカー基本情報
		const markerInfo: SearchIndexItem = {
			id: markerId,
			parentId: parentId ?? undefined,
			label: '', // デフォルト値
			keywords: [],
			texts: [],
		};

		// バインドプロパティを取得
		const path = getStringProp(findAttribute(node.props, 'path'), id);
		const icon = getStringProp(findAttribute(node.props, 'icon'), id);
		const label = getStringProp(findAttribute(node.props, 'label'), id);
		const inlining = getStringArrayProp(findAttribute(node.props, 'inlining'), id);
		const keywords = getStringArrayProp(findAttribute(node.props, 'keywords'), id);
		const texts = getStringArrayProp(findAttribute(node.props, 'texts'), id);

		if (path) markerInfo.path = path;
		if (icon) markerInfo.icon = icon;
		if (label) markerInfo.label = label;
		if (inlining) markerInfo.inlining = inlining;
		if (keywords) markerInfo.keywords = keywords;
		if (texts) markerInfo.texts = texts;

		// pathがない場合はファイルパスを設定
		if (markerInfo.path == null && parentId == null) {
			markerInfo.path = id.match(/.*(\/(admin|settings)\/[^\/]+)\.vue$/)?.[1];
		}

		// SearchLabelとSearchTextを抽出 (AST全体を探索)
		{
			const extracted = extractSugarTags(node.children, id);
			if (extracted.label && markerInfo.label) logger.warn(`Duplicate label found for ${markerId} at ${id}:${node.loc.start.line}`);
			if (extracted.icon && markerInfo.icon) logger.warn(`Duplicate icon found for ${markerId} at ${id}:${node.loc.start.line}`);
			markerInfo.label = extracted.label ?? markerInfo.label ?? '';
			markerInfo.texts = [...extracted.texts, ...markerInfo.texts];
			markerInfo.icon = extracted.icon ?? markerInfo.icon ?? undefined;
		}

		if (!markerInfo.label) {
			logger.warn(`No label found for ${markerId} at ${id}:${node.loc.start.line}`);
		}

		// マーカーを登録
		markerMap.set(markerId, markerInfo);
		allMarkers.push(markerInfo);
		return markerId;
	});

	return allMarkers;
}

//endregion

//region evalExpression

/**
 * expr を実行します。
 * i18n はそのアクセスを保持するために propertyAccessProxy を使用しています。
 */
function evalExpression(expr: string): unknown {
	const rarResult = Function('i18n', `return ${expr}`)(i18nProxy);
	// JSON.stringify を一回通すことで、 AccessProxy を文字列に変換する
	// Walk してもいいんだけど横着してJSON.stringifyしてる。ビルド時にしか通らないのであんまりパフォーマンス気にする必要ないんで
	return JSON.parse(JSON.stringify(rarResult));
}

const propertyAccessProxySymbol = Symbol('propertyAccessProxySymbol');

type AccessProxy = {
	[propertyAccessProxySymbol]: string[],
	[k: string]: AccessProxy,
}

const propertyAccessProxyHandler: ProxyHandler<AccessProxy> = {
	get(target: AccessProxy, p: string | symbol): any {
		if (p in target) {
			return (target as any)[p];
		}
		if (p == "toJSON" || p == Symbol.toPrimitive) {
			return propertyAccessProxyToJSON;
		}
		if (typeof p == 'string') {
			return target[p] = propertyAccessProxy([...target[propertyAccessProxySymbol], p]);
		}
		return undefined;
	}
}

function propertyAccessProxyToJSON(this: AccessProxy, hint: string) {
	const expression = this[propertyAccessProxySymbol].reduce((prev, current) => {
		if (current.match(/^[a-z][0-9a-z]*$/i)) {
			return `${prev}.${current}`;
		} else {
			return `${prev}['${current}']`;
		}
	});
	return '$\{' + expression + '}';
}

/**
 * プロパティのアクセスを保持するための Proxy オブジェクトを作成します。
 *
 * この関数で生成した proxy は JSON でシリアライズするか、`${}`のように string にすると、 ${property.path} のような形になる。
 * @param path
 */
function propertyAccessProxy(path: string[]): AccessProxy {
	const target: AccessProxy = {
		[propertyAccessProxySymbol]: path,
	};
	return new Proxy(target, propertyAccessProxyHandler);
}

const i18nProxy = propertyAccessProxy(['i18n']);

export function collectFileMarkers(id: string, code: string): SearchIndexItem[] {
	try {
		const { descriptor, errors } = vueSfcParse(code, {
			filename: id,
		});

		if (errors.length > 0) {
			logger.error(`Compile Error: ${id}, ${errors}`);
			return []; // エラーが発生したファイルはスキップ
		}

		return extractUsageInfoFromTemplateAst(descriptor.template?.ast, id);
	} catch (error) {
		logger.error(`Error analyzing file ${id}:`, error);
	}

	return [];
}

// endregion

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

		walkVueElements<string | null>([ast], null, (node, parentId) => {
			if (node.tag !== 'SearchMarker') return;

			const markerIdProp = findAttribute(node.props, 'markerId');

			let nodeMarkerId: string;
			if (markerIdProp != null) {
				if (markerIdProp.type !== NodeTypes.ATTRIBUTE) return logger.error(`markerId must be a attribute at ${id}:${markerIdProp.loc.start.line}`);
				if (markerIdProp.value == null) return logger.error(`markerId must have a value at ${id}:${markerIdProp.loc.start.line}`);
				nodeMarkerId = markerIdProp.value.content;
			} else {
				// ファイルパスと行番号からハッシュ値を生成
				// この際実行環境で差が出ないようにファイルパスを正規化
				const idKey = id.replace(/\\/g, '/').split('packages/frontend/')[1]
				const generatedMarkerId = toBase62(hash(`${idKey}:${node.loc.start.line}`));

				// markerId attribute を追加
				const endOfStartTag = findEndOfStartTagAttributes(node);
				s.appendRight(endOfStartTag, ` markerId="${generatedMarkerId}" data-in-app-search-marker-id="${generatedMarkerId}"`);

				nodeMarkerId = generatedMarkerId;
			}

			markerRelations.push({
				parentId: parentId ?? undefined,
				markerId: nodeMarkerId,
				node: node,
			});

			return nodeMarkerId;
		})

		// 2段階目: :children 属性の追加
		// 最初に親マーカーごとに子マーカーIDを集約する処理を追加
		const parentChildrenMap = new Map<string, string[]>();

		// 1. まず親ごとのすべての子マーカーIDを収集
		markerRelations.forEach(relation => {
			if (relation.parentId) {
				if (!parentChildrenMap.has(relation.parentId)) {
					parentChildrenMap.set(relation.parentId, []);
				}
				parentChildrenMap.get(relation.parentId)!.push(relation.markerId);
			}
		});

		// 2. 親ごとにまとめて :children 属性を処理
		for (const [parentId, childIds] of parentChildrenMap.entries()) {
			const parentRelation = markerRelations.find(r => r.markerId === parentId);
			if (!parentRelation) continue;

			const parentNode = parentRelation.node;
			const childrenProp = findAttribute(parentNode.props, 'children');
			if (childrenProp != null) {
				if (childrenProp.type !== NodeTypes.DIRECTIVE) {
					console.error(`children prop should be directive (:children) at ${id}:${childrenProp.loc.start.line}`);
					continue;
				}

				// AST で :children 属性が検出された場合、それを更新
				const childrenValue = getStringArrayProp(childrenProp, id);
				if (childrenValue == null) continue;

				const newValue: string[] = [...childrenValue];
				for (const childId of [...childIds]) {
					if (!newValue.includes(childId)) {
						newValue.push(childId);
					}
				}

				const expression = JSON.stringify(newValue).replaceAll(/"/g, "'");
				s.overwrite(childrenProp.exp!.loc.start.offset, childrenProp.exp!.loc.end.offset, expression);
				logger.info(`Added ${childIds.length} child markerIds to existing :children in ${id}`);
			} else {
				// :children 属性がまだない場合、新規作成
				const endOfParentStartTag = findEndOfStartTagAttributes(parentNode);
				s.appendRight(endOfParentStartTag, ` :children="${JSON5.stringify(childIds).replace(/"/g, "'")}"`);
				logger.info(`Created new :children attribute with ${childIds.length} markerIds in ${id}`);
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
				const files = options.targetFilePaths.map((filePathPattern) => fs.globSync(filePathPattern)).flat();
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
				return generateJavaScriptCode(collectFileMarkers(searchIndexFilePath, code));
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
