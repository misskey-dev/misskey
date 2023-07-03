import { ChartSchema } from "../schemas.js";

export const chartsSchemas = {
    'activeUsers': {
        'readWrite': { intersection: ['read', 'write'] },
        'read': { uniqueIncrement: true },
        'write': { uniqueIncrement: true },
        'registeredWithinWeek': { uniqueIncrement: true },
        'registeredWithinMonth': { uniqueIncrement: true },
        'registeredWithinYear': { uniqueIncrement: true },
        'registeredOutsideWeek': { uniqueIncrement: true },
        'registeredOutsideMonth': { uniqueIncrement: true },
        'registeredOutsideYear': { uniqueIncrement: true },
    },
    'apRequest': {
        'deliverFailed': { },
        'deliverSucceeded': { },
        'inboxReceived': { },
    },
    'drive': {
        'local.incCount': {},
        'local.incSize': {}, // in kilobyte
        'local.decCount': {},
        'local.decSize': {}, // in kilobyte
        'remote.incCount': {},
        'remote.incSize': {}, // in kilobyte
        'remote.decCount': {},
        'remote.decSize': {}, // in kilobyte
    },
    'federation': {
        'deliveredInstances': { uniqueIncrement: true, range: 'small' },
        'inboxInstances': { uniqueIncrement: true, range: 'small' },
        'stalled': { uniqueIncrement: true, range: 'small' },
        'sub': { accumulate: true, range: 'small' },
        'pub': { accumulate: true, range: 'small' },
        'pubsub': { accumulate: true, range: 'small' },
        'subActive': { accumulate: true, range: 'small' },
        'pubActive': { accumulate: true, range: 'small' },
    },
    'instance': {
        'requests.failed': { range: 'small' },
        'requests.succeeded': { range: 'small' },
        'requests.received': { range: 'small' },
        'notes.total': { accumulate: true },
        'notes.inc': {},
        'notes.dec': {},
        'notes.diffs.normal': {},
        'notes.diffs.reply': {},
        'notes.diffs.renote': {},
        'notes.diffs.withFile': {},
        'users.total': { accumulate: true },
        'users.inc': { range: 'small' },
        'users.dec': { range: 'small' },
        'following.total': { accumulate: true },
        'following.inc': { range: 'small' },
        'following.dec': { range: 'small' },
        'followers.total': { accumulate: true },
        'followers.inc': { range: 'small' },
        'followers.dec': { range: 'small' },
        'drive.totalFiles': { accumulate: true },
        'drive.incFiles': {},
        'drive.decFiles': {},
        'drive.incUsage': {}, // in kilobyte
        'drive.decUsage': {}, // in kilobyte
    },
    'notes': {
        'totalCount': { accumulate: true },
        'totalSize': { accumulate: true }, // in kilobyte
        'incCount': { range: 'small' },
        'incSize': {}, // in kilobyte
        'decCount': { range: 'small' },
        'decSize': {}, // in kilobyte
    },
    'perUserDrive': {
        'totalCount': { accumulate: true },
        'totalSize': { accumulate: true }, // in kilobyte
        'incCount': { range: 'small' },
        'incSize': {}, // in kilobyte
        'decCount': { range: 'small' },
        'decSize': {}, // in kilobyte
    },
    'perUserFollowing': {
        'local.followings.total': { accumulate: true },
        'local.followings.inc': { range: 'small' },
        'local.followings.dec': { range: 'small' },
        'local.followers.total': { accumulate: true },
        'local.followers.inc': { range: 'small' },
        'local.followers.dec': { range: 'small' },
        'remote.followings.total': { accumulate: true },
        'remote.followings.inc': { range: 'small' },
        'remote.followings.dec': { range: 'small' },
        'remote.followers.total': { accumulate: true },
        'remote.followers.inc': { range: 'small' },
        'remote.followers.dec': { range: 'small' },
    },
    'perUserNotes': {
        'total': { accumulate: true },
        'inc': { range: 'small' },
        'dec': { range: 'small' },
        'diffs.normal': { range: 'small' },
        'diffs.reply': { range: 'small' },
        'diffs.renote': { range: 'small' },
        'diffs.withFile': { range: 'small' },
    },
    'perUserPv': {
        'upv.user': { uniqueIncrement: true, range: 'small' },
        'pv.user': { range: 'small' },
        'upv.visitor': { uniqueIncrement: true, range: 'small' },
        'pv.visitor': { range: 'small' },
    },
    'perUserReactions': {
        'local.count': { range: 'small' },
        'remote.count': { range: 'small' },
    },
    'testGrouped': {
        'foo.total': { accumulate: true },
        'foo.inc': {},
        'foo.dec': {},
    },
    'testIntersection': {
        'a': { uniqueIncrement: true },
        'b': { uniqueIncrement: true },
        'aAndB': { intersection: ['a', 'b'] },
    },
    'testUnique': {
        'foo': { uniqueIncrement: true },
    },
    'test': {
        'foo.total': { accumulate: true },
        'foo.inc': {},
        'foo.dec': {},
    },
    'users': {
        'local.total': { accumulate: true },
        'local.inc': { range: 'small' },
        'local.dec': { range: 'small' },
        'remote.total': { accumulate: true },
        'remote.inc': { range: 'small' },
        'remote.dec': { range: 'small' },
    },
} as const satisfies Record<string, ChartSchema>;
