const riot = require('riot');

module.exports = me => {
	riot.mixin('i', {
		init: function() {
			this.I = me;
			this.SIGNIN = me != null;

			if (this.SIGNIN) {
				this.on('mount', () => {
					me.on('updated', this.update);
				});
				this.on('unmount', () => {
					me.off('updated', this.update);
				});
			}
		},
		me: me
	});
};
