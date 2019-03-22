import { Meta } from '../models/meta';
import { Metas } from '../models';

export default function(): Promise<Meta> {
	return Metas.findOne().then(meta => {
		if (meta) {
			return meta;
		} else {
			return Metas.save({});
		}
	});
}
