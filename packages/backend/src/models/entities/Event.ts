import { Entity, Index, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { noteVisibilities } from '../../types.js';
import { MiNote } from './Note.js';
import type { MiUser } from './User.js';

@Entity('event')
export class MiEvent {
	@PrimaryColumn(id())
	public noteId: MiNote['id'];

	@OneToOne(type => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: MiNote | null;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The start time of the event',
	})
	public start: Date;

	@Column('timestamp with time zone', {
		comment: 'The end of the event',
		nullable: true,
	})
	public end: Date;

	@Column({
		type: 'varchar',
		length: 128,
		comment: 'short name of event',
	})
	public title: string;

	@Column('jsonb', {
		default: {
			'@context': 'https://schema.org/',
			'@type': 'Event',
		},
		comment: 'metadata object describing the event. Follows https://schema.org/Event',
	})
	public metadata: EventSchema;

	//#region Denormalized fields
	@Column('enum', {
		enum: noteVisibilities,
		comment: '[Denormalized]',
	})
	public noteVisibility: typeof noteVisibilities[number];

	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public userId: MiUser['id'];

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public userHost: string | null;
	//#endregion

	constructor(data: Partial<Event>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export type EventSchema = {
	'@type': 'Event';
	name?: string;
	url?: string;
	description?: string;
	audience?: {
		'@type': 'Audience';
		name: string;
	};
	doorTime?: string;
	startDate?: string;
	endDate?: string;
	eventStatus?: 'https://schema.org/EventCancelled' | 'https://schema.org/EventMovedOnline' | 'https://schema.org/EventPostponed' | 'https://schema.org/EventRescheduled' | 'https://schema.org/EventScheduled';
	inLanguage?: string;
	isAccessibleForFree?: boolean;
	keywords?: string;
	location?: string;
	offers?: {
		'@type': 'Offer';
		price?: string;
		priceCurrency?: string;
		availabilityStarts?: string;
		availabilityEnds?: string;
		url?: string;
	};
	organizer?: {
		name: string;
		sameAs?: string; // ie. URL to website/social
	};
	performer?: {
		name: string;
		sameAs?: string; // ie. URL to website/social
	}[];
	typicalAgeRange?: string;
	identifier?: string;
}

export type IEvent = {
	start: Date;
	end: Date | null
	title: string;
	metadata: EventSchema;
}
