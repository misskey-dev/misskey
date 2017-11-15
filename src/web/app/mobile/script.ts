/**
 * Mobile Client
 */

// Style
import './style.styl';

require('./tags');
import init from '../init';
import route from './router';
import MiOS from '../common/mios';

/**
 * init
 */
init((mios: MiOS) => {
	// http://qiita.com/junya/items/3ff380878f26ca447f85
	document.body.setAttribute('ontouchstart', '');

	// Start routing
	route(mios);
});
