import { IIcon } from './icon';

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
};
