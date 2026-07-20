/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { renderFrontendDiagnosticsMarkdown } from '../src/report';

test('combines bundle and browser diagnostics into one markdown report', () => {
	const markdown = renderFrontendDiagnosticsMarkdown('## Bundle\n', '## Browser\n');

	expect(markdown).toBe('# Frontend Diagnostics\n\n## Bundle\n\n## Browser\n');
});
