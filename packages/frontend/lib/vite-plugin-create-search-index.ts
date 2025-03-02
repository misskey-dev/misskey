/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse as vueSfcParse } from 'vue/compiler-sfc';
import type { Plugin } from 'vite';
import fs from 'node:fs';
import { glob } from 'glob';
import JSON5 from 'json5';
import MagicString from 'magic-string';
import path from 'node:path'
import { hash, toBase62 } from '../vite.config';
import { createLogger } from 'vite';

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
	children?: (SearchIndexItem[] | string);
}

const logger = createLogger();
const loggerInfo = logger.info;
const loggerWarn = logger.warn;
const loggerError = logger.error;

logger.info = (msg, options) => {
	msg = `[create-search-index] ${msg}`;
	loggerInfo(msg, options);
}

logger.warn = (msg, options) => {
	msg = `[create-search-index] ${msg}`;
	loggerWarn(msg, options);
}

logger.error = (msg, options) => {
	msg = `[create-search-index] ${msg}`;
	loggerError(msg, options);
}

function outputAnalysisResultAsTS(outputPath: string, analysisResults: AnalysisResult[]): void {
  logger.info(`Processing ${analysisResults.length} files for output`);

  // 新しいツリー構造を構築
  const allMarkers = new Map<string, SearchIndexItem>();

  // 1. すべてのマーカーを一旦フラットに収集
  for (const file of analysisResults) {
    logger.info(`Processing file: ${file.filePath} with ${file.usage.length} markers`);
    for (const marker of file.usage) {
      if (marker.id) {
        // キーワードの処理（文字列から配列へ変換）
        let keywords = marker.keywords;
        if (typeof keywords === 'string' && keywords.startsWith('[') && keywords.endsWith(']')) {
          try {
            // JSON5解析を試みる（ただしi18n参照などがある場合は例外発生）
            keywords = JSON5.parse(keywords.replace(/'/g, '"'));
          } catch (e) {
            // 解析に失敗した場合は文字列のままにする
            logger.warn(`Keeping keywords as string expression: ${keywords}`);
          }
        }

        // 子要素の処理（文字列から配列へ変換）
        let children = marker.children || [];
        if (typeof children === 'string' && children.startsWith('[') && children.endsWith(']')) {
          try {
            // JSON5解析を試みる
            children = JSON5.parse(children.replace(/'/g, '"'));
          } catch (e) {
            // 解析に失敗した場合は空配列に
            logger.warn(`Could not parse children: ${children}, using empty array`);
            children = [];
          }
        }

        // 子マーカーの内部構造を適切に更新
        if (Array.isArray(children) && children.length > 0) {
          logger.info(`Marker ${marker.id} has ${children.length} children: ${JSON.stringify(children)}`);
        }

        allMarkers.set(marker.id, {
          ...marker,
          keywords,
          children: Array.isArray(children) ? children : []
        });
      }
    }
  }

  logger.info(`Collected total ${allMarkers.size} unique markers`);

  // 2. 子マーカーIDの収集
  const childIds = new Set<string>();

  allMarkers.forEach((marker, id) => {
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
  });

  logger.info(`Found ${childIds.size} child markers`);

  // 3. ルートマーカーの特定（他の誰かの子でないマーカー）
  const rootMarkers: SearchIndexItem[] = [];

  allMarkers.forEach((marker, id) => {
    if (!childIds.has(id)) {
      // このマーカーはルート（他の誰の子でもない）
      rootMarkers.push(marker);
      logger.info(`Added root marker to output: ${id} with label ${marker.label}`);
    }
  });

  logger.info(`Found ${rootMarkers.length} root markers`);

  // 4. 子マーカーの参照を解決（IDから実際のオブジェクトに）
  function resolveChildrenReferences(marker: SearchIndexItem): SearchIndexItem {
    // マーカーのディープコピーを作成
    const resolvedMarker = { ...marker };

    // 子リファレンスを解決
    if (Array.isArray(marker.children)) {
      const children: SearchIndexItem[] = [];

      for (const childId of marker.children) {
        if (typeof childId === 'string') {
          const childMarker = allMarkers.get(childId);

          if (childMarker) {
            // 子マーカーの子も再帰的に解決
            const resolvedChild = resolveChildrenReferences(childMarker);
            children.push(resolvedChild);
            logger.info(`Resolved child ${childId} for parent ${marker.id}`);
          }
        }
      }

      // 子が存在する場合のみchildrenプロパティを設定
      if (children.length > 0) {
        resolvedMarker.children = children;
      } else {
        // 子がない場合はchildrenプロパティを削除
        delete resolvedMarker.children;
      }
    }

    return resolvedMarker;
  }

  // すべてのルートマーカーに対して子の参照を解決
  const resolvedRootMarkers = rootMarkers.map(marker => {
    return resolveChildrenReferences(marker);
  });

  // 特殊なプロパティ変換用の関数
  function formatSpecialProperty(key: string, value: any): string {
    // 値がundefinedの場合は空文字列を返す
    if (value === undefined) {
      return '""';
    }

    // childrenが配列の場合は特別に処理
    if (key === 'children' && Array.isArray(value)) {
      return customStringify(value);
    }

    // 文字列でない場合はJSON5で文字列化
    if (typeof value !== 'string') {
      return JSON5.stringify(value);
    }

    // i18n.ts 参照を含む場合
    if (value.includes('i18n.ts.')) {
      return value; // クォートなしで直接返す
    }

    // keywords が配列リテラルの形式の場合
    if (key === 'keywords' && value.startsWith('[') && value.endsWith(']')) {
      return value; // クォートなしで直接返す
    }

    // 上記以外は通常の JSON5 文字列として返す
    return JSON5.stringify(value);
  }

  // オブジェクトをカスタム形式に変換する関数
  function customStringify(obj: any, depth = 0): string {
    const INDENT_STR = '\t';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const indent = INDENT_STR.repeat(depth);
      const childIndent = INDENT_STR.repeat(depth + 1);
      const items = obj.map(item => `${childIndent}${customStringify(item, depth + 1)}`).join(',\n');
      return `[\n${items},\n${indent}]`;
    }

    if (obj === null || typeof obj !== 'object') {
      return JSON5.stringify(obj);
    }

    const indent = INDENT_STR.repeat(depth);
    const childIndent = INDENT_STR.repeat(depth + 1);
    const entries = Object.entries(obj)
      .filter(([key, value]) => {
        // valueがundefinedの場合は出力しない
        if (value === undefined) return false;
        // childrenが空配列の場合は出力しない
        if (key === 'children' && Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .map(([key, value]) => {
        // childrenが配列の場合で要素がある場合のみ特別処理
        if (key === 'children' && Array.isArray(value) && value.length > 0) {
          return `${childIndent}${key}: ${customStringify(value, depth + 1)}`;
        }
        return `${childIndent}${key}: ${formatSpecialProperty(key, value)}`;
      });

    if (entries.length === 0) return '{}';
    return `{\n${entries.join(',\n')},\n${indent}}`;
  }

  // 最終出力用のデバッグ情報を生成
  let totalMarkers = resolvedRootMarkers.length;
  let totalChildren = 0;

  function countNestedMarkers(markers: SearchIndexItem[]): void {
    for (const marker of markers) {
      if (marker.children && Array.isArray(marker.children)) {
        totalChildren += marker.children.length;
        totalMarkers += marker.children.length;
        countNestedMarkers(marker.children as SearchIndexItem[]);
      }
    }
  }

  countNestedMarkers(resolvedRootMarkers);
  logger.info(`Total markers in tree: ${totalMarkers} (${resolvedRootMarkers.length} roots + ${totalChildren} nested children)`);

  // 結果をTS形式で出力
  const tsOutput = `
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// This file was automatically generated by create-search-index.
// Do not edit this file.

/* eslint-disable @stylistic/comma-spacing */

import { i18n } from '@/i18n.js';

export type SearchIndexItem = {
	id: string;
	path?: string;
	label: string;
	keywords: string | string[];
	icon?: string;
	children?: (SearchIndexItem[] | string);
};

export const searchIndexes:SearchIndexItem[] = ${customStringify(resolvedRootMarkers)} as const;

export type SearchIndex = typeof searchIndexes;

/* eslint-enable @stylistic/comma-spacing */
`;

  try {
    fs.writeFileSync(outputPath, tsOutput, 'utf-8');
    logger.info(`Successfully wrote search index to ${outputPath} with ${resolvedRootMarkers.length} root entries and ${totalChildren} nested children`);
  } catch (error) {
    logger.error('[create-search-index]: error: ', error);
  }
}

function extractUsageInfoFromTemplateAst(
  templateAst: any,
  code: string,
): SearchIndexItem[] {
  // すべてのマーカー情報を保持するために、結果をトップレベルマーカー+すべての子マーカーを含む配列に変更
  const allMarkers: SearchIndexItem[] = [];
  // マーカーIDからオブジェクトへのマップ
  const markerMap = new Map<string, SearchIndexItem>();
  // 子マーカーIDを集約するためのセット
  const childrenIds = new Set<string>();

  if (!templateAst) {
    return allMarkers;
  }

  // デバッグ情報
  logger.info('Started extracting markers from AST');

  // マーカーの基本情報を収集
  function collectMarkers(node: any, parentId: string | null = null) {
    // SearchMarkerコンポーネントの検出
    if (node.type === 1 && node.tag === 'SearchMarker') {
      // マーカーID生成 (markerId属性またはDOM内に記録されているものを使用)
      const markerIdProp = node.props?.find((p: any) => p.name === 'markerId');
      const markerId = markerIdProp?.value?.content ||
                      node.__markerId ||
                      `marker-${Math.random().toString(36).substring(2, 10)}`;

      logger.info(`Found SearchMarker with ID: ${markerId}`);

      // マーカー基本情報
      const markerInfo: SearchIndexItem = {
        id: markerId,
        children: [],
        label: '',
        keywords: [],
      };

      // 静的プロパティを抽出
      if (node.props && Array.isArray(node.props)) {
        node.props.forEach((prop: any) => {
          if (prop.type === 6 && prop.name && prop.name !== 'markerId') {
            // 静的プロパティの抽出
            if (prop.name === 'path') markerInfo.path = prop.value?.content || '';
            else if (prop.name === 'icon') markerInfo.icon = prop.value?.content || '';
            else if (prop.name === 'label') markerInfo.label = prop.value?.content || '';

            logger.info(`Static prop ${prop.name}:`, prop.value?.content);
          }
        });
      }

      // バインドプロパティを抽出
      if (node.props && Array.isArray(node.props)) {
        node.props.forEach((prop: any) => {
          if (prop.type === 7 && prop.name === 'bind' && prop.arg?.content) {
            const propName = prop.arg.content;
            const propValue = prop.exp?.content || '';

            logger.info(`Bind prop ${propName}:`, propValue);

            if (propName === 'label') {
              markerInfo.label = propValue;
            } else if (propName === 'path') {
              markerInfo.path = propValue;
            } else if (propName === 'icon') {
              markerInfo.icon = propValue;
            } else if (propName === 'keywords') {
              markerInfo.keywords = propValue || '[]';
            } else if (propName === 'children') {
              markerInfo.children = propValue || '[]';
            }
          }
        });
      }

      // ラベルがない場合はデフォルト値を設定
      if (!markerInfo.label) {
        markerInfo.label = 'Unnamed marker';
      }

      // キーワードがない場合はデフォルト値を設定
      if (!markerInfo.keywords || (Array.isArray(markerInfo.keywords) && markerInfo.keywords.length === 0)) {
        markerInfo.keywords = '[]';
      }

      // マーカーをマップに保存し、すべてのマーカーリストにも追加
      markerMap.set(markerId, markerInfo);
      allMarkers.push(markerInfo); // すべてのマーカーを保持

      // 親子関係を記録
      if (parentId) {
        const parent = markerMap.get(parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          if (Array.isArray(parent.children)) {
            parent.children.push(markerId);
          } else {
            parent.children = [markerId];
          }
          childrenIds.add(markerId);
          logger.info(`Added ${markerId} as child of ${parentId}`);
        }
      }

      // 子ノードを処理（親は現在のノード）
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          collectMarkers(child, markerId);
        });
      }

      return markerId;
    }

    // SearchMarkerでない場合は、子ノードを同じ親コンテキストで処理
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        collectMarkers(child, parentId);
      });
    }

    return null;
  }

  // AST解析を開始
  collectMarkers(templateAst);

  // デバッグ情報
  logger.info(`Found ${markerMap.size} markers, ${childrenIds.size} children`);

  // 重要: すべてのマーカー情報を返す
  return allMarkers;
}

