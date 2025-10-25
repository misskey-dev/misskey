const { DataSource } = require('typeorm');
const ds = new DataSource({type:'postgres',host:'db',port:5432,username:'postgres',password:'postgres',database:'misskey'});

ds.initialize().then(async () => {
  console.log('🔍 Checking for old notes...');

  const notes = await ds.query(`
    SELECT id, text, "userId"
    FROM note
    WHERE "userId" = 'ae82944p2a6v0003'
    ORDER BY id DESC
    LIMIT 5
  `);

  console.log('Admin notes:', notes);
  await ds.destroy();
  process.exit(0);
});
