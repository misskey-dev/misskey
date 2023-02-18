const { execSync } = require('child_process');
const fs = require('fs');

(async () => {
	fs.rmSync(__dirname + '/../packages/backend/node_modules', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/frontend/node_modules', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/sw/node_modules', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../scripts/node_modules', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../node_modules', { recursive: true, force: true });
	execSync('pnpm store prune', {
		cwd: __dirname + '/../',
		stdio: 'inherit',
	});
})();
