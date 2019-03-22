import { Meta } from '../models/meta';
import { Metas } from '../models';

export default async function(): Promise<Meta> {
	const meta = await Metas.findOne();
	if (meta) {
		return meta;
	} else {
		return Metas.save({});
	}
}