export async function analyzeVueProps(options: {
	targetFilePaths: string[],
	exportFilePath: string,
	transformedCodeCache: Record<string, string>
}): Promise<void> {
	const allMarkers: SearchIndexItem[] = [];

	//  対象ファイルパスを glob で展開
	const filePaths = options.targetFilePaths.reduce<string[]>((acc, filePathPattern) => {
		const matchedFiles = glob.sync(filePathPattern);
		return [...acc, ...matchedFiles];
	}, []);

	logger.info(`Found ${filePaths.length} matching files to analyze`);

	for (const filePath of filePaths) {
		const id = path.resolve(filePath); // 絶対パスに変換
		const code = options.transformedCodeCache[id]; // options 経由でキャッシュ参照
		if (!code) { // キャッシュミスの場合
			logger.error(`Error: No cached code found for: ${filePath}.`); // エラーログ
			// ファイルを直接読み込む代替策を実行
			try {
				const directCode = fs.readFileSync(filePath, 'utf-8');
				options.transformedCodeCache[id] = directCode;
				logger.info(`Loaded file directly instead: ${filePath}`);
			} catch (err) {
				logger.error(`Failed to load file directly: ${filePath}`, err);
				continue;
			}
		}

		try {
			const { descriptor, errors } = vueSfcParse(options.transformedCodeCache[id], {
				filename: filePath,
			});

			if (errors.length) {
				logger.error(`Compile Error: ${filePath}`, errors);
				continue; // エラーが発生したファイルはスキップ
			}

			const fileMarkers = extractUsageInfoFromTemplateAst(descriptor.template?.ast, options.transformedCodeCache[id]);

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
	node: any;
}

async function processVueFile(
	code: string,
	id: string,
	options: { targetFilePaths: string[], exportFilePath: string },
	transformedCodeCache: Record<string, string>
) {
	// すでにキャッシュに存在する場合は、そのまま返す
	if (transformedCodeCache[id] && transformedCodeCache[id].includes('markerId=')) {
		logger.info(`Using cached version for ${id}`);
		return {
			code: transformedCodeCache[id],
			map: null
		};
	}

	const s = new MagicString(code); // magic-string のインスタンスを作成
	const parsed = vueSfcParse(code, { filename: id });
	if (!parsed.descriptor.template) {
		return;
	}
	const ast = parsed.descriptor.template.ast; // テンプレート AST を取得
	const markerRelations: MarkerRelation[] = []; //  MarkerRelation 配列を初期化

	if (ast) {
		function traverse(node: any, currentParent?: any) {
			if (node.type === 1 && node.tag === 'SearchMarker') {
				// 行番号はコード先頭からの改行数で取得
				const lineNumber = code.slice(0, node.loc.start.offset).split('\n').length;
				// ファイルパスと行番号からハッシュ値を生成
				const generatedMarkerId = toBase62(hash(`${id}:${lineNumber}`));

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
							s.appendRight(endOfStartTag, ` markerId="${generatedMarkerId}"`);
							logger.info(`Adding markerId="${generatedMarkerId}" to ${id}:${lineNumber}`);
						} else {
							logger.warn(`markerId already exists in ${id}:${lineNumber}`);
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
			const parentNodeStart = parentNode.loc.start.offset;
			const endOfParentStartTag = parentNode.children && parentNode.children.length > 0
				? code.lastIndexOf('>', parentNode.children[0].loc.start.offset)
				: code.indexOf('>', parentNodeStart);

			if (endOfParentStartTag === -1) continue;

			// 親タグのテキストを取得
			const parentTagText = code.substring(parentNodeStart, endOfParentStartTag + 1);

			if (childrenProp) {
				// AST で :children 属性が検出された場合、それを更新
				try {
					const childrenStart = code.indexOf('[', childrenProp.exp.loc.start.offset);
					const childrenEnd = code.indexOf(']', childrenProp.exp.loc.start.offset);
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
	transformedCodeCache[id] = transformedCode; //  変換後のコードをキャッシュに保存

	return {
		code: transformedCode, // 変更後のコードを返す
		map: s.generateMap({ source: id, includeContent: true }), // ソースマップも生成 (sourceMap: true が必要)
	};
}


// Rollup プラグインとして export
export default function pluginCreateSearchIndex(options: {
	targetFilePaths: string[],
	exportFilePath: string
}): Plugin {
	let transformedCodeCache: Record<string, string> = {}; //  キャッシュオブジェクトをプラグインスコープで定義
	const isDevServer = process.env.NODE_ENV === 'development'; // 開発サーバーかどうか

	return {
		name: 'createSearchIndex',
		enforce: 'pre',

		async buildStart() {
			if (!isDevServer) {
				return;
			}

			const filePaths = options.targetFilePaths.reduce<string[]>((acc, filePathPattern) => {
				const matchedFiles = glob.sync(filePathPattern);
				return [...acc, ...matchedFiles];
			}, []);

			for (const filePath of filePaths) {
				const id = path.resolve(filePath); // 絶対パスに変換
				const code = fs.readFileSync(filePath, 'utf-8'); // ファイル内容を読み込む
				await processVueFile(code, id, options, transformedCodeCache); // processVueFile 関数を呼び出す
			}


			await analyzeVueProps({ ...options, transformedCodeCache }); // 開発サーバー起動時にも analyzeVueProps を実行
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

			const transformed = await processVueFile(code, id, options, transformedCodeCache);
			if (isDevServer) {
				await analyzeVueProps({ ...options, transformedCodeCache }); // analyzeVueProps を呼び出す
			}
			return transformed;
		},

		async writeBundle() {
			await analyzeVueProps({ ...options, transformedCodeCache }); // ビルド時にも analyzeVueProps を実行
		},
	};
}
