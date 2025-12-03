/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as checker from '../image-compositor-functions/checker.js';
import * as chromaticAberration from '../image-compositor-functions/chromaticAberration.js';
import * as colorAdjust from '../image-compositor-functions/colorAdjust.js';
import * as colorClamp from '../image-compositor-functions/colorClamp.js';
import * as colorClampAdvanced from '../image-compositor-functions/colorClampAdvanced.js';
import * as distort from '../image-compositor-functions/distort.js';
import * as polkadot from '../image-compositor-functions/polkadot.js';
import * as tearing from '../image-compositor-functions/tearing.js';
import * as grayscale from '../image-compositor-functions/grayscale.js';
import * as invert from '../image-compositor-functions/invert.js';
import * as mirror from '../image-compositor-functions/mirror.js';
import * as stripe from '../image-compositor-functions/stripe.js';
import * as threshold from '../image-compositor-functions/threshold.js';
import * as zoomLines from '../image-compositor-functions/zoomLines.js';
import * as blockNoise from '../image-compositor-functions/blockNoise.js';
import * as fill from '../image-compositor-functions/fill.js';
import * as blur from '../image-compositor-functions/blur.js';
import * as pixelate from '../image-compositor-functions/pixelate.js';
import type { ImageCompositorFunction } from '@/lib/ImageCompositor.js';
import type { ImageEffectorUiDefinition } from './ImageEffector.js';

export const FXS = {
	checker,
	chromaticAberration,
	colorAdjust,
	colorClamp,
	colorClampAdvanced,
	distort,
	polkadot,
	tearing,
	grayscale,
	invert,
	mirror,
	stripe,
	threshold,
	zoomLines,
	blockNoise,
	fill,
	blur,
	pixelate,
} as const satisfies Record<string, {
	readonly fn: ImageCompositorFunction<any>;
	readonly uiDefinition: ImageEffectorUiDefinition<any>;
}>;
