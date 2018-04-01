import config from '../../../../conf';

export default ({ _id, contentType }) => ({
	type: 'Document',
	mediaType: contentType,
	url: `${config.drive_url}/${_id}`
});
