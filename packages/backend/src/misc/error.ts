/*
 * SPDX-FileCopyrightText: MomentQYC and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FastifyReply, FastifyRequest } from 'fastify';

export async function ErrorHandler(error: Error, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	if (process.env.NODE_ENV === 'production') {
		error.stack = undefined;
	}
	reply.send(error);
	throw error;
}
