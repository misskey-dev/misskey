import { QueryFailedError } from 'typeorm';

export function isDuplicateKeyValueError(e: unknown | Error): boolean {
	return e instanceof QueryFailedError && e.driverError.code === '23505';
}
