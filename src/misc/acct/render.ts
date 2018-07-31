type UserLike = {
	host: string;
	username: string;
};

export default (user: UserLike) => {
	return user.host === null ? user.username : `${user.username}@${user.host}`;
};
