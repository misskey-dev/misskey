import { createPostgreConnection } from './postgre';
import { entities } from '../services/chart/entities';

export function initChartPostgre() {
	return createPostgreConnection(entities, 'charts');
}
