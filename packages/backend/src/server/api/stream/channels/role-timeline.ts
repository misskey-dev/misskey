/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import Channel, { type MiChannelService } from '../channel.js';

class RoleTimelineChannel extends Channel {
	public readonly chName = 'roleTimeline';
	public static readonly shouldShare = false;
	public static readonly requireCredential = false as const;
	private roleId: string;
	private minimize: boolean;

	constructor(
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: any) {
		this.roleId = params.roleId as string;
		this.minimize = params.minimize ?? false;

		this.subscriber.on(`roleTimelineStream:${this.roleId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['roleTimeline']['payload']) {
		if (data.type === 'note') {
			const note = data.body;

			if (!(await this.roleService.isExplorable({ id: this.roleId }))) {
				return;
			}
			if (note.visibility !== 'public') return;

			if (note.reply) {
				const reply = note.reply;
				// 自分のフォローしていないユーザーの visibility: followers な投稿への返信は弾く
				if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId)) return;
				// 自分の見ることができないユーザーの visibility: specified な投稿への返信は弾く
				if (reply.visibility === 'specified' && !reply.visibleUserIds!.includes(this.user!.id)) return;
			}

			// 純粋なリノート（引用リノートでないリノート）の場合
			if (note.renote && isRenotePacked(note) && !isQuotePacked(note)) {
				if (note.renote.reply) {
					const reply = note.renote.reply;
					// 自分のフォローしていないユーザーの visibility: followers な投稿への返信のリノートは弾く
					if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId)) return;
				}
			}

			if (this.isNoteMutedOrBlocked(note)) return;

			if (this.user && isRenotePacked(note) && !isQuotePacked(note)) {
				if (note.renote && Object.keys(note.renote.reactions).length > 0) {
					const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
					note.renote.myReaction = myRenoteReaction;
				}
			}

			if (this.user && (note.visibleUserIds?.includes(this.user.id) ?? note.mentions?.includes(this.user.id))) {
				this.connection.cacheNote(note);
			}

			if (this.minimize && ['public', 'home'].includes(note.visibility)) {
				const badgeRoles = this.iAmModerator ? await this.roleService.getUserBadgeRoles(note.userId, false) : undefined;

				this.send('note', {
					id: note.id, myReaction: note.myReaction,
					poll: note.poll?.choices ? { choices: note.poll.choices } : undefined,
					reply: note.reply?.myReaction ? { myReaction: note.reply.myReaction } : undefined,
					renote: note.renote?.myReaction ? { myReaction: note.renote.myReaction } : undefined,
					...(badgeRoles?.length ? { user: { badgeRoles } } : {}),
				});
			} else {
				this.send('note', note);
			}
		} else {
			this.send(data.type, data.body);
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`roleTimelineStream:${this.roleId}`, this.onEvent);
	}
}

@Injectable()
export class RoleTimelineChannelService implements MiChannelService<false> {
	public readonly shouldShare = RoleTimelineChannel.shouldShare;
	public readonly requireCredential = RoleTimelineChannel.requireCredential;
	public readonly kind = RoleTimelineChannel.kind;

	constructor(
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): RoleTimelineChannel {
		return new RoleTimelineChannel(
			this.roleService,
			this.noteEntityService,
			id,
			connection,
		);
	}
}
