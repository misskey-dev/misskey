import $ from 'cafy';
import User, { ILocalUser } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import getParams from '../../get-params';

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

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	if (ps.id == null && ps.data == null) return rej('you need to set id and data params if home param unset');

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
		deck.columns.filter((c: any) => c.type == 'widgets').forEach((c: any) => {
			c.widgets.forEach((w: any) => {
				if (w.id == ps.id) widget = w;
			});
		});
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

		res();
	} else {
		rej('widget not found');
	}
});
