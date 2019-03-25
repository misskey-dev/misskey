import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { Note } from './note';

@Entity()
@Index(['userId', 'noteId'], { unique: true })
export class NoteUnread {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Index()
	@Column('integer')
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer')
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;

	@Column('integer', {
		comment: '[Denormalized]'
	})
	public noteUserId: User['id'];

	/**
	 * ダイレクト投稿か
	 */
	@Column('boolean')
	public isSpecified: boolean;
}
