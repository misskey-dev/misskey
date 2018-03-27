const { default: User } = require('../../built/api/models/user');
const { generate } = require('../../built/crypto_key');

const updates = [];

User.find({}).each(function(user) {
	updates.push(User.update({ _id: user._id }, {
		$set: {
			'account.keypair': generate(),
		}
	}));
}).then(function () {
	Promise.all(updates)
}).then(process.exit);
