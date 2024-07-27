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
		localUserById?: MemoryKVConfigPartial;
		userById?: MemoryKVConfigPartial;
		userByToken?: MemoryKVConfigPartial;
		userByUri?: MemoryKVConfigPartial;
		userProfile?: RedisKVConfigPartial;
		userKeyPair?: RedisKVConfigPartial;
		userRoles?: MemoryKVConfigPartial;
		userMutes?: RedisKVConfigPartial;
		userBlocks?: RedisKVConfigPartial;
		userFollowings?: RedisKVConfigPartial;
		userChannels?: RedisKVConfigPartial;
		roles?: MemorySingleConfigPartial;
		publicKeys?: MemoryKVConfigPartial;
		emojis?: MemoryKVConfigPartial;
		localEmojis?: RedisSingleConfigPartial;
		instance?: RedisKVConfigPartial;
		swSubscription?: RedisKVConfigPartial;
		listMembership?: RedisKVConfigPartial;
		clientApp?: MemoryKVConfigPartial;
		avatarDecorations?: MemorySingleConfigPartial;
		relays?: MemorySingleConfigPartial;
		suspendedHosts?: MemorySingleConfigPartial;
		nodeInfo?: MemorySingleConfigPartial;
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
interface MemorySingleConfigPartial {
	memory?: {
		lifetime?: number;
	}
}
interface RedisSingleConfigPartial extends MemorySingleConfigPartial {
	redis?: {
		lifetime?: number;
	}
}
interface MemoryKVConfigPartial extends MemorySingleConfigPartial {
	memory?: {
		lifetime?: number;
		capacity?: number;
	}
}
interface RedisKVConfigPartial extends MemoryKVConfigPartial {
	redis?: {
		lifetime?: number;
	}
}

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
		localUserById: MemoryKVConfig;
		userById: MemoryKVConfig;
		userByToken: MemoryKVConfig;
		userByUri: MemoryKVConfig;
		userProfile: RedisKVConfig;
		userKeyPair: RedisKVConfig;
		userRoles: MemoryKVConfig;
		userMutes: RedisKVConfig;
		userBlocks: RedisKVConfig;
		userFollowings: RedisKVConfig;
		userChannels: RedisKVConfig;
		roles: MemorySingleConfig;
		publicKeys: MemoryKVConfig;
		emojis: MemoryKVConfig;
		localEmojis: RedisSingleConfig;
		instance: RedisKVConfig;
		swSubscription: RedisKVConfig;
		listMembership: RedisKVConfig;
		clientApp: MemoryKVConfig;
		avatarDecorations: MemorySingleConfig;
		relays: MemorySingleConfig;
		suspendedHosts: MemorySingleConfig;
		nodeInfo: MemorySingleConfig;
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

