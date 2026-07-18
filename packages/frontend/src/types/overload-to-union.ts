/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type FlattenAndDedup<T> = T extends (...args: infer A) => infer R ? (...args: A) => R : never;

// 10個で足りなかった場合は増やす
export type OverloadToUnion<T> = FlattenAndDedup<T extends {
	(...args: infer A1): infer R1;
	(...args: infer A2): infer R2;
	(...args: infer A3): infer R3;
	(...args: infer A4): infer R4;
	(...args: infer A5): infer R5;
	(...args: infer A6): infer R6;
	(...args: infer A7): infer R7;
	(...args: infer A8): infer R8;
	(...args: infer A9): infer R9;
	(...args: infer A10): infer R10;
} ? (
	((...args: A1) => R1) |
	((...args: A2) => R2) |
	((...args: A3) => R3) |
	((...args: A4) => R4) |
	((...args: A5) => R5) |
	((...args: A6) => R6) |
	((...args: A7) => R7) |
	((...args: A8) => R8) |
	((...args: A9) => R9) |
	((...args: A10) => R10)
) : never>;
