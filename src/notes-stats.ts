import * as childProcess from 'child_process';
import Xev from 'xev';

const ev = new Xev();

export default function() {
	const log = [];

	const p = childProcess.fork(__dirname + '/notes-stats-child.js');

	p.on('message', stats => {
		ev.emit('notesStats', stats);
		log.push(stats);
		if (log.length > 100) log.shift();
	});

	ev.on('requestNotesStatsLog', id => {
		ev.emit('notesStatsLog:' + id, log);
	});
}
