// for Node.js interpret

const { default: DriveFile, getGridFSBucket } = require('../../built/api/models/drive-file')
const { default: zip } = require('@prezzemolo/zip')

const _gm = require('gm');
const gm = _gm.subClass({
	imageMagick: true
});

const migrate = doc => new Promise(async (res, rej) => {
	const bucket = await getGridFSBucket();

	const readable = bucket.openDownloadStream(doc._id);

	gm(readable)
		.setFormat('ppm')
		.resize(1, 1)
		.toBuffer(async (err, buffer) => {
			if (err) rej(err);
			const r = buffer.readUInt8(buffer.length - 3);
			const g = buffer.readUInt8(buffer.length - 2);
			const b = buffer.readUInt8(buffer.length - 1);

			const result = await DriveFile.update(doc._id, {
				$set: {
					'metadata.properties.average_color': [r, g, b]
				}
			})

			res(result.ok === 1);
		});
});

async function main() {
	const query = {
		contentType: {
			$in: [
				'image/png',
				'image/jpeg'
			]
		}
	}

	const count = await DriveFile.count(query);

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await DriveFile.find(query, {
				limit: dop, skip: time * dop
			})
			return Promise.all(doc.map(migrate))
		},
		idop
	).then(a => {
		const rv = []
		a.forEach(e => rv.push(...e))
		return rv
	})
}

main().then(console.dir).catch(console.error)
