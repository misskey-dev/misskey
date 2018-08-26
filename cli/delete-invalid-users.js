const { default: User, deleteUser } = require('../built/models/user');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (user) => {
	try {
		await deleteUser(user._id);
		return true;
	} catch (e) {
		return false;
	}
}

async function main() {
	const count = await User.count({
		uri: /#/
	});

	const dop = 1
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await User.find({
				uri: /#/
			}, {
				limit: dop, skip: time * dop
			})
			return Promise.all(doc.map(migrate))
		},
		idop
	).then(a => [].concat(...a));
}

main().then(console.dir).catch(console.error)
