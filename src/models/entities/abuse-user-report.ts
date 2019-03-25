import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
@Index(['userId', 'reporterId'], { unique: true })
export class AbuseUserReport {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Index()
	@Column('date', {
		comment: 'The created date of the AbuseUserReport.'
	})
	public createdAt: Date;

	@Index()
	@Column('integer')
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer')
	public reporterId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public reporter: User | null;

	@Column('varchar', {
		length: 512,
	})
	public comment: string;
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
			id: report
		});
	} else if (typeof report === 'string') {
		_report = await AbuseUserReport.findOne({
			id: new mongo.ObjectID(report)
		});
	} else {
		_report = deepcopy(report);
	}

	// Rename _id to id
	_report.id = _report.id;
	delete _report.id;

	_report.reporter = await packUser(_report.reporterId, null, { detail: true });
	_report.user = await packUser(_report.userId, null, { detail: true });

	resolve(_report);
});
