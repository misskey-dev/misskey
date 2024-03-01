import { execa } from 'execa';

const __dirname = new URL('.', import.meta.url).pathname;

(async () => {
  await execa('npm', ['run', 'clean'], {
    cwd: __dirname + '/../',
    stdout: process.stdout,
    stderr: process.stderr,
  });

  await execa('npm', ['run', 'build'], {
    cwd: __dirname + '/../packages/frontend',
    stdout: process.stdout,
    stderr: process.stderr,
  });

  global.ps1 = execa('npm', ['run', 'watch'], {
    cwd: __dirname + '/../packages/frontend',
    stdout: process.stdout,
    stderr: process.stderr,
  });

  global.ps2 = execa('npx', ['gulp', 'watch'], {
    cwd: __dirname + '/../',
    stdout: process.stdout,
    stderr: process.stderr,
  });

  global.ps3 = execa('npm', ['run', 'watch'], {
    cwd: __dirname + '/../packages/backend',
    stdout: process.stdout,
    stderr: process.stderr,
  });

  global.ps4 = execa('npm', ['run', 'watch'], {
    cwd: __dirname + '/../packages/sw',
    stdout: process.stdout,
    stderr: process.stderr,
  });


  const start = async () => {
    try {
      global.ps5 = await execa('npm', ['run', 'start'], {
        cwd: __dirname + '/../',
        stdout: process.stdout,
        stderr: process.stderr,
      });
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      start();
    }
  };

  start();
})();

// 全てのプロセスを終了する
process.on('SIGINT', () => {
  global.ps1?.kill();
  global.ps2?.kill();
  global.ps3?.kill();
  global.ps4?.kill();
  global.ps5?.kill();
  process.exit();
});

