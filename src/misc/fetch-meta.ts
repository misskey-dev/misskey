import { Meta } from '../models/entities/meta';
import { getConnection } from 'typeorm';

export default async function(): Promise<Meta> {
	return await getConnection().transaction(async transactionalEntityManager => {
		// バグでレコードが複数出来てしまっている可能性があるので新しいIDを優先する
		const meta = await transactionalEntityManager.findOne(Meta, {
			order: {
				id: 'DESC'
			}
		});

		if (meta) {
			return meta;
		} else {
			return await transactionalEntityManager.save(Meta, {
				id: 'x'
			}) as Meta;
		}
	});
}
