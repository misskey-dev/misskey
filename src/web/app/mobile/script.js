/**
 * Mobile Client
 */

require('./tags');
const boot = require('../boot.js');
const mixins = require('./mixins.ls');
const route = require('./router.ls');

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
