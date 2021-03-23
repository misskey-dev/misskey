import { Emojis } from '../models';
import { genId } from '@/misc/gen-id';

async function main(name: string, url: string, alias?: string): Promise<any> {
	const aliases = alias != null ? [ alias ] : [];

	await Emojis.save({
		id: genId(),
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

if (!name) throw new Error('require name');
if (!url) throw new Error('require url');

main(name, url).then(() => {
	console.log('success');
	process.exit(0);
}).catch(e => {
	console.warn(e);
	process.exit(1);
});
