/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as yaml from 'js-yaml';
import * as Sentry from '@sentry/node';
import type { RedisOptions } from 'ioredis';

type RedisOptionsSource = Partial<RedisOptions> & {
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
	url?: string;
	port?: number;
	socket?: string;
	chmodSocket?: string;
	disableHsts?: boolean;
	db: {
		host: string;
		port: number;
		db?: string;
		user?: string;
		pass?: string;
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
	redisForTimelines?: RedisOptionsSource;
	meilisearch?: {
		host: string;
		port: string;
		apiKey: string;
		ssl?: boolean;
		index: string;
		scope?: 'local' | 'global' | string[];
	};
	sentryForBackend?: { options: Partial<Sentry.NodeOptions>; enableNodeProfiling: boolean; };
	sentryForFrontend?: { options: Partial<Sentry.NodeOptions> };

	publishTarballInsteadOfProvideRepositoryUrl?: boolean;

	proxy?: string;
	proxySmtp?: string;
	proxyBypassHosts?: string[];

	allowedPrivateNetworks?: string[];

	maxFileSize?: number;

	clusterLimit?: number;

	id: string;

	outgoingAddress?: string;
	outgoingAddressFamily?: 'ipv4' | 'ipv6' | 'dual';

	deliverJobConcurrency?: number;
	inboxJobConcurrency?: number;
	relationshipJobConcurrency?: number;
	deliverJobPerSec?: number;
	inboxJobPerSec?: number;
	relationshipJobPerSec?: number;
	deliverJobMaxAttempts?: number;
	inboxJobMaxAttempts?: number;
	caches?: {
		userByIdMemoryLifetime?: number;
		userByIdMemoryCapacity?: number;

		localUserByIdMemoryLifetime?: number;
		localUserByIdMemoryCapacity?: number;

		userByTokenMemoryLifetime?: number;
		userByTokenMemoryCapacity?: number;

		userByUriMemoryLifetime?: number;
		userByUriMemoryCapacity?: number;

		userProfileRedisLifetime?: number;
		userProfileMemoryLifetime?: number;
		userProfileMemoryCapacity?: number;

		userKeyPairRedisLifetime?: number;
		userKeyPairMemoryLifetime?: number;
		userKeyPairMemoryCapacity?: number;

		rolesMemoryLifetime?: number;

		userRolesMemoryLifetime?: number;
		userRolesMemoryCapacity?: number;

		userMutesRedisLifetime?: number;
		userMutesMemoryLifetime?: number;
		userMutesMemoryCapacity?: number;

		userBlocksRedisLifetime?: number;
		userBlocksMemoryLifetime?: number;
		userBlocksMemoryCapacity?: number;

		userFollowingsRedisLifetime?: number;
		userFollowingsMemoryLifetime?: number;
		userFollowingsMemoryCapacity?: number;

		userChannelsRedisLifetime?: number;
		userChannelsMemoryLifetime?: number;
		userChannelsMemoryCapacity?: number;

		publicKeysMemoryLifetime?: number;
		publicKeysMemoryCapacity?: number;

		emojisMemoryLifetime?: number;
		emojisMemoryCapacity?: number;

		localEmojisRedisLifetime?: number;
		localEmojisMemoryLifetime?: number;

		instanceRedisLifetime?: number;
		instanceMemoryLifetime?: number;
		instanceMemoryCapacity?: number;

		swSubscriptionRedisLifetime?: number;
		swSubscriptionMemoryLifetime?: number;
		swSubscriptionMemoryCapacity?: number;

		listMembershipRedisLifetime?: number;
		listMembershipMemoryLifetime?: number;
		listMembershipMemoryCapacity?: number;

		clientAppMemoryLifetime?: number;
		clientAppMemoryCapacity?: number;

		avatarDecorationsMemoryLifetime?: number;

		relaysMemoryLifetime?: number;

		suspendedHostsMemoryLifetime?: number;

		nodeInfoMemoryLifetime?: number;
	};

	mediaProxy?: string;
	proxyRemoteFiles?: boolean;
	videoThumbnailGenerator?: string;

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
	proxy: string | undefined;
	proxySmtp: string | undefined;
	proxyBypassHosts: string[] | undefined;
	allowedPrivateNetworks: string[] | undefined;
	maxFileSize: number | undefined;
	clusterLimit: number | undefined;
	id: string;
	outgoingAddress: string | undefined;
	outgoingAddressFamily: 'ipv4' | 'ipv6' | 'dual' | undefined;
	deliverJobConcurrency: number | undefined;
	inboxJobConcurrency: number | undefined;
	relationshipJobConcurrency: number | undefined;
	deliverJobPerSec: number | undefined;
	inboxJobPerSec: number | undefined;
	relationshipJobPerSec: number | undefined;
	deliverJobMaxAttempts: number | undefined;
	inboxJobMaxAttempts: number | undefined;
	caches: {
		userByIdMemoryLifetime: number;
		userByIdMemoryCapacity: number;

		localUserByIdMemoryLifetime: number;
		localUserByIdMemoryCapacity: number;

		userByTokenMemoryLifetime: number;
		userByTokenMemoryCapacity: number;

		userByUriMemoryLifetime: number;
		userByUriMemoryCapacity: number;

		userProfileRedisLifetime: number;
		userProfileMemoryLifetime: number;
		userProfileMemoryCapacity: number;

		userKeyPairRedisLifetime: number;
		userKeyPairMemoryLifetime: number;
		userKeyPairMemoryCapacity: number;

		rolesMemoryLifetime: number;

		userRolesMemoryLifetime: number;
		userRolesMemoryCapacity: number;

		userMutesRedisLifetime: number;
		userMutesMemoryLifetime: number;
		userMutesMemoryCapacity: number;

		userBlocksRedisLifetime: number;
		userBlocksMemoryLifetime: number;
		userBlocksMemoryCapacity: number;

		userFollowingsRedisLifetime: number;
		userFollowingsMemoryLifetime: number;
		userFollowingsMemoryCapacity: number;

		userChannelsRedisLifetime: number;
		userChannelsMemoryLifetime: number;
		userChannelsMemoryCapacity: number;

		publicKeysMemoryLifetime: number;
		publicKeysMemoryCapacity: number;

		emojisMemoryLifetime: number;
		emojisMemoryCapacity: number;

		localEmojisRedisLifetime: number;
		localEmojisMemoryLifetime: number;

		instanceRedisLifetime: number;
		instanceMemoryLifetime: number;
		instanceMemoryCapacity: number;

		swSubscriptionRedisLifetime: number;
		swSubscriptionMemoryLifetime: number;
		swSubscriptionMemoryCapacity: number;

		listMembershipRedisLifetime: number;
		listMembershipMemoryLifetime: number;
		listMembershipMemoryCapacity: number;

		clientAppMemoryLifetime: number;
		clientAppMemoryCapacity: number;

		avatarDecorationsMemoryLifetime: number;

		relaysMemoryLifetime: number;

		suspendedHostsMemoryLifetime: number;

		nodeInfoMemoryLifetime: number;
	};
	proxyRemoteFiles: boolean | undefined;
	signToActivityPubGet: boolean | undefined;

	version: string;
	publishTarballInsteadOfProvideRepositoryUrl: boolean;
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
	redis: RedisOptions & RedisOptionsSource;
	redisForPubsub: RedisOptions & RedisOptionsSource;
	redisForJobQueue: RedisOptions & RedisOptionsSource;
	redisForTimelines: RedisOptions & RedisOptionsSource;
	sentryForBackend: { options: Partial<Sentry.NodeOptions>; enableNodeProfiling: boolean; } | undefined;
	sentryForFrontend: { options: Partial<Sentry.NodeOptions> } | undefined;
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

	const url = tryCreateUrl(config.url ?? process.env.MISSKEY_URL ?? '');
	const version = meta.version;
	const host = url.host;
	const hostname = url.hostname;
	const scheme = url.protocol.replace(/:$/, '');
	const wsScheme = scheme.replace('http', 'ws');

	const dbDb = config.db.db ?? process.env.DATABASE_DB ?? '';
	const dbUser = config.db.user ?? process.env.DATABASE_USER ?? '';
	const dbPass = config.db.pass ?? process.env.DATABASE_PASSWORD ?? '';

	const externalMediaProxy = config.mediaProxy ?
		config.mediaProxy.endsWith('/') ? config.mediaProxy.substring(0, config.mediaProxy.length - 1) : config.mediaProxy
		: null;
	const internalMediaProxy = `${scheme}://${host}/proxy`;
	const redis = convertRedisOptions(config.redis, host);

	return {
		version,
		publishTarballInsteadOfProvideRepositoryUrl: !!config.publishTarballInsteadOfProvideRepositoryUrl,
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
		db: { ...config.db, db: dbDb, user: dbUser, pass: dbPass },
		dbReplications: config.dbReplications,
		dbSlaves: config.dbSlaves,
		meilisearch: config.meilisearch,
		redis,
		redisForPubsub: config.redisForPubsub ? convertRedisOptions(config.redisForPubsub, host) : redis,
		redisForJobQueue: config.redisForJobQueue ? convertRedisOptions(config.redisForJobQueue, host) : redis,
		redisForTimelines: config.redisForTimelines ? convertRedisOptions(config.redisForTimelines, host) : redis,
		sentryForBackend: config.sentryForBackend,
		sentryForFrontend: config.sentryForFrontend,
		id: config.id,
		proxy: config.proxy,
		proxySmtp: config.proxySmtp,
		proxyBypassHosts: config.proxyBypassHosts,
		allowedPrivateNetworks: config.allowedPrivateNetworks,
		maxFileSize: config.maxFileSize,
		clusterLimit: config.clusterLimit,
		outgoingAddress: config.outgoingAddress,
		outgoingAddressFamily: config.outgoingAddressFamily,
		deliverJobConcurrency: config.deliverJobConcurrency,
		inboxJobConcurrency: config.inboxJobConcurrency,
		relationshipJobConcurrency: config.relationshipJobConcurrency,
		deliverJobPerSec: config.deliverJobPerSec,
		inboxJobPerSec: config.inboxJobPerSec,
		relationshipJobPerSec: config.relationshipJobPerSec,
		deliverJobMaxAttempts: config.deliverJobMaxAttempts,
		inboxJobMaxAttempts: config.inboxJobMaxAttempts,
		caches: {
			userByIdMemoryLifetime: config.caches?.userByIdMemoryLifetime ?? 43200000,
			userByIdMemoryCapacity: config.caches?.userByIdMemoryCapacity ?? 15000,

			localUserByIdMemoryLifetime: config.caches?.localUserByIdMemoryLifetime ?? 43200000,
			localUserByIdMemoryCapacity: config.caches?.localUserByIdMemoryCapacity ?? 10000,

			userByTokenMemoryLifetime: config.caches?.userByTokenMemoryLifetime ?? 43200000,
			userByTokenMemoryCapacity: config.caches?.userByTokenMemoryCapacity ?? 10000,

			userByUriMemoryLifetime: config.caches?.userByUriMemoryLifetime ?? 43200000,
			userByUriMemoryCapacity: config.caches?.userByUriMemoryCapacity ?? 10000,

			userProfileRedisLifetime: config.caches?.userProfileRedisLifetime ?? 1800000,
			userProfileMemoryLifetime: config.caches?.userProfileMemoryLifetime ?? 60000,
			userProfileMemoryCapacity: config.caches?.userProfileMemoryCapacity ?? 10000,

			userKeyPairRedisLifetime: config.caches?.userKeyPairRedisLifetime ?? 86400000,
			userKeyPairMemoryLifetime: config.caches?.userKeyPairMemoryLifetime ?? 43200000,
			userKeyPairMemoryCapacity: config.caches?.userKeyPairMemoryCapacity ?? 10000,

			rolesMemoryLifetime: config.caches?.rolesMemoryLifetime ?? 3600000,

			userRolesMemoryLifetime: config.caches?.userRolesMemoryLifetime ?? 3600000,
			userRolesMemoryCapacity: config.caches?.userRolesMemoryCapacity ?? 10000,

			userMutesRedisLifetime: config.caches?.userMutesRedisLifetime ?? 1800000,
			userMutesMemoryLifetime: config.caches?.userMutesMemoryLifetime ?? 60000,
			userMutesMemoryCapacity: config.caches?.userMutesMemoryCapacity ?? 10000,

			userBlocksRedisLifetime: config.caches?.userBlocksRedisLifetime ?? 1800000,
			userBlocksMemoryLifetime: config.caches?.userBlocksMemoryLifetime ?? 60000,
			userBlocksMemoryCapacity: config.caches?.userBlocksMemoryCapacity ?? 10000,

			userFollowingsRedisLifetime: config.caches?.userFollowingsRedisLifetime ?? 1800000,
			userFollowingsMemoryLifetime: config.caches?.userFollowingsMemoryLifetime ?? 60000,
			userFollowingsMemoryCapacity: config.caches?.userFollowingsMemoryCapacity ?? 10000,

			userChannelsRedisLifetime: config.caches?.userChannelsRedisLifetime ?? 1800000,
			userChannelsMemoryLifetime: config.caches?.userChannelsMemoryLifetime ?? 60000,
			userChannelsMemoryCapacity: config.caches?.userChannelsMemoryCapacity ?? 1000,

			publicKeysMemoryLifetime: config.caches?.publicKeysMemoryLifetime ?? 43200000,
			publicKeysMemoryCapacity: config.caches?.publicKeysMemoryCapacity ?? 15000,

			emojisMemoryLifetime: config.caches?.emojisMemoryLifetime ?? 43200000,
			emojisMemoryCapacity: config.caches?.emojisMemoryCapacity ?? 5000,

			localEmojisRedisLifetime: config.caches?.localEmojisRedisLifetime ?? 1800000,
			localEmojisMemoryLifetime: config.caches?.localEmojisMemoryLifetime ?? 180000,

			instanceRedisLifetime: config.caches?.instanceRedisLifetime ?? 1800000,
			instanceMemoryLifetime: config.caches?.instanceMemoryLifetime ?? 180000,
			instanceMemoryCapacity: config.caches?.instanceMemoryCapacity ?? 5000,

			swSubscriptionRedisLifetime: config.caches?.swSubscriptionRedisLifetime ?? 3600000,
			swSubscriptionMemoryLifetime: config.caches?.swSubscriptionMemoryLifetime ?? 180000,
			swSubscriptionMemoryCapacity: config.caches?.swSubscriptionMemoryCapacity ?? 1000,

			listMembershipRedisLifetime: config.caches?.listMembershipRedisLifetime ?? 1800000,
			listMembershipMemoryLifetime: config.caches?.listMembershipMemoryLifetime ?? 60000,
			listMembershipMemoryCapacity: config.caches?.listMembershipMemoryCapacity ?? 1000,

			clientAppMemoryLifetime: config.caches?.clientAppMemoryLifetime ?? 604800000,
			clientAppMemoryCapacity: config.caches?.clientAppMemoryCapacity ?? 1000,

			avatarDecorationsMemoryLifetime: config.caches?.avatarDecorationsMemoryLifetime ?? 1800000,

			relaysMemoryLifetime: config.caches?.relaysMemoryLifetime ?? 600000,

			suspendedHostsMemoryLifetime: config.caches?.suspendedHostsMemoryLifetime ?? 3600000,

			nodeInfoMemoryLifetime: config.caches?.nodeInfoMemoryLifetime ?? 600000,
		},
		proxyRemoteFiles: config.proxyRemoteFiles,
		signToActivityPubGet: config.signToActivityPubGet ?? true,
		mediaProxy: externalMediaProxy ?? internalMediaProxy,
		externalMediaProxyEnabled: externalMediaProxy !== null && externalMediaProxy !== internalMediaProxy,
		videoThumbnailGenerator: config.videoThumbnailGenerator ?
			config.videoThumbnailGenerator.endsWith('/') ? config.videoThumbnailGenerator.substring(0, config.videoThumbnailGenerator.length - 1) : config.videoThumbnailGenerator
			: null,
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
