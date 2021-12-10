import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishDriveStream } from '@/services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFolders } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	kind: 'write:drive',

	params: {
		name: {
			validator: $.optional.str.pipe(DriveFolders.validateFolderName),
			default: 'Untitled',
		},

		parentId: {
			validator: $.optional.nullable.type(ID),
		},
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '53326628-a00d-40a6-a3cd-8975105c0f95',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFolder',
	},
};

export default define(meta, async (ps, user) => {
	// If the parent folder is specified
	let parent = null;
	if (ps.parentId) {
		// Fetch parent folder
		parent = await DriveFolders.findOne({
			id: ps.parentId,
			userId: user.id,
		});

		if (parent == null) {
			throw new ApiError(meta.errors.noSuchFolder);
		}
	}

	// Create folder
	const folder = await DriveFolders.insert({
		id: genId(),
		createdAt: new Date(),
		name: ps.name,
		parentId: parent !== null ? parent.id : null,
		userId: user.id,
	}).then(x => DriveFolders.findOneOrFail(x.identifiers[0]));

	const folderObj = await DriveFolders.pack(folder);

	// Publish folderCreated event
	publishDriveStream(user.id, 'folderCreated', folderObj);

	return folderObj;
});
