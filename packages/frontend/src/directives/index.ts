/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { App, Directive } from 'vue';

import { userPreviewDirective } from './user-preview.js';
import { getSizeDirective } from './get-size.js';
import { rippleDirective } from './ripple.js';
import { tooltipDirective } from './tooltip.js';
import { hotkeyDirective } from './hotkey.js';
import { appearDirective } from './appear.js';
import { animDirective } from './anim.js';
import { clickAnimeDirective } from './click-anime.js';
import { panelDirective } from './panel.js';
import { adaptiveBorderDirective } from './adaptive-border.js';
import { adaptiveBgDirective } from './adaptive-bg.js';

export default function(app: App) {
	for (const [key, value] of Object.entries(directives)) {
		app.directive(key, value);
	}
}

export const directives = {
	'userPreview': userPreviewDirective,
	'user-preview': userPreviewDirective,
	'get-size': getSizeDirective,
	'ripple': rippleDirective,
	'tooltip': tooltipDirective,
	'hotkey': hotkeyDirective,
	'appear': appearDirective,
	'anim': animDirective,
	'click-anime': clickAnimeDirective,
	'panel': panelDirective,
	'adaptive-border': adaptiveBorderDirective,
	'adaptive-bg': adaptiveBgDirective,
} as Record<string, Directive>;

declare module 'vue' {
	export interface GlobalDirectives {
		vUserPreview: typeof userPreviewDirective;
		vGetSize: typeof getSizeDirective;
		vRipple: typeof rippleDirective;
		vTooltip: typeof tooltipDirective;
		vHotkey: typeof hotkeyDirective;
		vAppear: typeof appearDirective;
		vAnim: typeof animDirective;
		vClickAnime: typeof clickAnimeDirective;
		vPanel: typeof panelDirective;
		vAdaptiveBorder: typeof adaptiveBorderDirective;
		vAdaptiveBg: typeof adaptiveBgDirective;
	}
}
