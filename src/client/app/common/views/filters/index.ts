import Vue from 'vue';
import * as JSON5 from 'json5';

Vue.filter('json5', x => {
	return JSON5.stringify(x, null, 2);
});

require('./bytes');
require('./number');
require('./user');
require('./note');
