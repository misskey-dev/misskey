/**
 * Developer Center
 */

// Style
import './style.styl';

require('./tags');
import init from '../init';
const route = require('./router');

/**
 * init
 */
init(me => {
	// Start routing
	route(me);
});
