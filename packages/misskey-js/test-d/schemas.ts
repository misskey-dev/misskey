import { Packed, Def } from '../src/schemas';
import { expectType } from 'tsd';

describe('schemas', () => {
    test('user', () => {
        type UserLite = Packed<'UserLite'>;
        expectType<UserLite>({
            id: 'string',
            name: null,
            username: 'string',
            host: null,
            avatarUrl: 'string',
            avatarBlurhash: 'string',
            isAdmin: false,
            isModerator: false,
            isBot: false,
            isCat: false,
            onlineStatus: null,
        });
        type UserDetailedNotMeOnly = Packed<'UserDetailedNotMeOnly'>;
        type UserDetailedNotMe = Packed<'UserDetailedNotMe'>;
        type MeDetailed = Packed<'MeDetailed'>;
        type User = Packed<'User'>;
        type UserDetailed = Packed<'UserDetailed'>;
    });
    test('user list', () => {
        type UserList = Packed<'UserList'>;
    });
    test('app', () => {
        type App = Packed<'App'>;
    });
    test('note', () => {
        type Note = Packed<'Note'>;
    });
    test('note reaction', () => {
        type NoteReaction = Packed<'NoteReaction'>;
    });
    test('note favorite', () => {
        type NoteFavorite = Packed<'NoteFavorite'>;
    });
    test('notification', () => {
        type Notification = Packed<'Notification'>;
        type NotificationStrict = Packed<'NotificationStrict'>;
    });
    test('drive file', () => {
        type DriveFile = Packed<'DriveFile'>;
    });
    test('drive folder', () => {
        type DriveFolder = Packed<'DriveFolder'>;
    });
    test('following', () => {
        type Following = Packed<'Following'>;
    });
    test('muting', () => {
        type Muting = Packed<'Muting'>;
    });
    test('renote muting', () => {
        type RenoteMuting = Packed<'RenoteMuting'>;
    });
    test('blocking', () => {
        type Blocking = Packed<'Blocking'>;
    });
    test('hashtag', () => {
        type Hashtag = Packed<'Hashtag'>;
    });
    test('page', () => {
        type Page = Packed<'Page'>;
    });
    test('channel', () => {
        type Channel = Packed<'Channel'>;
    });
    test('queue count', () => {
        type QueueCount = Packed<'QueueCount'>;
    });
    test('antenna', () => {
        type Antenna = Packed<'Antenna'>;
    });
    test('clip', () => {
        type Clip = Packed<'Clip'>;
    });
    test('federation instance', () => {
        type FederationInstance = Packed<'FederationInstance'>;
    });
    test('gallery post', () => {
        type GalleryPost = Packed<'GalleryPost'>;
    });
    test('emoji', () => {
        type EmojiSimple = Packed<'EmojiSimple'>;
        type EmojiDetailed = Packed<'EmojiDetailed'>;
    });
    test('flash', () => {
        type Flash = Packed<'Flash'>;
    });
    test('announcement', () => {
        type Announcement = Packed<'Announcement'>;
    });
    test('ad', () => {
        type Ad = Packed<'Ad'>;
    });
    test('relay', () => {
        type Relay = Packed<'Relay'>;
    });
    test('role': () => {

        type RoleAssign = Packed<'RoleAssign'>;
    });
    test('error', () => {
        type Error = Packed<'Error'>;
        type ApiError = Packed<'ApiError'>;
    });
});
