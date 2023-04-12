import { App } from 'vue';

import userPreview from './user-preview';
import getSize from './get-size';
import ripple from './ripple';
import tooltip from './tooltip';
import hotkey from './hotkey';
import appear from './appear';
import anim from './anim';
import clickAnime from './click-anime';
import panel from './panel';
import adaptiveBorder from './adaptive-border';
import adaptiveBg from './adaptive-bg';
import container from './container';

export default function(app: App) {
	for (const [key, value] of Object.entries(directives)) {
		app.directive(key, value);
	}
}

export const directives = {
	'userPreview': userPreview,
	'user-preview': userPreview,
	'get-size': getSize,
	'ripple': ripple,
	'tooltip': tooltip,
	'hotkey': hotkey,
	'appear': appear,
	'anim': anim,
	'click-anime': clickAnime,
	'panel': panel,
	'adaptive-border': adaptiveBorder,
	'adaptive-bg': adaptiveBg,
	'container': container,
};
