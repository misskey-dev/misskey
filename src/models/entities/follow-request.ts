import * as deepcopy from 'deepcopy';

import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
@Index(['followerId', 'followeeId'], { unique: true })
export class FollowRequest {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column('date', {
		comment: 'The created date of the FollowRequest.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The followee user ID.'
	})
	public followeeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public followee: User | null;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The follower user ID.'
	})
	public followerId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public follower: User | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'id of Follow Activity.'
	})
	public requestId: string | null;

	//#region Denormalized fields
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public followerHost: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followerInbox: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followerSharedInbox: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public followeeHost: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followeeInbox: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followeeSharedInbox: string | null;
	//#endregion
}

/**
 * Pack a request for API response
 */
export const pack = (
	request: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _request: any;

	// Populate the request if 'request' is ID
	if (isObjectId(request)) {
		_request = await FollowRequest.findOne({
			id: request
		});
	} else if (typeof request === 'string') {
		_request = await FollowRequest.findOne({
			id: new mongo.ObjectID(request)
		});
	} else {
		_request = deepcopy(request);
	}

	// Rename _id to id
	_request.id = _request.id;
	delete _request.id;

	// Populate follower
	_request.follower = await packUser(_request.followerId, me);

	// Populate followee
	_request.followee = await packUser(_request.followeeId, me);

	resolve(_request);
});
