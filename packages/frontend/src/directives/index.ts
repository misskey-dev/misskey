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

export default function(app: App) {
	app.directive('userPreview', userPreview);
	app.directive('user-preview', userPreview);
	app.directive('get-size', getSize);
	app.directive('ripple', ripple);
	app.directive('tooltip', tooltip);
	app.directive('hotkey', hotkey);
	app.directive('appear', appear);
	app.directive('anim', anim);
	app.directive('click-anime', clickAnime);
	app.directive('panel', panel);
	app.directive('adaptive-border', adaptiveBorder);
	app.directive('adaptive-bg', adaptiveBg);
}
