"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgre_1 = require("../db/postgre");
const typeorm_1 = require("typeorm");
const user_1 = require("@/models/entities/user");
async function main(username) {
    if (!username)
        throw `username required`;
    username = username.replace(/^@/, '');
    await (0, postgre_1.initDb)();
    const Users = (0, typeorm_1.getRepository)(user_1.User);
    const res = await Users.update({
        usernameLower: username.toLowerCase(),
        host: null
    }, {
        isAdmin: true
    });
    if (res.affected !== 1) {
        throw 'Failed';
    }
}
const args = process.argv.slice(2);
main(args[0]).then(() => {
    console.log('Success');
    process.exit(0);
}).catch(e => {
    console.error(`Error: ${e.message || e}`);
    process.exit(1);
});
//# sourceMappingURL=mark-admin.js.map