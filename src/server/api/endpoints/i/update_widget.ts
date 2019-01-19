import $ from 'cafy';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import define from '../../define';
import { ObjectID } from 'mongodb';
import { errorWhen } from '../../../../prelude/promise';

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

type WidgetData = { [x: string]: any };

type Widget = {
	id: string,
	data: WidgetData
};

type Column = {
	type: string,
	widgets: Widget[]
};

type Deck = { columns: Column[] };

const update = async (widget: Widget, userId: ObjectID, data: WidgetData, home: any, name: string) => {
	if (widget) {
		widget.data = data;
		await User.update(userId, {
			$set: { [name]: home }
		});
	}
	return widget;
};

const updateHomeWidget = (id: string, userId: ObjectID, data: WidgetData, home: Widget[], name: string) =>
	update(home.find(x => x.id === id), userId, data, home, name);

const updateDeckWidget = (id: string, userId: ObjectID, data: WidgetData, deck: Deck) =>
	update(deck.columns
		.filter(x => x.type === 'widgets').reduce((a, c) => a || c.widgets
			.filter(x => x.id === id).reduce((a, c) => a || c), null as Widget), userId, data, deck, 'clientSettings.deck');

export default define(meta, (ps, user) => errorWhen(
	!ps.id && !ps.data,
	'you need to set id and data params if home param unset')
	.then(() => errorWhen(!Object.entries({
			'clientSettings.home': user.clientSettings.home,
			'clientSettings.mobileHome': user.clientSettings.mobileHome
		}).filter(([, x]) => x)
			.reduce(
				(a, [k, v]) => a.then(x => x || !v ? Promise.resolve(x) :
					updateHomeWidget(ps.id, user._id, ps.data, v, k)),
				Promise.resolve(null as Widget))
			.then(x => x || !user.clientSettings.deck || !user.clientSettings.deck.columns ? Promise.resolve(x) :
				updateDeckWidget(ps.id, user._id, ps.data, user.clientSettings.deck)), 'widget not found'))
	.then(_ => (publishMainStream(user._id, 'widgetUpdated', {
			id: ps.id,
			data: ps.data
		}), _)));
