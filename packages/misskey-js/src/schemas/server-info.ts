import type { JSONSchema7Definition } from 'schema-type';

export const ServerInfoSchema = {
	$id: 'https://misskey-hub.net/api/schemas/ServerInfo',

	type: 'object',
	properties: {
		machine: {
            type: 'string',
        },
        cpu: {
            type: 'object',
            properties: {
                model: { type: 'string' },
                cores: { type: 'number' },
            },
            required: ['model', 'cores'],
        },
        mem: {
            type: 'object',
            properties: {
                total: { type: 'number', format: 'bytes' },
            },
            required: ['total'],
        },
        fs: {
            type: 'object',
            properties: {
                total: { type: 'number', format: 'bytes' },
                used: { type: 'number', format: 'bytes' },
            },
        },
	},
	required: [
		'machine',
        'cpu',
        'mem',
        'fs',
	],
} as const satisfies JSONSchema7Definition;

export const ServerInfoAdminSchema = {
    $id: 'https://misskey-hub.net/api/schemas/ServerInfoAdmin',

    allOf: [
        { $ref: 'https://misskey-hub.net/api/schemas/ServerInfo' },
        {
            type: 'object',
            properties: {
                os: {
                    type: 'string',
                    enum: [
                        // NodeJS.Platform
                        'aix',
                        'android',
                        'darwin',
                        'freebsd',
                        'haiku',
                        'linux',
                        'openbsd',
                        'sunos',
                        'win32',
                        'cygwin',
                        'netbsd',
                    ]
                },
                node: { type: 'string', examples: ['v14.17.0'] },
                psql: { type: 'string' },
                redis: { type: 'string' },
                net: {
                    type: 'object',
                    properties: {
                        interface: { type: 'string', examples: ['eth0'] },
                    },
                    required: ['interface'],
                },
            },
            required: [
                'os',
                'node',
                'psql',
                'net',
            ],
        },
    ],
} as const satisfies JSONSchema7Definition;
