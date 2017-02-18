const riot = require('riot');

riot.mixin('open-window', {
	openWindow: (name, opts) => {
		const window = document.body.appendChild(document.createElement(name));
		return riot.mount(window, opts)[0];
	}
});
