const uuid = require('uuid');
const { default: User } = require('../../built/api/models/user')
const { default: zip } = require('@prezzemolo/zip')

const home = {
	left: [
		'profile',
		'calendar',
		'activity',
		'rss-reader',
		'trends',
		'photo-stream',
		'version'
	],
	right: [
		'broadcast',
		'notifications',
		'user-recommendation',
		'recommended-polls',
		'server',
		'donation',
		'nav',
		'tips'
	]
};


const migrate = async (doc) => {

	//#region Construct home data
	const homeData = [];

	home.left.forEach(widget => {
		homeData.push({
			name: widget,
			id: uuid(),
			place: 'left',
			data: {}
		});
	});

	home.right.forEach(widget => {
		homeData.push({
			name: widget,
			id: uuid(),
			place: 'right',
			data: {}
		});
	});
	//#endregion

	const result = await User.update(doc._id, {
		$unset: {
			data: ''
		},
		$set: {
			'settings': {},
			'client_settings.home': homeData,
			'client_settings.show_donation': false
		}
	})

	return added && result.ok === 1
}

async function main() {
	const count = await db.get('users').count();

	console.log(`there are ${count} users.`)

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const docs = await db.get('users').find({}, { limit: dop, skip: time * dop })
			return Promise.all(docs.map(migrate))
		},
		idop
	).then(a => {
		const rv = []
		a.forEach(e => rv.push(...e))
		return rv
	})
}

main().then(console.dir).catch(console.error)
