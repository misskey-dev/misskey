// for Node.js interpret

const { default: db } = require('../../built/db/mongodb')
const { default: DriveFile, getGridFSBucket } = require('../../built/api/models/drive-file')
const { Duplex } = require('stream')

const writeToGridFS = (bucket, buffer, ...rest) => new Promise((resolve, reject) => {
	const writeStream = bucket.openUploadStreamWithId(...rest)

	const dataStream = new Duplex()
	dataStream.push(buffer)
	dataStream.push(null)

	writeStream.once('finish', resolve)
	writeStream.on('error', reject)

	dataStream.pipe(writeStream)
})

const migrateToGridFS = async (doc) => {
	const id = doc._id
	const buffer = doc.data ? doc.data.buffer : Buffer.from([0x00]) // アップロードのバグなのか知らないけどなぜか data が存在しない drive_file ドキュメントがまれにあることがわかったので
	const created_at = doc.created_at
	const name = doc.name

	delete doc._id
	delete doc.created_at
	delete doc.datasize
	delete doc.hash
	delete doc.data
	delete doc.name

	const bucket = await getGridFSBucket()
	const added = await writeToGridFS(bucket, buffer, id, name, { metadata: doc })

	const result = await DriveFile.update(id, {
		$set: {
			uploadDate: created_at
		}
	})

	return added && result.ok === 1
}

async function main() {
	let i = 0;

	const count = await db.get('drive_files').count({});

	const iterate = async () => {
		if (i == count) return true;
		const doc = await db.get('drive_files').find({}, { limit: 1, skip: i })
		const res = await migrateToGridFS(doc);
		if (!res) {
			return false;
		} else {
			i++
			return await iterate();
		}
	}

	const res = await iterate();

	if (res) {
		return 'ok';
	} else {
		throw 'something happened';
	}
}

main().then(console.dir).catch(console.error)
