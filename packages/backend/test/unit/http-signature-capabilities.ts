/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { parseHttpSignatureImplementationLevel, supportsDraftEd25519 } from '@/core/activitypub/misc/http-signature-capabilities.js';

describe('HTTP signature capability markers', () => {
	test.each(['00', '01', '02', '10', '11', '12'] as const)('preserves exact known marker %s', level => {
		expect(parseHttpSignatureImplementationLevel(level)).toBe(level);
	});
	test.each([undefined, null, '', '03', 'x2', '2', 2, ' 02', '02 '])('unknown marker %j is conservative', level => {
		expect(parseHttpSignatureImplementationLevel(level)).toBe('00');
		expect(supportsDraftEd25519(level)).toBe(false);
	});
	test.each(['00', '01', '02', '10', '11', '12'] as const)('permits draft Ed25519 only for 02, marker=%s', level => {
		expect(supportsDraftEd25519(level)).toBe(level === '02');
	});
});
