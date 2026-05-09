/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ChatService } from '@/core/ChatService.js';

export const meta = {
        tags: ['chat'],

        requireCredential: true,

        kind: 'write:chat',
} as const;

export const paramDef = {
        type: 'object',
        properties: {
                roomId: { type: 'string', format: 'misskey:id' },
                userId: { type: 'string', format: 'misskey:id' },
        },
        required: ['roomId', 'userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
        constructor(
                private chatService: ChatService,
        ) {
                super(meta, paramDef, async (ps, me) => {
                        await this.chatService.katsudoKickRoomMember(
                                me.id,
                                ps.roomId,
                                ps.userId,
                        );
                });
        }
}
