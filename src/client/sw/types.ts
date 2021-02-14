export type swMessageOrderType = 'post' | 'push-user' | 'push-note' | 'push-messaging-room'

export type SwMessage = {
    type: 'order';
    order: swMessageOrderType;
    loginId: string;
    url: string;
    [x: string]: any;
};
