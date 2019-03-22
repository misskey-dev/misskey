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


}

export type IMeta = {

	stats?: {
		notesCount: number;
		originalNotesCount: number;
		usersCount: number;
		originalUsersCount: number;
	};

	disableRegistration?: boolean;
	disableLocalTimeline?: boolean;
	disableGlobalTimeline?: boolean;
	enableEmojiReaction?: boolean;
	useStarForReactionFallback?: boolean;
	hidedTags?: string[];
	mascotImageUrl?: string;
	bannerUrl?: string;
	errorImageUrl?: string;
	iconUrl?: string;

	cacheRemoteFiles?: boolean;

	proxyAccount?: string;

	enableRecaptcha?: boolean;
	recaptchaSiteKey?: string;
	recaptchaSecretKey?: string;

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
