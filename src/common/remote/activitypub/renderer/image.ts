import config from '../../../../conf';

export default ({ _id }) => ({
	type: 'Image',
	url: `${config.drive_url}/${_id}`
});
