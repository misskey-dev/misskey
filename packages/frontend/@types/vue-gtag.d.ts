declare module 'vue-gtag' {
	export type GtagConsent = (command: 'consent', arg: 'default' | 'update', params: GtagConsentParams): void;

	export interface GtagConsentParams {
		ad_storage?: 'granted' | 'denied',
		ad_user_data?: 'granted' | 'denied',
		ad_personalization?: 'granted' | 'denied',
		analytics_storage?: 'granted' | 'denied',
		functionality_storage?: 'granted' | 'denied',
		personalization_storage?: 'granted' | 'denied',
		security_storage?: 'granted' | 'denied',
		wait_for_update?: number
	}
}
