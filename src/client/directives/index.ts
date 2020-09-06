import { App } from 'vue';

import userPreview from './user-preview';
import autocomplete from './autocomplete';
import size from './size';
import particle from './particle';
import tooltip from './tooltip';

export default function(app: App) {
	app.directive('autocomplete', autocomplete);
	app.directive('userPreview', userPreview);
	app.directive('user-preview', userPreview);
	app.directive('size', size);
	app.directive('particle', particle);
	app.directive('tooltip', tooltip);
}
