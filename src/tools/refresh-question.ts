import { updateQuestion } from '../remote/activitypub/models/question';

async function main(uri: string): Promise<any> {
	return await updateQuestion(uri);
}

export default () => {
	const args = process.argv.slice(3);
	const uri = args[0];

	main(uri).then(result => {
		console.log(`Done: ${result}`);
		process.exit(0);
	}).catch(e => {
		console.warn(e);
		process.exit(1);
	});
}
