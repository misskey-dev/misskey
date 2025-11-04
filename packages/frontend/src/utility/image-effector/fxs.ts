/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FX_checker } from '../image-compositor-functions/checker.js';
import { FX_chromaticAberration } from '../image-compositor-functions/chromaticAberration.js';
import { FX_colorAdjust } from '../image-compositor-functions/colorAdjust.js';
import { FX_colorClamp } from '../image-compositor-functions/colorClamp.js';
import { FX_colorClampAdvanced } from '../image-compositor-functions/colorClampAdvanced.js';
import { FX_distort } from '../image-compositor-functions/distort.js';
import { FX_polkadot } from '../image-compositor-functions/polkadot.js';
import { FX_tearing } from '../image-compositor-functions/tearing.js';
import { FX_grayscale } from '../image-compositor-functions/grayscale.js';
import { FX_invert } from '../image-compositor-functions/invert.js';
import { FX_mirror } from '../image-compositor-functions/mirror.js';
import { FX_stripe } from '../image-compositor-functions/stripe.js';
import { FX_threshold } from '../image-compositor-functions/threshold.js';
import { FX_zoomLines } from '../image-compositor-functions/zoomLines.js';
import { FX_blockNoise } from '../image-compositor-functions/blockNoise.js';
import { FX_fill } from '../image-compositor-functions/fill.js';
import { FX_blur } from '../image-compositor-functions/blur.js';
import { FX_pixelate } from '../image-compositor-functions/pixelate.js';
import type { ImageEffectorFx } from './ImageEffector.js';

export const FXS = [
	FX_mirror,
	FX_invert,
	FX_grayscale,
	FX_colorAdjust,
	FX_colorClamp,
	FX_colorClampAdvanced,
	FX_distort,
	FX_threshold,
	FX_zoomLines,
	FX_stripe,
	FX_polkadot,
	FX_checker,
	FX_chromaticAberration,
	FX_tearing,
	FX_blockNoise,
	FX_fill,
	FX_blur,
	FX_pixelate,
] as const satisfies ImageEffectorFx<string, any>[];
