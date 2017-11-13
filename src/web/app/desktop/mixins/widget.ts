import * as riot from 'riot';

// ミックスインにオプションを渡せないのアレ
// SEE: https://github.com/riot/riot/issues/2434

(riot as any).mixin('widget', {
	init: function() {
		this.mixin('i');
		this.mixin('api');

		this.id = this.opts.id;
		this.place = this.opts.place;

		if (this.data) {
			Object.keys(this.data).forEach(prop => {
				this.data[prop] = this.opts.data.hasOwnProperty(prop) ? this.opts.data[prop] : this.data[prop];
			});
		}
	},

	save: function() {
		this.update();
		this.api('i/update_home', {
			id: this.id,
			data: this.data
		}).then(() => {
			this.I.client_settings.home.find(w => w.id == this.id).data = this.data;
			this.I.update();
		});
	}
});
