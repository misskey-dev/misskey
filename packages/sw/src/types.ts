import * as Misskey from 'misskey-js';

export type swMessageOrderType = 'post' | 'push';

export type SwMessage = {
	type: 'order';
	order: swMessageOrderType;
	loginId: string;
	url: string;
	[x: string]: any;
};

// Defined also @/core/PushNotificationService.ts#L12
type pushNotificationDataSourceMap = {
	notification: Misskey.entities.Notification;
	unreadAntennaNote: {
		antenna: { id: string, name: string };
		note: Misskey.entities.Note;
	};
	readNotifications: { notificationIds: string[] };
	readAllNotifications: undefined;
	readAntenna: { antennaId: string };
	readAllAntennas: undefined;
};

export type pushNotificationData<K extends keyof pushNotificationDataSourceMap> = {
	type: K;
	body: pushNotificationDataSourceMap[K];
	userId: string;
	dateTime: number;
};

export type pushNotificationDataMap = {
	[K in keyof pushNotificationDataSourceMap]: pushNotificationData<K>;
};

export type badgeNames = 
	'null'
	| 'antenna'
	| 'arrow-back-up'
	| 'at'
	| 'chart-arrows'
	| 'circle-check'
	| 'messages'
	| 'plus'
	| 'quote'
	| 'repeat'
	| 'user-plus'
	| 'users'
	;
