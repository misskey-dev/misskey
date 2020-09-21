import { App } from 'vue';

import size from './size';
import particle from './particle';
import tooltip from './tooltip';

export default function(app: App) {
	app.directive('size', size);
	app.directive('particle', particle);
	app.directive('tooltip', tooltip);
}
