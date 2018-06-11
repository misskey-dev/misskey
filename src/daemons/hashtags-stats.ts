import * as childProcess from 'child_process';
import Xev from 'xev';

const ev = new Xev();

export default function() {
	const log = [];

	const p = childProcess.fork(__dirname + '/hashtags-stats-child.js');

	p.on('message', stats => {
		ev.emit('hashtagsStats', stats);
		log.push(stats);
		if (log.length > 30) log.shift();
	});

	ev.on('requestHashTagsStatsLog', id => {
		ev.emit('hashtagsStatsLog:' + id, log);
	});
}
