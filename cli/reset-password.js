const mongo = require('mongodb');
const bcrypt = require('bcryptjs');
const User = require('../built/models/user').default;

const args = process.argv.slice(2);

const user = args[0];

const q = user.startsWith('@') ? {
	username: user.split('@')[1],
	host: user.split('@')[2] || null
} : { _id: new mongo.ObjectID(user) };

console.log(`Resetting password for ${user}...`);

const passwd = 'yo';

// Generate hash of password
const hash = bcrypt.hashSync(passwd);

User.update(q, {
	$set: {
		password: hash
	}
}).then(() => {
	console.log(`Password of ${user} is now '${passwd}'`);
}, e => {
	console.error(e);
});
