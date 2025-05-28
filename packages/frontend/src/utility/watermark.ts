/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';

export type WatermarkPreset = {
	id: string;
	name: string;
	layers: ({
		id: string;
		type: 'text';
		text: string;
		repeat: boolean;
		scale: number;
		align: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom' };
		opacity: number;
	} | {
		id: string;
		type: 'image';
		imageUrl: string | null;
		imageId: string | null;
		cover: boolean;
		repeat: boolean;
		scale: number;
		align: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom' };
		opacity: number;
	})[];
};

export function makeImageEffectorLayers(layers: WatermarkPreset['layers']): ImageEffectorLayer[] {
	return layers.map(layer => {
		if (layer.type === 'text') {
			return {
				fxId: 'watermarkPlacement',
				id: layer.id,
				params: {
					repeat: layer.repeat,
					scale: layer.scale,
					align: layer.align,
					opacity: layer.opacity,
					cover: false,
				},
				text: layer.text,
				imageUrl: null,
			};
		} else {
			return {
				fxId: 'watermarkPlacement',
				id: layer.id,
				params: {
					repeat: layer.repeat,
					scale: layer.scale,
					align: layer.align,
					opacity: layer.opacity,
					cover: layer.cover,
				},
				text: null,
				imageUrl: layer.imageUrl ?? null,
			};
		}
	});
}
