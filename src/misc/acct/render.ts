import Acct from './type';

export default (user: Acct) => {
	return user.host == null ? user.username : `${user.username}@${user.host}`;
};
