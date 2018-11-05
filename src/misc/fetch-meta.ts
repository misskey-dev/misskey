import Meta, { IMeta } from '../models/meta';

const defaultMeta: any = {
	name: 'Misskey',
	localDriveCapacityMb: 256,
	remoteDriveCapacityMb: 8,
	hidedTags: [],
	stats: {
		originalNotesCount: 0,
		originalUsersCount: 0
	},
	maxNoteTextLength: 1000
};

export default async function(): Promise<IMeta> {
	const meta = await Meta.findOne({});

	return Object.assign({}, defaultMeta, meta);
}
