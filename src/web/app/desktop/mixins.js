const riot = require('riot');

module.exports = me => {
	if (me) require('./scripts/stream')(me);

	require('./scripts/user-preview');
	require('./scripts/open-window');

	riot.mixin('notify', {
		notify: require('./scripts/notify')
	});

	const dialog = require('./scripts/dialog');

	riot.mixin('dialog', {
		dialog: dialog
	});

	riot.mixin('NotImplementedException', {
		NotImplementedException: () => {
			return dialog('<i class="fa fa-exclamation-triangle"></i>Not implemented yet', '要求された操作は実装されていません。<br>→<a href="https://github.com/syuilo/misskey" target="_blank">Misskeyの開発に参加する</a>', [{
				text: 'OK'
			}]);
		}
	});

	riot.mixin('input-dialog', {
		inputDialog: require('./scripts/input-dialog')
	});

	riot.mixin('update-avatar', {
		updateAvatar: require('./scripts/update-avatar')
	});

	riot.mixin('update-banner', {
		updateBanner: require('./scripts/update-banner')
	});

	riot.mixin('autocomplete', {
		Autocomplete: require('./scripts/autocomplete')
	});
};
