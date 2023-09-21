import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

// TODO: 同じdomain、同じscope、同じkeyのレコードは二つ以上存在しないように制約付けたい
@Entity()
export class RegistryItem {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the RegistryItem.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the RegistryItem.',
	})
	public updatedAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 1024,
		comment: 'The key of the RegistryItem.',
	})
	public key: string;

	@Column('jsonb', {
		default: {}, nullable: true,
		comment: 'The value of the RegistryItem.',
	})
	public value: any | null;

	@Index()
	@Column('varchar', {
		length: 1024, array: true, default: '{}',
	})
	public scope: string[];

	// サードパーティアプリに開放するときのためのカラム
	@Index()
	@Column('varchar', {
		length: 512, nullable: true,
	})
	public domain: string | null;
}
