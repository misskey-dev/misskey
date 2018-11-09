import { IIcon } from "./icon";

/***
 * tag (ActivityPub)
 */
export type ITag = {
	id: string;
	type: string;
	name?: string;
	updated?: Date;
	icon?: IIcon;
};
