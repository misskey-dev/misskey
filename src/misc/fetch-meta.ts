import { Meta } from '../models/meta';
import { Metas } from '../models';

export default function(): Promise<Meta> {
	return Metas.findOne();
}
