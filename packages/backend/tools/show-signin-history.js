"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@/models/index");
// node built/tools/show-signin-history username
//  => {Success} {Date} {IPAddrsss}
// node built/tools/show-signin-history username user-agent,x-forwarded-for
//  with user-agent and x-forwarded-for
// node built/tools/show-signin-history username all
//  with full request headers
async function main(username, headers) {
    const user = await index_1.Users.findOne({
        host: null,
        usernameLower: username.toLowerCase(),
    });
    if (user == null)
        throw new Error('User not found');
    const history = await index_1.Signins.find({
        userId: user.id
    });
    for (const signin of history) {
        console.log(`${signin.success ? 'OK' : 'NG'} ${signin.createdAt ? signin.createdAt.toISOString() : 'Unknown'} ${signin.ip}`);
        // headers
        if (headers != null) {
            for (const key of Object.keys(signin.headers)) {
                if (headers.includes('all') || headers.includes(key)) {
                    console.log(`   ${key}: ${signin.headers[key]}`);
                }
            }
        }
    }
}
// get args
const args = process.argv.slice(2);
let username = args[0];
let headers;
if (args[1] != null) {
    headers = args[1].split(/,/).map(header => header.toLowerCase());
}
// normalize args
username = username.replace(/^@/, '');
main(username, headers).then(() => {
    process.exit(0);
}).catch(e => {
    console.warn(e);
    process.exit(1);
});
//# sourceMappingURL=show-signin-history.js.map