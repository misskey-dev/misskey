import { updateQuestion } from '@/remote/activitypub/models/question';

async function main(uri: string): Promise<any> {
	return await updateQuestion(uri);
}

const args = process.argv.slice(2);
const uri = args[0];

main(uri).then(result => {
	console.log(`Done: ${result}`);
}).catch(e => {
	console.warn(e);
});
