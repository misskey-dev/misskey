import { Command } from 'commander';
import config from '@/config/index';

const program = new Command();

program.version(config.version);
program.option('--no-daemons', 'Disable daemon processes (for debbuging)');
program.option('--disable-clustering', 'Disable clustering');
program.option('--only-server', 'Run server only (without job queue processing)');
program.option('--only-queue', 'Pocessing job queue only (without server)');
program.option('--quiet', 'Suppress all logs');
program.option('--verbose', 'Enable all logs');
program.option('--with-log-time', 'Include timestamp for each logs');
program.option('--slow', 'Delay all requests (for debbuging)');
program.option('--color', 'This option is a dummy for some external program\'s (e.g. forever) issue.');
program.parse(process.argv);

if (process.env.MK_ONLY_QUEUE) program.onlyQueue = true;
if (process.env.NODE_ENV === 'test') program.disableClustering = true;
//if (process.env.NODE_ENV === 'test') program.quiet = true;
if (process.env.NODE_ENV === 'test') program.noDaemons = true;

export { program };
