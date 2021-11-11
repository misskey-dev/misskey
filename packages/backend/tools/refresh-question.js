"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const question_1 = require("@/remote/activitypub/models/question");
async function main(uri) {
    return await (0, question_1.updateQuestion)(uri);
}
const args = process.argv.slice(2);
const uri = args[0];
main(uri).then(result => {
    console.log(`Done: ${result}`);
}).catch(e => {
    console.warn(e);
});
//# sourceMappingURL=refresh-question.js.map