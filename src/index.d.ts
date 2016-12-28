import * as mongodb from 'mongodb';
import { IConfig } from './config';

declare var config: IConfig;

declare module NodeJS {
	interface Global {
		config: IConfig;
		db: mongodb.Db;
	}
}
