import * as childProcess from 'child_process';
import Xev from 'xev';
import Queue from '../misc/queue';

const ev = new Xev();

export default function() {
	const log = new Queue<any>();

	const p = childProcess.fork(__dirname + '/notes-stats-child.js');

	p.on('message', stats => {
		ev.emit('notesStats', stats);
		log.push(stats);
		if (log.length > 100) log.pop();
	});

	ev.on('requestNotesStatsLog', id => {
		ev.emit('notesStatsLog:' + id, log.toArray());
	});

	process.on('exit', code => {
		process.kill(p.pid);
	});

}
