import { ulid } from 'ulid';
import { Meta } from '../models/entities/meta';
import { Metas } from '../models';

export default async function(): Promise<Meta> {
	const meta = await Metas.findOne();
	if (meta) {
		return meta;
	} else {
		return Metas.save({
			id: ulid()
		});
	}
}
