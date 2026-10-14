import { RolldownMagicString } from 'rolldown';
import type { Plugin } from 'rolldown';

const cjsSyntaxRegex = /__filename|__dirname|require\(|require\.resolve\(/;

const shimComment = '// -- ESM Shim --';

export function esmShimPlugin(): Plugin {
	return {
		name: 'esm-shim',
		renderChunk(code, _, opts, meta) {
			if (opts.format === 'es') {
				if (code.includes(shimComment) || !cjsSyntaxRegex.test(code)) {
					return null;
				}

				const ast = this.parse(code, {
					sourceType: 'module',
				});

				let lastImportIndex = -1;
				let isFilenameShimmed = false;
				let isDirnameShimmed = false;
				let isRequireShimmed = false;

				for (const [index, node] of ast.body.entries()) {
					switch (node.type) {
						case 'ImportDeclaration':
							lastImportIndex = index;
							break;
						case 'VariableDeclaration':
							for (const decl of node.declarations) {
								if (decl.id.type === 'Identifier') {
									if (decl.id.name === '__filename') {
										isFilenameShimmed = true;
									} else if (decl.id.name === '__dirname') {
										isDirnameShimmed = true;
									} else if (decl.id.name === 'require') {
										isRequireShimmed = true;
									}
								}
							}
							break;
					}
				}

				const shimLines: string[] = [];
				if (!isFilenameShimmed) {
					shimLines.push('const __filename = import.meta.filename;');
				}
				if (!isDirnameShimmed) {
					shimLines.push('const __dirname = import.meta.dirname;');
				}
				if (!isRequireShimmed) {
					shimLines.push('import { createRequire as cjsShimCreateRequire } from \'node:module\';');
					shimLines.push('const require = cjsShimCreateRequire(import.meta.url);');
				}

				if (shimLines.length > 0) {
					const magicString = meta.magicString ?? new RolldownMagicString(code);
					const shimCode = `${shimComment}\n${shimLines.join('\n')}\n`;
					if (lastImportIndex >= 0) {
						const lastImportNode = ast.body[lastImportIndex];
						magicString.appendLeft(lastImportNode.end, `\n${shimCode}`);
					} else {
						magicString.prepend(`${shimCode}\n`);
					}
					return magicString;
				}
			}

			return null;
		},
	};
}
