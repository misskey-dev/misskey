import * as program from 'commander';
import * as pkg from '../package.json';

program
	.version(pkg.version)
	.option('--no-daemons', 'Disable daemon processes (for debbuging)')
	.option('--disable-clustering', 'Disable clustering')
	.option('--disable-queue', 'Disable job queue processing')
	.option('--only-server', 'Run server only (without job queue)')
	.option('--only-queue', 'Pocessing job queue only (without server)')
	.option('--quiet', 'Suppress all logs')
	.option('--verbose', 'Enable all logs')
	.option('--with-log-time', 'Include timestamp for each logs')
	.option('--slow', 'Delay all requests (for debbuging)')
	.option('--color', 'This option is a dummy for some external program\'s (e.g. forever) issue.')
	.parse(process.argv);

/*if (process.env.MK_DISABLE_QUEUE)*/ program.disableQueue = true;
if (process.env.MK_ONLY_QUEUE) program.onlyQueue = true;

export { program };
