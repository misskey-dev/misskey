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
				id: number;
				type: 'owner' | 'collaborator' | 'contributor';
				session: string;
			}
		} = {};
		contributors = contributors.concat(data.owners
			.filter(x => !contributors[x.id])
			.map(x => ({
				id: x.id,
				type: 'owner',
				session
			})));
		contributors = contributors.concat(data.collaborators
			.filter(x => !contributors[x.id])
			.map(x => ({
				id: x.id,
				type: 'collaborator',
				session
			})));
		contributors = contributors.concat(data.contributors
			.filter(x => !contributors[x.id])
			.map(x => ({
				id: x.id,
				type: 'contributor',
				session
			})));
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
