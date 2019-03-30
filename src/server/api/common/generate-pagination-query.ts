import { SelectQueryBuilder } from 'typeorm';

export function generatePaginationQuery<T>(q: SelectQueryBuilder<T>, sinceId: string, untilId: string) {
	if (sinceId) {
		q.where(`${q.alias}.id > :sinceId`, { sinceId: sinceId });
		q.orderBy(`${q.alias}.id`, 'ASC');
	} else if (untilId) {
		q.where(`${q.alias}.id < :untilId`, { untilId: untilId });
		q.orderBy(`${q.alias}.id`, 'DESC');
	} else {
		q.orderBy(`${q.alias}.id`, 'DESC');
	}
	return q;
}
