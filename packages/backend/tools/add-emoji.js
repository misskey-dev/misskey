"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@/models/index");
const gen_id_1 = require("@/misc/gen-id");
async function main(name, url, alias) {
    const aliases = alias != null ? [alias] : [];
    await index_1.Emojis.save({
        id: (0, gen_id_1.genId)(),
        host: null,
        name,
        url,
        aliases,
        updatedAt: new Date()
    });
}
const args = process.argv.slice(2);
const name = args[0];
const url = args[1];
if (!name)
    throw new Error('require name');
if (!url)
    throw new Error('require url');
main(name, url).then(() => {
    console.log('success');
    process.exit(0);
}).catch(e => {
    console.warn(e);
    process.exit(1);
});
//# sourceMappingURL=add-emoji.js.map