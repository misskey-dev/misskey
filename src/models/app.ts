import { Entity, PrimaryGeneratedColumn, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import * as deepcopy from 'deepcopy';
import config from '../config';
import { User } from './user';

@Entity()
export class App {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the App.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24, nullable: true,
		comment: 'The owner ID.'
	})
	public userId: string | null;

	@ManyToOne(type => User, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('varchar', {
		length: 64,
		comment: 'The secret key of the App.'
	})
	public secret: string;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the App.'
	})
	public name: string;

	@Column('varchar', {
		length: 512,
		comment: 'The description of the App.'
	})
	public description: string;

	@Column('simple-array', {
		comment: 'The permission of the App.'
	})
	public permission: string[];

	@Column('varchar', {
		length: 256, nullable: true,
		comment: 'The callbackUrl of the App.'
	})
	public callbackUrl: string | null;
}

/**
 * Pack an app for API response
 */
export const pack = (
	app: any,
	me?: any,
	options?: {
		detail?: boolean,
		includeSecret?: boolean,
		includeProfileImageIds?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false,
		includeSecret: false,
		includeProfileImageIds: false
	}, options);

	let _app: any;

	const fields = opts.detail ? {} : {
		name: true
	};

	// Populate the app if 'app' is ID
	if (isObjectId(app)) {
		_app = await App.findOne({
			id: app
		});
	} else if (typeof app === 'string') {
		_app = await App.findOne({
			id: new mongo.ObjectID(app)
		}, { fields });
	} else {
		_app = deepcopy(app);
	}

	// Me
	if (me && !isObjectId(me)) {
		if (typeof me === 'string') {
			me = new mongo.ObjectID(me);
		} else {
			me = me.id;
		}
	}

	// Rename _id to id
	_app.id = _app.id;
	delete _app.id;

	// Visible by only owner
	if (!opts.includeSecret) {
		delete _app.secret;
	}

	_app.iconUrl = _app.icon != null
		? `${config.driveUrl}/${_app.icon}`
		: `${config.driveUrl}/app-default.jpg`;

	if (me) {
		// 既に連携しているか
		const exist = await AccessToken.count({
			appId: _app.id,
			userId: me,
		}, {
				limit: 1
			});

		_app.isAuthorized = exist === 1;
	}

	resolve(_app);
});
