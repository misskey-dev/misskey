import config from '../../../config';

export default ({ _id }) => ({
	type: 'Image',
	url: `${config.drive_url}/${_id}`
});
