import { execa } from "execa";
import * as os from 'os';
const __dirname = new URL('.', import.meta.url).pathname;

(async () => {

  console.log('building packages/frontend ...');

  const out1 = await execa('npm', ['run', 'build'], {
    cwd: __dirname + '/../packages/frontend',
    stdout: process.stdout,
    stderr: process.stderr,
  });
  if (out1.failed) {
    console.error(out1);
    os.exit(1);
    return;
  }

  console.log('building packages/backend ...');

  const out2 = await execa('npm', ['run', 'build'], {
    cwd: __dirname + '/../packages/backend',
    stdout: process.stdout,
    stderr: process.stderr,
  });
  if (out2.failed) {
    console.error(out2);
    os.exit(1);
    return;
  }

  console.log('building packages/sw ...');

  const out3 = await execa('npm', ['run', 'build'], {
    cwd: __dirname + '/../packages/sw',
    stdout: process.stdout,
    stderr: process.stderr,
  });
  if (out3.failed) {
    console.error(out3);
    os.exit(1);
    return;
  }

  console.log('build finishing ...');

  const out4 = await execa('npm', ['run', 'gulp'], {
    cwd: __dirname + '/../',
    stdout: process.stdout,
    stderr: process.stderr,
  });
  if (out4.failed) {
    console.error(out4);
    os.exit(1);
    return;
  }
})();

