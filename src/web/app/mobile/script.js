/**
 * Mobile Client
 */

// Style
//import './style.styl';
require('./style.styl');

require('./tags');
const boot = require('../boot');
const mixins = require('./mixins');
const route = require('./router');

/**
 * Boot
 */
boot(me => {
	// http://qiita.com/junya/items/3ff380878f26ca447f85
	document.body.setAttribute('ontouchstart', '');

	// Register mixins
	mixins(me);

	// Start routing
	route(me);
});
