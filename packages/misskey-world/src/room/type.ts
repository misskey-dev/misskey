/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { RoomState_InstalledFurniture } from './furniture.js';
import type { CustomMadoriEnvOptions, JapaneseEnvOptions, MuseumEnvOptions, SimpleEnvOptions } from './env.js';

export type RoomState = {
	env: {
		type: 'simple';
		options: SimpleEnvOptions;
	} | {
		type: 'japanese';
		options: JapaneseEnvOptions;
	} | {
		type: 'museum';
		options: MuseumEnvOptions;
	} | {
		type: 'customMadori';
		options: CustomMadoriEnvOptions;
	};
	roomLightColor: [number, number, number];
	installedFurnitures: RoomState_InstalledFurniture[];
	worldScale: number;
};

// TODO: addFileみたいなメソッドを持つクラス化して引き回させた方が便利かもしれない
export type RoomAttachments = {
	files: Misskey.entities.DriveFile[];
};
