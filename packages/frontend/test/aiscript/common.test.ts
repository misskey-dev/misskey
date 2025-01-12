/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assertStringAndIsIn } from "@/scripts/aiscript/common.js";
import { values } from "@syuilo/aiscript";
import { describe, expect, test } from "vitest";

describe('AiScript common script', () => {
	test('assertStringAndIsIn', () => {
		expect(
			() => assertStringAndIsIn(values.STR('a'), ['a', 'b'])
		).not.toThrow();
		expect(
			() => assertStringAndIsIn(values.STR('c'), ['a', 'b'])
		).toThrow('"c" is not in "a", "b"');
		expect(() => assertStringAndIsIn(
			values.STR('invalid'),
			['left', 'center', 'right']
		)).toThrow('"invalid" is not in "left", "center", "right"');
	});
});