export interface MemorySingleConfig {
	memory: {
		lifetime: number;
	}
}
export interface RedisSingleConfig extends MemorySingleConfig {
	redis: {
		lifetime: number;
	}
}
export interface MemoryKVConfig extends MemorySingleConfig {
	memory: {
		lifetime: number;
		capacity: number;
	}
}
export interface RedisKVConfig extends MemoryKVConfig {
	redis: {
		lifetime: number;
	}
}

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
			localUserById: {
				memory: {
					lifetime: config.caches?.localUserById?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.localUserById?.memory?.capacity ?? 10000,
				},
			},
			userById: {
				memory: {
					lifetime: config.caches?.userById?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.userById?.memory?.capacity ?? 15000,
				},
			},
			userByToken: {
				memory: {
					lifetime: config.caches?.userByToken?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.userByToken?.memory?.capacity ?? 10000,
				},
			},
			userByUri: {
				memory: {
					lifetime: config.caches?.userByUri?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.userByUri?.memory?.capacity ?? 10000,
				},
			},
			userProfile: {
				redis: {
					lifetime: config.caches?.userProfile?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.userProfile?.memory?.lifetime ?? 60000,
					capacity: config.caches?.userProfile?.memory?.capacity ?? 10000,
				},
			},
			userKeyPair: {
				redis: {
					lifetime: config.caches?.userKeyPair?.redis?.lifetime ?? 86400000,
				},
				memory: {
					lifetime: config.caches?.userKeyPair?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.userKeyPair?.memory?.capacity ?? 10000,
				},
			},
			userRoles: {
				memory: {
					lifetime: config.caches?.userRoles?.memory?.lifetime ?? 3600000,
					capacity: config.caches?.userRoles?.memory?.capacity ?? 10000,
				},
			},
			userMutes: {
				redis: {
					lifetime: config.caches?.userMutes?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.userMutes?.memory?.lifetime ?? 60000,
					capacity: config.caches?.userMutes?.memory?.capacity ?? 10000,
				},
			},
			userBlocks: {
				redis: {
					lifetime: config.caches?.userBlocks?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.userBlocks?.memory?.lifetime ?? 60000,
					capacity: config.caches?.userBlocks?.memory?.capacity ?? 10000,
				},
			},
			userFollowings: {
				redis: {
					lifetime: config.caches?.userFollowings?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.userFollowings?.memory?.lifetime ?? 60000,
					capacity: config.caches?.userFollowings?.memory?.capacity ?? 10000,
				},
			},
			userChannels: {
				redis: {
					lifetime: config.caches?.userChannels?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.userChannels?.memory?.lifetime ?? 60000,
					capacity: config.caches?.userChannels?.memory?.capacity ?? 10000,
				},
			},
			roles: {
				memory: {
					lifetime: config.caches?.roles?.memory?.lifetime ?? 3600000,
				},
			},
			publicKeys: {
				memory: {
					lifetime: config.caches?.publicKeys?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.publicKeys?.memory?.capacity ?? 15000,
				},
			},
			emojis: {
				memory: {
					lifetime: config.caches?.emojis?.memory?.lifetime ?? 43200000,
					capacity: config.caches?.emojis?.memory?.capacity ?? 5000,
				},
			},
			localEmojis: {
				redis: {
					lifetime: config.caches?.localEmojis?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.localEmojis?.memory?.lifetime ?? 180000,
				},
			},
			instance: {
				redis: {
					lifetime: config.caches?.instance?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.instance?.memory?.lifetime ?? 180000,
					capacity: config.caches?.instance?.memory?.capacity ?? 5000,
				},
			},
			swSubscription: {
				redis: {
					lifetime: config.caches?.swSubscription?.redis?.lifetime ?? 3600000,
				},
				memory: {
					lifetime: config.caches?.swSubscription?.memory?.lifetime ?? 180000,
					capacity: config.caches?.swSubscription?.memory?.capacity ?? 1000,
				},
			},
			listMembership: {
				redis: {
					lifetime: config.caches?.listMembership?.redis?.lifetime ?? 1800000,
				},
				memory: {
					lifetime: config.caches?.listMembership?.memory?.lifetime ?? 60000,
					capacity: config.caches?.listMembership?.memory?.capacity ?? 1000,
				},
			},
			clientApp: {
				memory: {
					lifetime: config.caches?.clientApp?.memory?.lifetime ?? 604800000,
					capacity: config.caches?.clientApp?.memory?.capacity ?? 1000,
				},
			},
			avatarDecorations: {
				memory: {
					lifetime: config.caches?.avatarDecorations?.memory?.lifetime ?? 1800000,
				},
			},
			relays: {
				memory: {
					lifetime: config.caches?.relays?.memory?.lifetime ?? 600000,
				},
			},
			suspendedHosts: {
				memory: {
					lifetime: config.caches?.suspendedHosts?.memory?.lifetime ?? 3600000,
				},
			},
			nodeInfo: {
				memory: {
					lifetime: config.caches?.nodeInfo?.memory?.lifetime ?? 600000,
				},
			},
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
