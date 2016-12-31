/**
 * Mobile Client
 */

require('./tags.ls');
require('./scripts/sp-slidemenu.js');
const boot = require('../boot.js');
const mixins = require('./mixins.ls');
const route = require('./router.ls');

/**
 * Boot
 */
boot(me => {
	// Register mixins
	mixins(me);

	// Start routing
	route(me);
});
