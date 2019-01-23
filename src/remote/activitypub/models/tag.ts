import { IIcon } from './icon';
import { IIdentifier } from './identifier';

/***
 * tag (ActivityPub)
 */
export type ITag = {
	id: string;
	type: string;
	name?: string;
	value?: string;
	updated?: Date;
	icon?: IIcon;
	identifier?: IIdentifier;
};
