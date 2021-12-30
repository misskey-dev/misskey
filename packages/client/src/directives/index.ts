import { App } from 'vue';

import userPreview from './user-preview';
import size from './size';
import getSize from './get-size';
import ripple from './ripple';
import tooltip from './tooltip';
import hotkey from './hotkey';
import appear from './appear';
import anim from './anim';
import stickyContainer from './sticky-container';
import clickAnime from './click-anime';
import panel from './panel';
import adaptiveBorder from './adaptive-border';

export default function(app: App) {
	app.directive('userPreview', userPreview);
	app.directive('user-preview', userPreview);
	app.directive('size', size);
	app.directive('get-size', getSize);
	app.directive('ripple', ripple);
	app.directive('tooltip', tooltip);
	app.directive('hotkey', hotkey);
	app.directive('appear', appear);
	app.directive('anim', anim);
	app.directive('click-anime', clickAnime);
	app.directive('sticky-container', stickyContainer);
	app.directive('panel', panel);
	app.directive('adaptive-border', adaptiveBorder);
}
