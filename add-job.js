const Bull = require('bullmq');
const q = new Bull.Queue('system', {connection: {host: 'redis', port: 6379}});
q.add('autoDeleteNotes', {}).then(() => {
  console.log('Job added');
  process.exit(0);
});
