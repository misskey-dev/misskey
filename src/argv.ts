import { Command } from 'commander';
import config from '@/config';

const program = new Command();

program
	.version(config.version)
	.option('--no-daemons', 'Disable daemon processes (for debbuging)')
	.option('--disable-clustering', 'Disable clustering')
	.option('--only-server', 'Run server only (without job queue processing)')
	.option('--only-queue', 'Pocessing job queue only (without server)')
	.option('--quiet', 'Suppress all logs')
	.option('--verbose', 'Enable all logs')
	.option('--with-log-time', 'Include timestamp for each logs')
	.option('--slow', 'Delay all requests (for debbuging)')
	.option('--color', 'This option is a dummy for some external program\'s (e.g. forever) issue.')
	.parse(process.argv);

if (process.env.MK_ONLY_QUEUE) program.onlyQueue = true;
if (process.env.NODE_ENV === 'test') program.disableClustering = true;
//if (process.env.NODE_ENV === 'test') program.quiet = true;
if (process.env.NODE_ENV === 'test') program.noDaemons = true;

export { program };
