/**
 * Developer Center
 */

// Style
import './style.styl';

require('./tags');
import init from '../init';
import route from './router';

/**
 * init
 */
init(me => {
	// Start routing
	route(me);
});
