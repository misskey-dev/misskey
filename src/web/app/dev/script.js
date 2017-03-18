/**
 * Developer Center
 */

// Style
import './style.styl';

require('./tags');
import boot from '../boot';
const route = require('./router');

/**
 * Boot
 */
boot(me => {
	// Start routing
	route(me);
});
