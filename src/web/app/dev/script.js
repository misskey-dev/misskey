/**
 * Developer Center
 */

// Style
//import './style.styl';
require('./style.styl');

require('./tags');
const boot = require('../boot');
const route = require('./router');

/**
 * Boot
 */
boot(me => {
	// Start routing
	route(me);
});
