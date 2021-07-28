import { Antennas } from '../models';
import { Antenna } from '../models/entities/antenna';
import { subsdcriber } from '../db/redis';

let antennasFetched = false;
let antennas: Antenna[] = [];

export async function getAntennas() {
	if (!antennasFetched) {
		antennas = await Antennas.find();
		antennasFetched = true;
	}

	return antennas;
}

subsdcriber.on('message', async (_, data) => {
	const obj = JSON.parse(data);

	if (obj.channel === 'internal') {
		const { type, body } = obj.message;
		switch (type) {
			case 'antennaCreated':
				antennas.push(body);
				break;
			case 'antennaUpdated':
				antennas[antennas.findIndex(a => a.id === body.id)] = body;
				break;
			case 'antennaDeleted':
				antennas = antennas.filter(a => a.id !== body.id);
				break;
			default:
				break;
		}
	}
});
