import { IIcon } from './icon';
import { IAuthentication } from './authentication';

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
	authentication?: IAuthentication;
};
