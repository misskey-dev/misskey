// for Node.js interpret

const { default: User } = require('../../../built/models/user');
const { generate } = require('../../../built/crypto_key');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (user) => {
	const result = await User.update(user._id, {
		$unset: {
			email: '',
			links: '',
			password: '',
			token: '',
			twitter: '',
			line: '',
			profile: '',
			last_used_at: '',
			is_bot: '',
			is_pro: '',
			two_factor_secret: '',
			two_factor_enabled: '',
			client_settings: '',
			settings: ''
		},
		$set: {
			host: null,
			host_lower: null,
			account: {
				email: user.email,
				links: user.links,
				password: user.password,
				token: user.token,
				twitter: user.twitter,
				line: user.line,
				profile: user.profile,
				last_used_at: user.last_used_at,
				is_bot: user.is_bot,
				is_pro: user.is_pro,
				two_factor_secret: user.two_factor_secret,
				two_factor_enabled: user.two_factor_enabled,
				client_settings: user.client_settings,
				settings: user.settings,
				keypair: generate()
			}
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
