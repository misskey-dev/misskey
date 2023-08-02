import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { Emoji } from './Emoji.js';

export type LogTypeValue = 'Add' | 'Update' | 'Other';
export type LogInfoValue = { type: keyof Emoji, changeInfo: { [K in 'before' | 'after']: any } };

@Entity()
export class EmojiModerationLog {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the ModerationLog.',
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column(id())
	public emojiId: Emoji['id'];

	@ManyToOne(type => Emoji, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public emoji: Emoji | null;

	@Column('enum', {
		enum: ['Add', 'Update', 'Other'],
		default: 'Other',
	})
	public type: LogTypeValue;

	// もっと他にいい方法がないかなぁ...
	@Column('jsonb', {
		default: {},
	})
	public info: LogInfoValue[];
}
