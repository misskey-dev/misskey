const riot = require('riot');

module.exports = me => {
	const i = me ? me.token : null;

	require('./scripts/i')(me);

	riot.mixin('api', {
		api: require('./scripts/api').bind(null, i)
	});

	riot.mixin('cropper', {
		Cropper: require('cropperjs')
	});

	riot.mixin('signout', {
		signout: require('./scripts/signout')
	});

	riot.mixin('messaging-stream', {
		MessagingStreamConnection: require('./scripts/messaging-stream')
	});

	riot.mixin('is-promise', {
		isPromise: require('./scripts/is-promise')
	});

	riot.mixin('get-post-summary', {
		getPostSummary: require('./scripts/get-post-summary')
	});

	riot.mixin('date-stringify', {
		dateStringify: require('./scripts/date-stringify')
	});

	riot.mixin('text', {
		analyze: require('../../../common/text/index'),
		compile: require('./scripts/text-compiler')
	});

	riot.mixin('get-password-strength', {
		getPasswordStrength: require('syuilo-password-strength')
	});

	riot.mixin('ui-progress', {
		Progress: require('./scripts/loading.ls')
	});
};
