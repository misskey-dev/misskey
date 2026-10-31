import tsParser from '@typescript-eslint/parser';
import sharedConfig from '../shared/eslint.config.js';

// eslint-disable-next-line import/no-default-export
export default [
	...sharedConfig,
	{
		ignores: [
			'**/node_modules',
			'built',
		],
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
				project: ['./tsconfig.json', './test/tsconfig.json'],
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		// ディレクトリ間の依存の向きを固定する
		// common <- file / image / download <- proxy <- standalone
		// (standalone/ と standalone.ts はどこからも import しない)
		files: ['src/**/*.ts'],
		rules: {
			'import/no-restricted-paths': ['error', {
				basePath: import.meta.dirname,
				zones: [
					{
						target: './src/common',
						from: './src',
						except: ['./common'],
						message: 'common/ は他のディレクトリに依存できません',
					},
					{
						target: './src/file',
						from: './src',
						except: ['./common', './file'],
						message: 'file/ は common/ にのみ依存できます',
					},
					{
						target: './src/image',
						from: './src',
						except: ['./common', './image'],
						message: 'image/ は common/ にのみ依存できます',
					},
					{
						target: './src/download',
						from: './src',
						except: ['./common', './download'],
						message: 'download/ は common/ にのみ依存できます',
					},
					{
						target: './src/proxy',
						from: './src',
						except: ['./common', './file', './image', './download', './proxy'],
						message: 'proxy/ は common/ / file/ / image/ / download/ にのみ依存できます',
					},
					{
						target: './src/index.ts',
						from: ['./src/standalone', './src/standalone.ts'],
						message: 'スタンドアロン版専用のモジュールはサブパス (./standalone) からのみ公開します',
					},
				],
			}],
		},
	},
];
