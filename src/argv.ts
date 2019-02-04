import * as program from 'commander';
import * as pkg from '../package.json';

program
	.version(pkg.version)
	.option('--no-daemons', 'Disable daemon processes (for debbuging)')
	.option('--disable-clustering', 'Disable clustering')
	.option('--disable-queue', 'Disable job queue')
	.option('--quiet', 'Suppress all logs')
	.option('--verbose', 'Enable all logs')
	.option('--slow', 'Delay all requests (for debbuging)')
	.parse(process.argv);

export { program };
