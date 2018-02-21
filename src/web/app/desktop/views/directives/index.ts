import Vue from 'vue';

import userPreview from './user-preview';
import autocomplete from './autocomplete';

Vue.directive('userPreview', userPreview);
Vue.directive('user-preview', userPreview);
Vue.directive('autocomplete', autocomplete);
