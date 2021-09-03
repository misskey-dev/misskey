import { User } from '@/models/entities/user';
import { id } from '@/models/id';
import { UserProfiles } from '@/models/index';
import { SelectQueryBuilder, Brackets } from 'typeorm';

function createMutesQuery(id: string) {
	return UserProfiles.createQueryBuilder('user_profile')
		.select('user_profile.mutedInstances')
		.where('user_profile.userId = :muterId', { muterId: id });
}

export function generateMutedInstanceQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const mutingQuery = createMutesQuery(me.id);

	q
		.andWhere(new Brackets(qb => { qb
			.andWhere('note.userHost IS NULL')
			.orWhere(`NOT((${ mutingQuery.getQuery() })::jsonb ? note.userHost)`);
		}))
		.andWhere(new Brackets(qb => { qb
			.where(`note.replyUserHost IS NULL`)
			.orWhere(`NOT ((${ mutingQuery.getQuery() })::jsonb ? note.replyUserHost)`);
		}))
		.andWhere(new Brackets(qb => { qb
			.where(`note.renoteUserHost IS NULL`)
			.orWhere(`NOT ((${ mutingQuery.getQuery() })::jsonb ? note.renoteUserHost)`);
		}));
	q.setParameters(mutingQuery.getParameters());
}

export function generateMutedInstanceNotificationQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const mutingQuery = createMutesQuery(me.id);

	q.andWhere(new Brackets(qb => { qb 
		.andWhere('notifier.host IS NULL')
		.orWhere(`NOT (( ${mutingQuery.getQuery()} )::jsonb ? notifier.host)`);
	}));

	q.setParameters(mutingQuery.getParameters());
}
