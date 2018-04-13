export default (x: any) => Object.assign({
	'@context': [
		'https://www.w3.org/ns/activitystreams',
		'https://w3id.org/security/v1',
		{ Hashtag: 'as:Hashtag' }
	]
}, x);
