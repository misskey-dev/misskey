import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { Note } from './note';
import { Channel } from './channel';
import { id } from '../id';

@Entity()
@Index(['channelId', 'noteId'], { unique: true })
export class ChannelNotePining {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the ChannelNotePining.',
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public channelId: Channel['id'];

	@ManyToOne(type => Channel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public channel: Channel | null;

	@Column(id())
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;
}
