/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { RoomState_InstalledFurniture } from './object.js';

export type RoomState = {
	env: {
		type: 'simple';
		options: SimpleEnvOptions;
	} | {
		type: 'japanese';
		options: JapaneseEnvOptions;
	};
	roomLightColor: [number, number, number];
	installedFurnitures: RoomState_InstalledFurniture[];
	worldScale: number;
};

// TODO: addFileみたいなメソッドを持つクラス化して引き回させた方が便利かもしれない
export type RoomAttachments = {
	files: Misskey.entities.DriveFile[];
};

export type JapaneseEnvOptions = {
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
};

export type SimpleEnvOptions = {
	dimension: [number, number];
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
	walls: Record<'n' | 's' | 'w' | 'e', {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
		withBeam: boolean;
		beamMaterial: null | 'wood' | 'concrete';
		beamColor: [number, number, number];
		withBaseboard: boolean;
	}>;
	pillars: Record<'nw' | 'ne' | 'sw' | 'se', {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
		show: boolean;
	}>;
	flooring: {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
	};
	ceiling: {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
	};
};

export type MuseumEnvOptions = any;
