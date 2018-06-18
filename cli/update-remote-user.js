const updatePerson = require('../built/remote/activitypub/models/person').updatePerson;

const args = process.argv.slice(2);
const user = args[0];

console.log(`Updating ${user}...`);

updatePerson(user).then(() => {
	console.log(`Updated ${user}`);
}, e => {
	console.error(e);
});
