/**
 * Developer Center
 */

require('./tags.ls');
const boot = require('../boot.ls');
const route = require('./router.ls');

/**
 * Boot
 */
boot(me => {
	// Start routing
	route(me);
});
