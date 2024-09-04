/*
 * SPDX-FileCopyrightText: Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { MiRemoteUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { isCreate } from '@/core/activitypub/type.js';
import type { IObject, IPost } from '@/core/activitypub/type.js';
import type { InstancesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from '@/core/UtilityService.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import type { InboxRuleCondFormulaValue } from '@/models/InboxRule.js';
import { ApMentionService } from '@/core/activitypub/models/ApMentionService.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';

@Injectable()
export class InboxRuleService {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,
		private idService: IdService,
		private utilityService: UtilityService,
		private instanceEntityService: InstanceEntityService,
		private apMentionService: ApMentionService,
		private apResolverService: ApResolverService,
	) {
	}

	@bindThis
	async evalCond(activity: IObject, user: MiRemoteUser, value: InboxRuleCondFormulaValue): Promise<boolean> {
		const instanceUnpack = await this.instancesRepository
			.findOneBy({ host: this.utilityService.toPuny(user.host) });
		if (!instanceUnpack) {
			return false;
		}
		const instance = await this.instanceEntityService.pack(instanceUnpack, user);
		try {
			switch (value.type) {
				// ～かつ～
				case 'and': {
					return value.values.every(v => this.evalCond(activity, user, v));
				}
				// ～または～
				case 'or': {
					return value.values.some(v => this.evalCond(activity, user, v));
				}
				// ～ではない
				case 'not': {
					return !await this.evalCond(activity, user, value.value);
				}
				// サスペンド済みユーザである
				case 'isSuspended': {
					return user.isSuspended;
				}
				// 鍵アカウントユーザである
				case 'isLocked': {
					return user.isLocked;
				}
				// botユーザである
				case 'isBot': {
					return user.isBot;
				}
				// 猫である
				case 'isCat': {
					return user.isCat;
				}
				// ユーザが作成されてから指定期間経過した
				case 'createdLessThan': {
					return this.idService.parse(user.id).date.getTime() > (Date.now() - (value.sec * 1000));
				}
				// ユーザが作成されてから指定期間経っていない
				case 'createdMoreThan': {
					return this.idService.parse(user.id).date.getTime() < (Date.now() - (value.sec * 1000));
				}
				// フォロワー数が指定値以下
				case 'followersLessThanOrEq': {
					return user.followersCount <= value.value;
				}
				// フォロワー数が指定値以上
				case 'followersMoreThanOrEq': {
					return user.followersCount >= value.value;
				}
				// フォロー数が指定値以下
				case 'followingLessThanOrEq': {
					return user.followingCount <= value.value;
				}
				// フォロー数が指定値以上
				case 'followingMoreThanOrEq': {
					return user.followingCount >= value.value;
				}
				// ノート数が指定値以下
				case 'notesLessThanOrEq': {
					return user.notesCount <= value.value;
				}
				// ノート数が指定値以上
				case 'notesMoreThanOrEq': {
					return user.notesCount >= value.value;
				}
				// メンション数が指定値以上
				case 'maxMentionsMoreThanOrEq': {
					if (isCreate(activity)) {
						const apMentions = await this.apMentionService.extractApMentions(activity.tag as unknown as IPost, this.apResolverService.createResolver());

						return apMentions.length ? apMentions.length >= value.value : false;
					}
					return false;
				}
				// 添付ファイル数が指定値以上
				case 'attachmentFileMoreThanOrEq': {
					if (isCreate(activity)) {
						return activity.attachment?.length ? activity.attachment.length >= value.value : false;
					}
					return false;
				}
				// 指定されたワードが含まれている
				case 'isIncludeThisWord': {
					if (isCreate(activity)) {
						return this.utilityService.isKeyWordIncluded(typeof activity.content === 'string' ? activity.content : '', [value.value]);
					}
					return false;
				}
				// 指定されたサーバーホスト
				case 'serverHost': {
					return user.host === value.value;
				}
				// 指定されたサーバーソフトウェア
				case 'serverSoftware': {
					return instance.softwareName === value.value;
				}
				// サーバーサイレンスされている
				case 'serverIsSilenced': {
					return instance.isSilenced;
				}
				// このサーバーのユーザーからフォローされているユーザーの数が～以下
				case 'serverPubLessThanOrEq': {
					return instance.followersCount <= value.value;
				}
				// このサーバーのユーザーからフォローされているユーザーの数が～以上
				case 'serverPubMoreThanOrEq': {
					return instance.followersCount >= value.value;
				}
				// このサーバーのユーザーをフォローしているユーザーの数が～以下
				case 'serverSubLessThanOrEq': {
					return instance.followingCount <= value.value;
				}
				// このサーバーのユーザーをフォローしているユーザーの数が～以上
				case 'serverSubMoreThanOrEq': {
					return instance.followingCount >= value.value;
				}

				default:
					return false;
			}
		} catch (err) {
			// TODO: log error
			return false;
		}
	}
}
