// for Node.js interpret

const { default: User } = require('../../built/api/models/user');
const { generate } = require('../../built/crypto_key');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (user) => {
	const result = await User.update(user._id, {
		$set: {
			'account.keypair': generate()
		}
	});
	return result.ok === 1;
}

async function main() {
	const count = await User.count({});

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await User.find({}, {
				limit: dop, skip: time * dop
			})
			return Promise.all(doc.map(migrate))
		},
		idop
	).then(a => {
		const rv = []
		a.forEach(e => rv.push(...e))
		return rv
	})
}

main().then(console.dir).catch(console.error)
