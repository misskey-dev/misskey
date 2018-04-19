const mongo = require('mongodb');
const User = require('../built/models/user').default;

const args = process.argv.slice(2);

const userId = new mongo.ObjectID(args[0]);

console.log(`Suspending ${userId}...`);

User.update({ _id: userId }, {
	$set: {
		isSuspended: true
	}
}).then(() => {
	console.log(`Suspended ${userId}`);
}, e => {
	console.error(e);
});
