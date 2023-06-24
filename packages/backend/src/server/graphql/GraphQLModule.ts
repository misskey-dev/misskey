import path from 'node:path';
import { Module } from '@nestjs/common';
import * as nestjs_graphql from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import type { HttpAdapterHost } from '@nestjs/core';
import type { FastifyAdapter } from '@nestjs/platform-fastify';

@Module({
	imports: [
		nestjs_graphql.GraphQLModule.forRoot<MercuriusDriverConfig>({
			driver: MercuriusDriver,
			autoSchemaFile: path.join(path.dirname(import.meta.url), 'schema.graphql'),
			graphiql: true,
		}),
	],
})
export class GraphQLModule {
	constructor(
		private adapterHost: HttpAdapterHost<FastifyAdapter>,
	) {
		console.log(adapterHost.httpAdapter.getInstance().printRoutes());
	}
}
