import { DataSource } from 'typeorm';
import { loadConfig } from './packages/backend/built/config.js';

async function updateNoteDates() {
    const config = loadConfig();
    
    const dataSource = new DataSource({
        type: 'postgres',
        host: config.db.host,
        port: config.db.port,
        username: config.db.user,
        password: config.db.pass,
        database: config.db.db,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected!');

        // 1. 사용자 목록 보기
        const users = await dataSource.query('SELECT id, username FROM "user" LIMIT 10');
        console.log('\n📋 Users:');
        users.forEach(u => console.log(`  - ${u.username} (${u.id})`));

        // 2. 사용자 선택 (첫 번째 사용자)
        const userId = users[0].id;
        console.log(`\n🎯 Using user: ${users[0].username} (${userId})`);

        // 3. 최근 노트 확인
        const recentNotes = await dataSource.query(`
            SELECT id, text, "createdAt" 
            FROM note 
            WHERE "userId" = $1 
            ORDER BY "createdAt" DESC 
            LIMIT 5
        `, [userId]);
        
        console.log('\n📝 Recent notes:');
        recentNotes.forEach(n => console.log(`  - ${n.text?.substring(0, 50)} (${n.createdAt})`));

        // 4. 최근 3개 노트를 3일 전으로 변경
        if (recentNotes.length > 0) {
            const result = await dataSource.query(`
                UPDATE note 
                SET "createdAt" = NOW() - INTERVAL '3 days'
                WHERE id IN (
                    SELECT id FROM note 
                    WHERE "userId" = $1 
                    ORDER BY "createdAt" DESC 
                    LIMIT 3
                )
            `, [userId]);

            console.log(`\n✅ Updated ${result[1]} notes to 3 days ago!`);

            // 5. 변경된 노트 확인
            const updatedNotes = await dataSource.query(`
                SELECT id, text, "createdAt" 
                FROM note 
                WHERE "userId" = $1 
                ORDER BY "createdAt" DESC 
                LIMIT 5
            `, [userId]);
            
            console.log('\n📝 After update:');
            updatedNotes.forEach(n => console.log(`  - ${n.text?.substring(0, 50)} (${n.createdAt})`));
        } else {
            console.log('\n⚠️  No notes found. Please create some notes first!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await dataSource.destroy();
        console.log('\n👋 Database connection closed.');
    }
}

updateNoteDates();
