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
	...dependencyRules(),
];

/**
 * src/ 以下のディレクトリ間の依存の向きを固定する
 *
 * common <- file / image / download <- proxy <- standalone
 * common / image <- video
 * (standalone/ と video/ はそれぞれのサブパスからのみ公開し、他のディレクトリからは import しない)
 *
 * src/ 内の import はすべて @/ で書く (相対パスを禁止する) ので、import 先の文字列だけで判定できる
 */
function dependencyRules() {
	const relativeImport = {
		group: ['./*', '../*'],
		message: 'src/ 内のモジュールは @/ で参照してください',
	};

	/** @type {Record<string, { files: string[], allowed?: string[], denied?: string[], message: string }>} */
	const layers = {
		common: { files: ['src/common/**/*.ts'], allowed: ['common'], message: 'common/ は他のディレクトリに依存できません' },
		file: { files: ['src/file/**/*.ts'], allowed: ['common', 'file'], message: 'file/ は common/ にのみ依存できます' },
		image: { files: ['src/image/**/*.ts'], allowed: ['common', 'image'], message: 'image/ は common/ にのみ依存できます' },
		download: { files: ['src/download/**/*.ts'], allowed: ['common', 'download'], message: 'download/ は common/ にのみ依存できます' },
		proxy: { files: ['src/proxy/**/*.ts'], allowed: ['common', 'file', 'image', 'download', 'proxy'], message: 'proxy/ は common/ / file/ / image/ / download/ にのみ依存できます' },
		video: { files: ['src/video/**/*.ts'], allowed: ['common', 'image', 'video'], message: 'video/ は common/ / image/ にのみ依存できます' },
		standalone: { files: ['src/standalone/**/*.ts'], denied: ['@/video', '@/video.js', '@/index.js', '@/standalone.js'], message: 'standalone/ は video/ とエントリーポイントに依存できません' },
		index: { files: ['src/index.ts'], denied: ['@/standalone', '@/standalone.js', '@/video', '@/video.js'], message: 'スタンドアロン版専用のモジュールと動画の処理は、それぞれのサブパスからのみ公開します' },
		standaloneEntry: { files: ['src/standalone.ts'], denied: ['@/video', '@/video.js'], message: '動画の処理はサブパス (./video) からのみ公開します' },
		videoEntry: { files: ['src/video.ts'], denied: ['@/standalone', '@/standalone.js'], message: 'スタンドアロン版専用のモジュールはサブパス (./standalone) からのみ公開します' },
	};

	return Object.values(layers).map(({ files, allowed, denied, message }) => ({
		files,
		rules: {
			'no-restricted-imports': ['error', {
				patterns: [
					relativeImport,
					{
						// gitignore 形式: '@/*' で @/ 直下をすべて禁止し、'!@/<dir>' で許可するディレクトリを戻す
						group: allowed != null ? ['@/*', ...allowed.map(dir => `!@/${dir}`)] : denied,
						message,
					},
				],
			}],
		},
	}));
}

