import * as mongo from 'mongodb';

import db from '../../db/mongodb';
import { IPost } from './post';

const collection = db.get('users');

(collection as any).createIndex('username'); // fuck type definition
(collection as any).createIndex('token'); // fuck type definition

export default collection as any; // fuck type definition

export function validateUsername(username: string): boolean {
	return typeof username == 'string' && /^[a-zA-Z0-9\-]{3,20}$/.test(username);
}

export function validatePassword(password: string): boolean {
	return typeof password == 'string' && password != '';
}

export function isValidName(name: string): boolean {
	return typeof name == 'string' && name.length < 30 && name.trim() != '';
}

export function isValidDescription(description: string): boolean {
	return typeof description == 'string' && description.length < 500 && description.trim() != '';
}

export function isValidLocation(location: string): boolean {
	return typeof location == 'string' && location.length < 50 && location.trim() != '';
}

export function isValidBirthday(birthday: string): boolean {
	return typeof birthday == 'string' && /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
}

export type IUser = {
	_id: mongo.ObjectID;
	created_at: Date;
	email: string;
	followers_count: number;
	following_count: number;
	links: string[];
	name: string;
	password: string;
	posts_count: number;
	drive_capacity: number;
	username: string;
	username_lower: string;
	token: string;
	avatar_id: mongo.ObjectID;
	banner_id: mongo.ObjectID;
	data: any;
	twitter: {
		access_token: string;
		access_token_secret: string;
		user_id: string;
		screen_name: string;
	};
	line: {
		user_id: string;
	};
	description: string;
	profile: {
		location: string;
		birthday: string; // 'YYYY-MM-DD'
		tags: string[];
	};
	last_used_at: Date;
	latest_post: IPost;
	pinned_post_id: mongo.ObjectID;
	is_pro: boolean;
	is_suspended: boolean;
	keywords: string[];
	two_factor_secret: string;
	two_factor_enabled: boolean;
};

export function init(user): IUser {
	user._id = new mongo.ObjectID(user._id);
	user.avatar_id = new mongo.ObjectID(user.avatar_id);
	user.banner_id = new mongo.ObjectID(user.banner_id);
	user.pinned_post_id = new mongo.ObjectID(user.pinned_post_id);
	return user;
}
