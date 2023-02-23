import { Entity, Index, JoinColumn, ManyToOne, Column, PrimaryColumn } from 'typeorm';
import { notificationTypes, obsoleteNotificationTypes } from '@/types.js';
import { id } from '../id.js';
import { User } from './User.js';
import { Note } from './Note.js';
import { FollowRequest } from './FollowRequest.js';
import { AccessToken } from './AccessToken.js';

@Entity()
export class Notification {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Notification.',
	})
	public createdAt: Date;

	/**
	 * 通知の受信者
	 */
	@Index()
	@Column({
		...id(),
		comment: 'The ID of recipient user of the Notification.',
	})
	public notifieeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public notifiee: User | null;

	/**
	 * 通知の送信者(initiator)
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of sender user of the Notification.',
	})
	public notifierId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public notifier: User | null;

	/**
	 * 通知の種類。
	 * follow - フォローされた
	 * mention - 投稿で自分が言及された
	 * reply - 投稿に返信された
	 * renote - 投稿がRenoteされた
	 * quote - 投稿が引用Renoteされた
	 * reaction - 投稿にリアクションされた
	 * pollEnded - 自分のアンケートもしくは自分が投票したアンケートが終了した
	 * receiveFollowRequest - フォローリクエストされた
	 * followRequestAccepted - 自分の送ったフォローリクエストが承認された
	 * achievementEarned - 実績を獲得
	 * app - アプリ通知
	 */
	@Index()
	@Column('enum', {
		enum: [
			...notificationTypes,
			...obsoleteNotificationTypes,
		],
		comment: 'The type of the Notification.',
	})
	public type: typeof notificationTypes[number];

	/**
	 * 通知が読まれたかどうか
	 */
	@Index()
	@Column('boolean', {
		default: false,
		comment: 'Whether the Notification is read.',
	})
	public isRead: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public noteId: Note['id'] | null;

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Column({
		...id(),
		nullable: true,
	})
	public followRequestId: FollowRequest['id'] | null;

	@ManyToOne(type => FollowRequest, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public followRequest: FollowRequest | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public reaction: string | null;

	@Column('integer', {
		nullable: true,
	})
	public choice: number | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public achievement: string | null;

	/**
	 * アプリ通知のbody
	 */
	@Column('varchar', {
		length: 2048, nullable: true,
	})
	public customBody: string | null;

	/**
	 * アプリ通知のheader
	 * (省略時はアプリ名で表示されることを期待)
	 */
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public customHeader: string | null;

	/**
	 * アプリ通知のicon(URL)
	 * (省略時はアプリアイコンで表示されることを期待)
	 */
	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public customIcon: string | null;

	/**
	 * アプリ通知のアプリ(のトークン)
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public appAccessTokenId: AccessToken['id'] | null;

	@ManyToOne(type => AccessToken, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public appAccessToken: AccessToken | null;
}
