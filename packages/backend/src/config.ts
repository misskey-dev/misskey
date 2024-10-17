/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as yaml from 'js-yaml';
import type * as Bull from 'bullmq';
import type { RedisOptions } from 'ioredis';

export type RedisOptionsSource = Partial<RedisOptions> & {
	host: string;
	port: number;
	family?: number;
	pass: string;
	db?: number;
	prefix?: string;
};

/**
 * 設定ファイルの型
 */
type Source = {
	url: string;
	port?: number;
	socket?: string;
	chmodSocket?: string;
	disableHsts?: boolean;
	db: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
		disableCache?: boolean;
		extra?: { [x: string]: string };
	};
	dbReplications?: boolean;
	dbSlaves?: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
	}[];
	redis: RedisOptionsSource;
	redisForPubsub?: RedisOptionsSource;
	redisForJobQueue?: RedisOptionsSource;
	redisForSystemQueue?: RedisOptionsSource;
	redisForEndedPollNotificationQueue?: RedisOptionsSource;
	redisForDeliverQueues?: Array<RedisOptionsSource>;
	redisForInboxQueue?: RedisOptionsSource;
	redisForDbQueue?: RedisOptionsSource;
	redisForRelationshipQueue?: RedisOptionsSource;
	redisForObjectStorageQueue?: RedisOptionsSource;
	redisForWebhookDeliverQueue?: RedisOptionsSource;
	redisForTimelines?: RedisOptionsSource;
	meilisearch?: {
		host: string;
		port: string;
		apiKey: string;
		ssl?: boolean;
		index: string;
		scope?: 'local' | 'global' | string[];
	};

	elasticsearch?: {
		host: string;
		port: string;
		user: string;
		pass: string;
		ssl?: boolean;
		rejectUnauthorized?: boolean;
		index: string;
	};

	skebStatus?: {
		method: string;
		endpoint: string;
		headers: { [x: string]: string };
		parameters: { [x: string]: string };
		userIdParameterName: string;
		roleId: string;
	}

	proxy?: string;
	proxySmtp?: string;
	proxyBypassHosts?: string[];

	allowedPrivateNetworks?: string[];

	contentSecurityPolicy?: string;

	maxFileSize?: number;

	clusterLimit?: number;

	id: string;

	outgoingAddress?: string;
	outgoingAddressFamily?: 'ipv4' | 'ipv6' | 'dual';

	bullmqQueueOptions?: Partial<Bull.QueueOptions>;
	bullmqWorkerOptions?: Partial<Bull.WorkerOptions>;
	deliverJobConcurrency?: number;
	inboxJobConcurrency?: number;
	relationshipJobConcurrency?: number;
	deliverJobPerSec?: number;
	inboxJobPerSec?: number;
	relationshipJobPerSec?: number;
	deliverJobMaxAttempts?: number;
	inboxJobMaxAttempts?: number;

	mediaProxy?: string;
	proxyRemoteFiles?: boolean;
	videoThumbnailGenerator?: string;

	bypassRateLimit?: { header: string; value: string }[];

	remapDriveFileUrlForActivityPub?: { target: string; replacement: string }[];
	signToActivityPubGet?: boolean;

	perChannelMaxNoteCacheCount?: number;
	perUserNotificationsMaxCount?: number;
	deactivateAntennaThreshold?: number;
	pidFile: string;
};

