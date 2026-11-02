/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { isCheckableDeclarationFile } from './check-dts.mjs';

const rootDir = '/repo';

test('detects repository-owned declaration files that should be checked', () => {
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/@types/theme.d.ts`, rootDir), true);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/src/utility/virtual.d.ts`, rootDir), true);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/backend/test/global.d.ts`, rootDir), true);
});

test('ignores declarations outside the repository-owned surface', () => {
	assert.equal(isCheckableDeclarationFile(`${rootDir}/node_modules/@types/node/index.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/node_modules/@types/foo/index.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/node_modules/.pnpm/typescript/lib/lib.dom.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/misskey-js/built/index.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend-shared/js-built/i18n.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/src/theme.ts`, rootDir), false);
});
