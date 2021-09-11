import { EntityRepository, Repository } from 'typeorm';
import { Signin } from '@/models/entities/signin';
import { Resolved } from '@/prelude/types';

export type PackedSignin = Resolved<ReturnType<SigninRepository['pack']>>;

@EntityRepository(Signin)
export class SigninRepository extends Repository<Signin> {
	public async pack(
		src: any,
	) {
		return src;
	}
}
