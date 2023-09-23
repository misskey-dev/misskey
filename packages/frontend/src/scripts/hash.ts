import { SparkMD5 } from 'spark-md5';

export const md5 = (payload: string): string => {
	const hash = new SparkMD5();
	hash.append(payload);
	return hash.end();
};
