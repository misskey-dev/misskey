const mongo = require('mongodb');
const User = require('../built/models/user').default;

const args = process.argv.slice(2);

const user = args[0];

const q = user.startsWith('@') ? {
	username: user.split('@')[1],
	host: user.split('@')[2]
} : { _id: new mongo.ObjectID(user) };

console.log(`Suspending ${user}...`);

User.update(q, {
	$set: {
		isSuspended: true
	}
}).then(() => {
	console.log(`Suspended ${user}`);
}, e => {
	console.error(e);
});
