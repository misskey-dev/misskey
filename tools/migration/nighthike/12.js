// for Node.js interpret

const { default: User } = require('../../../built/models/user');
const { generate } = require('../../../built/crypto_key');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (user) => {
	const result = await User.update(user._id, {
		$unset: {
			account: ''
		},
		$set: {
			host: null,
			hostLower: null,
			email: user.account.email,
			links: user.account.links,
			password: user.account.password,
			token: user.account.token,
			twitter: user.account.twitter,
			line: user.account.line,
			profile: user.account.profile,
			lastUsedAt: user.account.lastUsedAt,
			isBot: user.account.isBot,
			isPro: user.account.isPro,
			twoFactorSecret: user.account.twoFactorSecret,
			twoFactorEnabled: user.account.twoFactorEnabled,
			clientSettings: user.account.clientSettings,
			settings: user.account.settings,
			keypair: user.account.keypair
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
