import Vue from 'vue';

import userPreview from './user-preview';
import autocomplete from './autocomplete';
import size from './size';

Vue.directive('autocomplete', autocomplete);
Vue.directive('userPreview', userPreview);
Vue.directive('user-preview', userPreview);
Vue.directive('size', size);
