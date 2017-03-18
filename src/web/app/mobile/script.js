/**
 * Mobile Client
 */

// Style
import './style.styl';

require('./tags');
import boot from '../boot';
import route from './router';

/**
 * Boot
 */
boot(me => {
	// http://qiita.com/junya/items/3ff380878f26ca447f85
	document.body.setAttribute('ontouchstart', '');

	// Start routing
	route(me);
});
