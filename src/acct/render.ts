import { IUser } from "../models/user";

export default (user: IUser) => {
	return user.host === null ? user.username : `${user.username}@${user.host}`;
};
