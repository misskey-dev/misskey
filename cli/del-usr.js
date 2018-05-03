const deleteUser = require('../built/models/user').deleteUser;

const args = process.argv.slice(2);

const userId = args[0];

console.log(`deleting ${userId}...`);

deleteUser(userId).then(() => {
	console.log('done');
}, e => {
	console.error(e);
});