export type Config = {
	url: string;
	port: number;
	socket: string | undefined;
	chmodSocket: string | undefined;
	disableHsts: boolean | undefined;
	db: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
		disableCache?: boolean;
		extra?: { [x: string]: string };
	};
	dbReplications: boolean | undefined;
	dbSlaves: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
	}[] | undefined;
	meilisearch: {
		host: string;
		port: string;
		apiKey: string;
		ssl?: boolean;
		index: string;
		scope?: 'local' | 'global' | string[];
	} | undefined;
	elasticsearch: {
		host: string;
		port: string;
		user: string;
		pass: string;
		ssl?: boolean;
		rejectUnauthorized?: boolean;
		index: string;
	} | undefined;
	skebStatus: {
		method: string;
		endpoint: string;
		headers: { [x: string]: string };
		parameters: { [x: string]: string };
		userIdParameterName: string;
		roleId: string;
	} | undefined;
	proxy: string | undefined;
	proxySmtp: string | undefined;
	proxyBypassHosts: string[] | undefined;
	allowedPrivateNetworks: string[] | undefined;
	contentSecurityPolicy: string | undefined;
	maxFileSize: number | undefined;
	clusterLimit: number | undefined;
	id: string;
	outgoingAddress: string | undefined;
	outgoingAddressFamily: 'ipv4' | 'ipv6' | 'dual' | undefined;
	bullmqQueueOptions: Partial<Bull.QueueOptions>;
	bullmqWorkerOptions: Partial<Bull.WorkerOptions>;
	deliverJobConcurrency: number | undefined;
	inboxJobConcurrency: number | undefined;
	relationshipJobConcurrency: number | undefined;
	deliverJobPerSec: number | undefined;
	inboxJobPerSec: number | undefined;
	relationshipJobPerSec: number | undefined;
	deliverJobMaxAttempts: number | undefined;
	inboxJobMaxAttempts: number | undefined;
	proxyRemoteFiles: boolean | undefined;
	remapDriveFileUrlForActivityPub: { target: string; replacement: string }[] | undefined;
	signToActivityPubGet: boolean | undefined;

	version: string;
	host: string;
	hostname: string;
	scheme: string;
	wsScheme: string;
	apiUrl: string;
	wsUrl: string;
	authUrl: string;
	driveUrl: string;
	userAgent: string;
	clientEntry: string;
	clientManifestExists: boolean;
	mediaProxy: string;
	externalMediaProxyEnabled: boolean;
	videoThumbnailGenerator: string | null;
	bypassRateLimit: { header: string; value: string }[] | undefined;
	redis: RedisOptions & RedisOptionsSource;
	redisForPubsub: RedisOptions & RedisOptionsSource;
	redisForSystemQueue: RedisOptions & RedisOptionsSource;
	redisForEndedPollNotificationQueue: RedisOptions & RedisOptionsSource;
	redisForDeliverQueues: Array<RedisOptions & RedisOptionsSource>;
	redisForInboxQueue: RedisOptions & RedisOptionsSource;
	redisForDbQueue: RedisOptions & RedisOptionsSource;
	redisForRelationshipQueue: RedisOptions & RedisOptionsSource;
	redisForObjectStorageQueue: RedisOptions & RedisOptionsSource;
	redisForWebhookDeliverQueue: RedisOptions & RedisOptionsSource;
	redisForTimelines: RedisOptions & RedisOptionsSource;
	perChannelMaxNoteCacheCount: number;
	perUserNotificationsMaxCount: number;
	deactivateAntennaThreshold: number;
	pidFile: string;
};

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

/**
 * Path of configuration directory
 */
const dir = `${_dirname}/../../../.config`;

/**
 * Path of configuration file
 */
const path = process.env.MISSKEY_CONFIG_YML
	? resolve(dir, process.env.MISSKEY_CONFIG_YML)
	: process.env.NODE_ENV === 'test'
		? resolve(dir, 'test.yml')
		: resolve(dir, 'default.yml');

