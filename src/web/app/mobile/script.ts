/**
 * Mobile Client
 */

// Style
import './style.styl';

require('./tags');
import init from '../init';

/**
 * init
 */
init((launch) => {
	// Register directives
	require('./views/directives');

	// http://qiita.com/junya/items/3ff380878f26ca447f85
	document.body.setAttribute('ontouchstart', '');

	// Start routing
	//route(mios);
}, true);
