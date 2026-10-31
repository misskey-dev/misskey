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
		// common / image <- video
		// (standalone/ と video/ はそれぞれのサブパスからのみ公開し、他のディレクトリからは import しない)
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
						target: './src/video',
						from: './src',
						except: ['./common', './image', './video'],
						message: 'video/ は common/ / image/ にのみ依存できます',
					},
					{
						target: ['./src/index.ts', './src/video.ts'],
						from: ['./src/standalone', './src/standalone.ts'],
						message: 'スタンドアロン版専用のモジュールはサブパス (./standalone) からのみ公開します',
					},
					{
						target: ['./src/index.ts', './src/standalone', './src/standalone.ts'],
						from: ['./src/video', './src/video.ts'],
						message: '動画の処理はサブパス (./video) からのみ公開します',
					},
				],
			}],
		},
	},
];