export function loadConfig(): Config {
	const meta = JSON.parse(fs.readFileSync(`${_dirname}/../../../built/meta.json`, 'utf-8'));
	const clientManifestExists = fs.existsSync(_dirname + '/../../../built/_vite_/manifest.json');
	const clientManifest = clientManifestExists ?
		JSON.parse(fs.readFileSync(`${_dirname}/../../../built/_vite_/manifest.json`, 'utf-8'))
		: { 'src/_boot_.ts': { file: 'src/_boot_.ts' } };
	const config = yaml.load(fs.readFileSync(path, 'utf-8')) as Source;

	const url = tryCreateUrl(config.url);
	const version = meta.version;
	const host = url.host;
	const hostname = url.hostname;
	const scheme = url.protocol.replace(/:$/, '');
	const wsScheme = scheme.replace('http', 'ws');

	const externalMediaProxy = config.mediaProxy ?
		config.mediaProxy.endsWith('/') ? config.mediaProxy.substring(0, config.mediaProxy.length - 1) : config.mediaProxy
		: null;
	const internalMediaProxy = `${scheme}://${host}/proxy`;
	const redis = convertRedisOptions(config.redis, host);
	const redisForJobQueue = config.redisForJobQueue ? convertRedisOptions(config.redisForJobQueue, host) : redis;

	return {
		version,
		url: url.origin,
		port: config.port ?? parseInt(process.env.PORT ?? '', 10),
		socket: config.socket,
		chmodSocket: config.chmodSocket,
		disableHsts: config.disableHsts,
		host,
		hostname,
		scheme,
		wsScheme,
		wsUrl: `${wsScheme}://${host}`,
		apiUrl: `${scheme}://${host}/api`,
		authUrl: `${scheme}://${host}/auth`,
		driveUrl: `${scheme}://${host}/files`,
		db: config.db,
		dbReplications: config.dbReplications,
		dbSlaves: config.dbSlaves,
		meilisearch: config.meilisearch,
		elasticsearch: config.elasticsearch,
		redis,
		redisForPubsub: config.redisForPubsub ? convertRedisOptions(config.redisForPubsub, host) : redis,
		redisForSystemQueue: config.redisForSystemQueue ? convertRedisOptions(config.redisForSystemQueue, host) : redisForJobQueue,
		redisForEndedPollNotificationQueue: config.redisForEndedPollNotificationQueue ? convertRedisOptions(config.redisForEndedPollNotificationQueue, host) : redisForJobQueue,
		redisForDeliverQueues: config.redisForDeliverQueues ? config.redisForDeliverQueues.map(config => convertRedisOptions(config, host)) : [redisForJobQueue],
		redisForInboxQueue: config.redisForInboxQueue ? convertRedisOptions(config.redisForInboxQueue, host) : redisForJobQueue,
		redisForDbQueue: config.redisForDbQueue ? convertRedisOptions(config.redisForDbQueue, host) : redisForJobQueue,
		redisForRelationshipQueue: config.redisForRelationshipQueue ? convertRedisOptions(config.redisForRelationshipQueue, host) : redisForJobQueue,
		redisForObjectStorageQueue: config.redisForObjectStorageQueue ? convertRedisOptions(config.redisForObjectStorageQueue, host) : redisForJobQueue,
		redisForWebhookDeliverQueue: config.redisForWebhookDeliverQueue ? convertRedisOptions(config.redisForWebhookDeliverQueue, host) : redisForJobQueue,
		redisForTimelines: config.redisForTimelines ? convertRedisOptions(config.redisForTimelines, host) : redis,
		skebStatus: config.skebStatus,
		id: config.id,
		proxy: config.proxy,
		proxySmtp: config.proxySmtp,
		proxyBypassHosts: config.proxyBypassHosts,
		allowedPrivateNetworks: config.allowedPrivateNetworks,
		contentSecurityPolicy: config.contentSecurityPolicy,
		maxFileSize: config.maxFileSize,
		clusterLimit: config.clusterLimit,
		outgoingAddress: config.outgoingAddress,
		outgoingAddressFamily: config.outgoingAddressFamily,
		bullmqQueueOptions: config.bullmqQueueOptions ?? {},
		bullmqWorkerOptions: config.bullmqWorkerOptions ?? {},
		deliverJobConcurrency: config.deliverJobConcurrency,
		inboxJobConcurrency: config.inboxJobConcurrency,
		relationshipJobConcurrency: config.relationshipJobConcurrency,
		deliverJobPerSec: config.deliverJobPerSec,
		inboxJobPerSec: config.inboxJobPerSec,
		relationshipJobPerSec: config.relationshipJobPerSec,
		deliverJobMaxAttempts: config.deliverJobMaxAttempts,
		inboxJobMaxAttempts: config.inboxJobMaxAttempts,
		proxyRemoteFiles: config.proxyRemoteFiles,
		remapDriveFileUrlForActivityPub: config.remapDriveFileUrlForActivityPub,
		signToActivityPubGet: config.signToActivityPubGet,
		mediaProxy: externalMediaProxy ?? internalMediaProxy,
		externalMediaProxyEnabled: externalMediaProxy !== null && externalMediaProxy !== internalMediaProxy,
		videoThumbnailGenerator: config.videoThumbnailGenerator ?
			config.videoThumbnailGenerator.endsWith('/') ? config.videoThumbnailGenerator.substring(0, config.videoThumbnailGenerator.length - 1) : config.videoThumbnailGenerator
			: null,
		bypassRateLimit: config.bypassRateLimit,
		userAgent: `Misskey/${version} (${config.url})`,
		clientEntry: clientManifest['src/_boot_.ts'],
		clientManifestExists: clientManifestExists,
		perChannelMaxNoteCacheCount: config.perChannelMaxNoteCacheCount ?? 1000,
		perUserNotificationsMaxCount: config.perUserNotificationsMaxCount ?? 500,
		deactivateAntennaThreshold: config.deactivateAntennaThreshold ?? (1000 * 60 * 60 * 24 * 7),
		pidFile: config.pidFile,
	};
}

function tryCreateUrl(url: string) {
	try {
		return new URL(url);
	} catch (e) {
		throw new Error(`url="${url}" is not a valid URL.`);
	}
}

function convertRedisOptions(options: RedisOptionsSource, host: string): RedisOptions & RedisOptionsSource {
	return {
		...options,
		password: options.pass,
		prefix: options.prefix ?? host,
		family: options.family ?? 0,
		keyPrefix: `${options.prefix ?? host}:`,
		db: options.db ?? 0,
	};
}
