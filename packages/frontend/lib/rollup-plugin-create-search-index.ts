import { parse as vueSfcParse } from '@vue/compiler-sfc';
import type { Plugin } from 'rollup';
import fs from 'node:fs';


export interface AnalysisResult {
	filePath: string;
	usage: ComponentUsageInfo[];
}

export interface ComponentUsageInfo {
	parentFile: string;
	staticProps: Record<string, string>;
	bindProps: Record<string, string>;
	componentName: string;
}

function outputAnalysisResultAsJson(outputPath: string, analysisResults: AnalysisResult[]): void {
	const jsonOutput = JSON.stringify(analysisResults, null, 2);

	try {
		fs.writeFileSync(outputPath, jsonOutput, 'utf-8');
		console.log(`静的解析結果を ${outputPath} に出力しました。`);
	} catch (error) {
		console.error('JSONファイル出力エラー:', error);
	}
}

function outputAnalysisResultAsTS(outputPath: string, analysisResults: AnalysisResult[]): void {
  const varName = 'searchIndexResults';

  const jsonString = JSON.stringify(analysisResults, null, 2); //  JSON.stringify で JSON 文字列を生成

  //  bindProps の値を文字列置換で修正する関数
  function modifyBindPropsInString(jsonString: string): string {
    //  bindProps: { ... } ブロックを正規表現で検索し、置換
    const modifiedString = jsonString.replace(
      /"bindProps":\s*\{([^}]*)\}/g, //  "bindProps": { ... } にマッチ (g フラグで複数箇所を置換)
      (match, bindPropsBlock) => {
        //  bindPropsBlock ( { ... } 内) の各プロパティをさらに置換
        const modifiedBlock = bindPropsBlock.replace(
          /"([^"]*)":\s*"(.*)"/g, //  "propName": "propValue" にマッチ
          (propMatch, propName, propValue) => {
            return `"${propName}": ${propValue}`; // propValue のダブルクォートを除去
          }
        );
        return `"bindProps": {${modifiedBlock}				}`; //  置換後の block で "bindProps": { ... } を再構成
      }
    );
    return modifiedString;
  }


  const tsOutput = `
// vue-props-analyzer によって自動生成されたファイルです。
// 編集はしないでください。

import { i18n } from '@/i18n.js';

export const ${varName} = ${modifyBindPropsInString(jsonString)} as const;

export type AnalysisResults = typeof ${varName};
export type ComponentUsageInfo = AnalysisResults[number]['usage'][number];
`;

  try {
    fs.writeFileSync(outputPath.replace('.json', '.ts'), tsOutput, 'utf-8'); //  拡張子を .ts に変更
    console.log(`静的解析結果を ${outputPath.replace('.json', '.ts')} に出力しました。`); //  出力メッセージも .ts に変更
  } catch (error) {
    console.error('TypeScriptファイル出力エラー:', error); // エラーメッセージも TypeScriptファイル出力エラー に変更
  }
}


export default function vuePropsAnalyzer(options: {
	targetComponents: string[],
	targetFilePaths: string[],
	exportFilePath: string
}): Plugin {
	const targetComponents = options.targetComponents || [];
	const analysisResults: AnalysisResult[] = []; // 解析結果を格納する配列をプラグイン内で定義

	return {
		name: 'vue-props-analyzer',

		async transform(code, id) { // transform に渡される code を使用 (ファイル直接読み込みはしない)
			if (!id.endsWith('.vue')) {
				return null;
			}

			if (!options.targetFilePaths.some(targetFilePath => id.includes(targetFilePath))) {
				return null;
			}

			const { descriptor, errors } = vueSfcParse(code, { // transform の code を解析
				filename: id,
			});

			if (errors.length) {
				console.error(`コンパイルエラー: ${id}`, errors);
				return null;
			}

			// テンプレートASTを走査してコンポーネント使用箇所とpropsの値を取得
			const usageInfo = extractUsageInfoFromTemplateAst(descriptor.template?.ast, id, targetComponents);
			if (!usageInfo) return null;

			if (usageInfo.length > 0) {
				analysisResults.push({ // グローバル変数ではなく、プラグイン内の配列に push
					filePath: id,
					usage: usageInfo,
				});
			}

			return null;
		},

		async writeBundle() {
			outputAnalysisResultAsTS(options.exportFilePath, analysisResults); // writeBundle でファイル出力、解析結果配列を渡す
		},
	};
}

function extractUsageInfoFromTemplateAst(
	templateAst: any,
	currentFilePath: string,
	targetComponents: string[]
): ComponentUsageInfo[] {
	const usageInfoList: ComponentUsageInfo[] = [];

	if (!templateAst) {
		return usageInfoList;
	}

	function traverse(node: any) {
		if (node.type === 1 /* ELEMENT */ && node.tag && targetComponents.includes(node.tag)) {
			const componentTag = node.tag;

			const staticProps: Record<string, string> = {};
			const bindProps: Record<string, string> = {};

			if (node.props && Array.isArray(node.props)) {
				node.props.forEach((prop: any) => {
					if (prop.type === 6 /* ATTRIBUTE */) { // type 6 は StaticAttribute
						staticProps[prop.name] = prop.value?.content || ''; //  属性値を文字列として取得
					} else if (prop.type === 7 /* DIRECTIVE */ && prop.name === 'bind' && prop.arg?.content) { // type 7 は DirectiveNode, v-bind:propName の場合
						if (prop.exp?.content) {
							bindProps[prop.arg.content] = prop.exp.content; // v-bind:propName="expression" の expression 部分を取得 (文字列)
						}
					}
				});
			}

			usageInfoList.push({
				parentFile: currentFilePath,
				staticProps,
				bindProps,
				componentName: componentTag,
			});

		} else if (node.children && Array.isArray(node.children)) {
			node.children.forEach(child => traverse(child));
		}
	}

	traverse(templateAst);
	return usageInfoList;
}
