/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FX_checker } from './fxs/checker.js';
import { FX_chromaticAberration } from './fxs/chromaticAberration.js';
import { FX_colorAdjust } from './fxs/colorAdjust.js';
import { FX_colorClamp } from './fxs/colorClamp.js';
import { FX_colorClampAdvanced } from './fxs/colorClampAdvanced.js';
import { FX_distort } from './fxs/distort.js';
import { FX_polkadot } from './fxs/polkadot.js';
import { FX_glitch } from './fxs/glitch.js';
import { FX_grayscale } from './fxs/grayscale.js';
import { FX_invert } from './fxs/invert.js';
import { FX_mirror } from './fxs/mirror.js';
import { FX_stripe } from './fxs/stripe.js';
import { FX_threshold } from './fxs/threshold.js';
import { FX_watermarkPlacement } from './fxs/watermarkPlacement.js';
import { FX_zoomLines } from './fxs/zoomLines.js';
import type { ImageEffectorFx } from './ImageEffector.js';

export const FXS = [
	FX_watermarkPlacement,
	FX_chromaticAberration,
	FX_glitch,
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
] as const satisfies ImageEffectorFx<string, any>[];
