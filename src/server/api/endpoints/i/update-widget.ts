import $ from 'cafy';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		id: {
			validator: $.str
		},

		data: {
			validator: $.obj()
		}
	}
};

export default define(meta, async (ps, user) => {
	if (ps.id == null && ps.data == null) throw new Error('you need to set id and data params if home param unset');

	let widget;

	//#region Desktop home
	if (widget == null && user.clientSettings.home) {
		const desktopHome = user.clientSettings.home;
		widget = desktopHome.find((w: any) => w.id == ps.id);
		if (widget) {
				widget.data = ps.data;

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
		widget = mobileHome.find((w: any) => w.id == ps.id);
		if (widget) {
				widget.data = ps.data;

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
		for (const c of deck.columns.filter((c: any) => c.type == 'widgets')) {
			for (const w of c.widgets.filter((w: any) => w.id == ps.id)) {
				widget = w;
			}
		}
		if (widget) {
				widget.data = ps.data;

			await User.update(user._id, {
				$set: {
					'clientSettings.deck': deck
				}
			});
		}
	}
	//#endregion

	if (widget) {
		publishMainStream(user._id, 'widgetUpdated', {
			id: ps.id, data: ps.data
		});

		return;
	} else {
		throw new Error('widget not found');
	}
});
