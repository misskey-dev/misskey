import Vue from 'vue';

import userPreview from './user-preview';
import autocomplete from './autocomplete';
import size from './size';
import particle from './particle';
import tooltip from './tooltip';

Vue.directive('autocomplete', autocomplete);
Vue.directive('userPreview', userPreview);
Vue.directive('user-preview', userPreview);
Vue.directive('size', size);
Vue.directive('particle', particle);
Vue.directive('tooltip', tooltip);
