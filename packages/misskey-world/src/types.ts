/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type WorldAvatar = {
	type: 'default';
	body: {
		color: [number, number, number];
		roughness: number;
		metallic: number;
	};
	eyes: {
		type: string;
		color: [number, number, number];
	};
	mouth: {
		type: string;
		color: [number, number, number];
	};
	accessories: {
		type: string;
	}[];
};
