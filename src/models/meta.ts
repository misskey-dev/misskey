import { Entity, Index, JoinColumn, ManyToOne, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Meta {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column('varchar', {
		length: 128, nullable: true
	})
	public name: string;

	@Column('varchar', {
		length: 1024, nullable: true
	})
	public description: string;

	/**
	 * メンテナの名前
	 */
	@Column('varchar', {
		length: 128, nullable: true
	})
	public maintainer: string;

	/**
	 * メンテナの連絡先
	 */
	@Column('varchar', {
		length: 128, nullable: true
	})
	public email: string;

	@Column('jsonb', {
		default: [],
	})
	public announcements: Record<string, any>[];

	@Column('boolean', {
		default: false,
	})
	public disableRegistration: boolean;

	@Column('boolean', {
		default: false,
	})
	public disableLocalTimeline: boolean;

	@Column('boolean', {
		default: false,
	})
	public disableGlobalTimeline: boolean;

	@Column('boolean', {
		default: true,
	})
	public enableEmojiReaction: boolean;

	@Column('boolean', {
		default: false,
	})
	public useStarForReactionFallback: boolean;

	@Column('simple-array', {
		default: [],
	})
	public hiddenTags: string[];

	@Column('varchar', {
		length: 256,
		nullable: true
	})
	public mascotImageUrl: string | null;

	@Column('varchar', {
		length: 256,
		nullable: true
	})
	public bannerUrl: string | null;

	@Column('varchar', {
		length: 256,
		nullable: true
	})
	public errorImageUrl: string | null;

	@Column('varchar', {
		length: 256,
		nullable: true
	})
	public iconUrl: string | null;

	@Column('boolean', {
		default: true,
	})
	public cacheRemoteFiles: boolean;

	@Column('varchar', {
		length: 128,
		nullable: true
	})
	public proxyAccount: string | null;

	@Column('boolean', {
		default: false,
	})
	public enableRecaptcha: boolean;

	@Column('varchar', {
		length: 64,
		nullable: true
	})
	public recaptchaSiteKey: string | null;

	@Column('varchar', {
		length: 64,
		nullable: true
	})
	public recaptchaSecretKey: string | null;
}

export type IMeta = {
	/**
	 * Drive capacity of a local user (MB)
	 */
	localDriveCapacityMb?: number;

	/**
	 * Drive capacity of a remote user (MB)
	 */
	remoteDriveCapacityMb?: number;

	/**
	 * Max allowed note text length in characters
	 */
	maxNoteTextLength?: number;

	summalyProxy?: string;

	enableTwitterIntegration?: boolean;
	twitterConsumerKey?: string;
	twitterConsumerSecret?: string;

	enableGithubIntegration?: boolean;
	githubClientId?: string;
	githubClientSecret?: string;

	enableDiscordIntegration?: boolean;
	discordClientId?: string;
	discordClientSecret?: string;

	enableExternalUserRecommendation?: boolean;
	externalUserRecommendationEngine?: string;
	externalUserRecommendationTimeout?: number;

	enableEmail?: boolean;
	email?: string;
	smtpSecure?: boolean;
	smtpHost?: string;
	smtpPort?: number;
	smtpUser?: string;
	smtpPass?: string;

	enableServiceWorker?: boolean;
	swPublicKey?: string;
	swPrivateKey?: string;
};
