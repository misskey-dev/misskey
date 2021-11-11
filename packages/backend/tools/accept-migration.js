"use strict";
// ex) node built/tools/accept-migration Yo 1000000000001
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const index_1 = require("@/config/index");
(0, typeorm_1.createConnection)({
    type: 'postgres',
    host: index_1.default.db.host,
    port: index_1.default.db.port,
    username: index_1.default.db.user,
    password: index_1.default.db.pass,
    database: index_1.default.db.db,
    extra: index_1.default.db.extra,
    synchronize: false,
    dropSchema: false,
}).then(c => {
    c.query(`INSERT INTO migrations(timestamp,name) VALUES (${process.argv[3]}, '${process.argv[2]}${process.argv[3]}');`).then(() => {
        console.log('done');
        process.exit(0);
    }).catch(e => {
        console.log('ERROR:');
        console.log(e);
        process.exit(1);
    });
});
//# sourceMappingURL=accept-migration.js.map