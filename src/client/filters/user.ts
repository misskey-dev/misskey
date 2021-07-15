import { getAcct } from '@/misc/acct';
import getUserName from '@/misc/get-user-name';
import { url } from '@client/config';

export const acct = user => {
	return getAcct(user);
};

export const userName = user => {
	return getUserName(user);
};

export const userPage = (user, path?, absolute = false) => {
	return `${absolute ? url : ''}/@${acct(user)}${(path ? `/${path}` : '')}`;
};
