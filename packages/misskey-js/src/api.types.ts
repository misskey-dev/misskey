import { Endpoints as Gen } from './autogen/endpoint';
import { UserDetailed } from './autogen/models';
import { UsersShowRequest } from './autogen/entities';

export type Overwrite<T, U extends { [Key in keyof T]?: unknown }> = Omit<
	T,
	keyof U
> & U;

export type SwitchCase = {
	$switch: {
		$cases: [any, any][],
		$default: any;
	};
};

export type Endpoints = Overwrite<
	Gen,
	{
		'users/show': {
			req: UsersShowRequest;
			res: {
				$switch: {
					$cases: [[
						{ userIds: string[]; }, UserDetailed[],
					]];
					$default: UserDetailed;
				};
			};
		}
	}
>
