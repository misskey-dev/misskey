import $ from 'cafy';
import User from '../../../../models/user';
import event from '../../../../publishers/stream';

module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'id' parameter
	const [id, idErr] = $.str.get(params.id);
	if (idErr) return rej('invalid id param');

	// Get 'data' parameter
	const [data, dataErr] = $.obj.get(params.data);
	if (dataErr) return rej('invalid data param');

	if (id == null && data == null) return rej('you need to set id and data params if home param unset');

	let widget;

	//#region Desktop home
	if (widget == null && user.clientSettings.home) {
		const desktopHome = user.clientSettings.home;
		widget = desktopHome.find(w => w.id == id);
		if (widget) {
				widget.data = data;

			await User.update(user._id, {
				$set: {
					'clientSettings.home': desktopHome
				}
			});
		}
	}
	//#endregion

	//#region Mobile home
	if (widget == null && user.clientSettings.mobileHome) {
		const mobileHome = user.clientSettings.mobileHome;
		widget = mobileHome.find(w => w.id == id);
		if (widget) {
				widget.data = data;

			await User.update(user._id, {
				$set: {
					'clientSettings.mobileHome': mobileHome
				}
			});
		}
	}
	//#endregion

	//#region Deck
	if (widget == null && user.clientSettings.deck && user.clientSettings.deck.columns) {
		const deck = user.clientSettings.deck;
		deck.columns.filter(c => c.type == 'widgets').forEach(c => {
			c.widgets.forEach(w => {
				if (w.id == id) widget = w;
			});
		});
		if (widget) {
				widget.data = data;

			await User.update(user._id, {
				$set: {
					'clientSettings.deck': deck
				}
			});
		}
	}
	//#endregion

	if (widget) {
		event(user._id, 'widgetUpdated', {
			id, data
		});

		res();
	} else {
		rej('widget not found');
	}
});
