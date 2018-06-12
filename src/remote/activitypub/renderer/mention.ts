export default (mention: {
	uri: string;
	username: string;
	host: string;
}) => ({
	type: 'Mention',
	href: mention.uri,
	name: `@${mention.username}@${mention.host}`
});
