import { initDb } from '@/db/postgre';

async function main(uri: string): Promise<any> {
	await initDb();
	const { updateQuestion } = await import('@/remote/activitypub/models/question');

	return await updateQuestion(uri);
}

const args = process.argv.slice(2);
const uri = args[0];

main(uri).then(result => {
	console.log(`Done: ${result}`);
}).catch(e => {
	console.warn(e);
});
