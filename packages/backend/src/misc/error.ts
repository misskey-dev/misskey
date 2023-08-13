/*
 * SPDX-FileCopyrightText: MomentQYC and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FastifyReply, FastifyRequest } from 'fastify';

export function ErrorHandling(message: string, reply?: FastifyReply, statusCode?: number): Error {
	const error = new Error(message);
	if (process.env.NODE_ENV === 'production') {
		error.stack = undefined;
	}
	if (reply) {
		reply.code(statusCode ?? 500);
	}
	return error;
}

export function ErrorHandler(error: Error, request: FastifyRequest, reply: FastifyReply): void {
	throw ErrorHandling(error.message, reply);
}
