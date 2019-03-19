import * as mongo from 'mongodb';
import { deepcopy } from '../misc/deepcopy';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import { pack as packUser } from './user';

const AbuseUserReport = db.get<IAbuseUserReport>('abuseUserReports');
AbuseUserReport.createIndex('userId');
AbuseUserReport.createIndex('reporterId');
AbuseUserReport.createIndex(['userId', 'reporterId'], { unique: true });
export default AbuseUserReport;

export interface IAbuseUserReport {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	reporterId: mongo.ObjectID;
	comment: string;
}

export const packMany = (
	reports: (string | mongo.ObjectID | IAbuseUserReport)[]
) => {
	return Promise.all(reports.map(x => pack(x)));
};

export const pack = (
	report: any
) => new Promise<any>(async (resolve, reject) => {
	let _report: any;

	if (isObjectId(report)) {
		_report = await AbuseUserReport.findOne({
			_id: report
		});
	} else if (typeof report === 'string') {
		_report = await AbuseUserReport.findOne({
			_id: new mongo.ObjectID(report)
		});
	} else {
		_report = deepcopy(report);
	}

	// Rename _id to id
	_report.id = _report._id;
	delete _report._id;

	_report.reporter = await packUser(_report.reporterId, null, { detail: true });
	_report.user = await packUser(_report.userId, null, { detail: true });

	resolve(_report);
});
