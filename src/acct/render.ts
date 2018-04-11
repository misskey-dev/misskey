export default user => {
	return user.host === null ? user.username : `${user.username}@${user.host}`;
};
