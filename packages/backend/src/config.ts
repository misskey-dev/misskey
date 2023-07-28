/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Config loader
 */

import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as yaml from 'js-yaml';
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
 * ユーザーが設定する必要のある情報
 */
export type Source = {
	repository_url?: string;
	feedback_url?: string;
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
	meilisearch?: {
		host: string;
		port: string;
		apiKey: string;
		ssl?: boolean;
		index: string;
		scope?: 'local' | 'global' | string[];
	};

	proxy?: string;
	proxySmtp?: string;
	proxyBypassHosts?: string[];

	allowedPrivateNetworks?: string[];

	maxFileSize?: number;

	accesslog?: string;

	clusterLimit?: number;

	id: string;

	outgoingAddressFamily?: 'ipv4' | 'ipv6' | 'dual';

	deliverJobConcurrency?: number;
	inboxJobConcurrency?: number;
	relashionshipJobConcurrency?: number;
	deliverJobPerSec?: number;
	inboxJobPerSec?: number;
	relashionshipJobPerSec?: number;
	deliverJobMaxAttempts?: number;
	inboxJobMaxAttempts?: number;

	mediaProxy?: string;
	proxyRemoteFiles?: boolean;
	videoThumbnailGenerator?: string;

	signToActivityPubGet?: boolean;
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
export type Mixin = {
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
	redis: RedisOptions & RedisOptionsSource;
	redisForPubsub: RedisOptions & RedisOptionsSource;
	redisForJobQueue: RedisOptions & RedisOptionsSource;
};

export type Config = Source & Mixin;

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

export function loadConfig() {
	const meta = JSON.parse(fs.readFileSync(`${_dirname}/../../../built/meta.json`, 'utf-8'));
	const clientManifestExists = fs.existsSync(_dirname + '/../../../built/_vite_/manifest.json');
	const clientManifest = clientManifestExists ?
		JSON.parse(fs.readFileSync(`${_dirname}/../../../built/_vite_/manifest.json`, 'utf-8'))
		: { 'src/_boot_.ts': { file: 'src/_boot_.ts' } };
	const config = yaml.load(fs.readFileSync(path, 'utf-8')) as Source;

	const mixin = {} as Mixin;

	const url = tryCreateUrl(config.url);

	config.url = url.origin;

	config.port = config.port ?? parseInt(process.env.PORT ?? '', 10);

	mixin.version = meta.version;
	mixin.host = url.host;
	mixin.hostname = url.hostname;
	mixin.scheme = url.protocol.replace(/:$/, '');
	mixin.wsScheme = mixin.scheme.replace('http', 'ws');
	mixin.wsUrl = `${mixin.wsScheme}://${mixin.host}`;
	mixin.apiUrl = `${mixin.scheme}://${mixin.host}/api`;
	mixin.authUrl = `${mixin.scheme}://${mixin.host}/auth`;
	mixin.driveUrl = `${mixin.scheme}://${mixin.host}/files`;
	mixin.userAgent = `Misskey/${meta.version} (${config.url})`;
	mixin.clientEntry = clientManifest['src/_boot_.ts'];
	mixin.clientManifestExists = clientManifestExists;

	const externalMediaProxy = config.mediaProxy ?
		config.mediaProxy.endsWith('/') ? config.mediaProxy.substring(0, config.mediaProxy.length - 1) : config.mediaProxy
		: null;
	const internalMediaProxy = `${mixin.scheme}://${mixin.host}/proxy`;
	mixin.mediaProxy = externalMediaProxy ?? internalMediaProxy;
	mixin.externalMediaProxyEnabled = externalMediaProxy !== null && externalMediaProxy !== internalMediaProxy;

	mixin.videoThumbnailGenerator = config.videoThumbnailGenerator ?
		config.videoThumbnailGenerator.endsWith('/') ? config.videoThumbnailGenerator.substring(0, config.videoThumbnailGenerator.length - 1) : config.videoThumbnailGenerator
		: null;

	mixin.redis = convertRedisOptions(config.redis, mixin.host);
	mixin.redisForPubsub = config.redisForPubsub ? convertRedisOptions(config.redisForPubsub, mixin.host) : mixin.redis;
	mixin.redisForJobQueue = config.redisForJobQueue ? convertRedisOptions(config.redisForJobQueue, mixin.host) : mixin.redis;

	return Object.assign(config, mixin);
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
		family: options.family == null ? 0 : options.family,
		keyPrefix: `${options.prefix ?? host}:`,
		db: options.db ?? 0,
	};
}
