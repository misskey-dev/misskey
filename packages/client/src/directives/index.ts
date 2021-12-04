import { App } from 'vue';

import userPreview from './user-preview';
import size from './size';
import getSize from './get-size';
import particle from './particle';
import tooltip from './tooltip';
import hotkey from './hotkey';
import appear from './appear';
import anim from './anim';
import stickyContainer from './sticky-container';
import clickAnime from './click-anime';
import panel from './panel';

export default function(app: App) {
	app.directive('userPreview', userPreview);
	app.directive('user-preview', userPreview);
	app.directive('size', size);
	app.directive('get-size', getSize);
	app.directive('particle', particle);
	app.directive('tooltip', tooltip);
	app.directive('hotkey', hotkey);
	app.directive('appear', appear);
	app.directive('anim', anim);
	app.directive('click-anime', clickAnime);
	app.directive('sticky-container', stickyContainer);
	app.directive('panel', panel);
}
