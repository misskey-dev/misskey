import * as mongo from 'mongodb';
import * as childProcess from 'child_process';
import Contributor from '../models/contributor';
import * as uuid from 'uuid';

export default function() {
	const p = childProcess.fork(__dirname + '/github-data-child.js');

	let lock = false;

	p.on('message', data => {
		const session = uuid();

		let contributors: {
			[key: number]: {
				_id: mongo.ObjectID
				userId: number;
				type: 'owner' | 'collaborator' | 'contributor';
				session: string;
			}
		} = {};
		contributors = Object.assign(data.owners
			.filter((x: any) => !contributors[x.id])
			.map((x: any) => ({
				userId: x.id,
				type: 'owner',
				session
			})), contributors);
		contributors = Object.assign(data.collaborators
			.filter((x: any) => !contributors[x.id])
			.map((x: any) => ({
				userId: x.id,
				type: 'collaborator',
				session
			})), contributors);
		contributors = Object.assign(data.contributors
			.filter((x: any) => !contributors[x.id])
			.map((x: any) => ({
				userId: x.id,
				type: 'contributor',
				session
			})), contributors);
		if (!lock) {
			lock = true;
			Contributor.insert(Object.values(contributors)).then(_ =>
			Contributor.remove({ session: { $ne: session } }).then(_ =>
			lock = false));
		}
	});

	process.on('exit', _ => {
		process.kill(p.pid);
	});
}
