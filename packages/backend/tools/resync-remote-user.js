"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgre_1 = require("@/db/postgre");
const Acct = require("misskey-js/built/acct");
async function main(acct) {
    await (0, postgre_1.initDb)();
    const { resolveUser } = await Promise.resolve().then(() => require('@/remote/resolve-user'));
    const { username, host } = Acct.parse(acct);
    await resolveUser(username, host, {}, true);
}
// get args
const args = process.argv.slice(2);
let acct = args[0];
// normalize args
acct = acct.replace(/^@/, '');
// check args
if (!acct.match(/^\w+@\w/)) {
    throw `Invalid acct format. Valid format are user@host`;
}
console.log(`resync ${acct}`);
main(acct).then(() => {
    console.log('Done');
}).catch(e => {
    console.warn(e);
});
//# sourceMappingURL=resync-remote-user.js.map