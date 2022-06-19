<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<div ref="rootEl">
		<transition name="fade" mode="out-in">
			<MkSpacer v-if="user" :content-max="narrow ? 800 : 1100">
				<div v-size="{ max: [500] }" class="ftskorzw" :class="{ wide: !narrow }">
					<div class="main">
						<!-- TODO -->
						<!-- <div class="punished" v-if="user.isSuspended"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i> {{ $ts.userSuspended }}</div> -->
						<!-- <div class="punished" v-if="user.isSilenced"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i> {{ $ts.userSilenced }}</div> -->

						<div class="profile">
							<MkRemoteCaution v-if="user.host != null" :href="user.url" class="warn"/>

							<div :key="user.id" class="_block main">
								<div class="banner-container" :style="style">
									<div ref="bannerEl" class="banner" :style="style"></div>
									<div class="fade"></div>
									<div class="title">
										<MkUserName class="name" :user="user" :nowrap="true"/>
										<div class="bottom">
											<span class="username"><MkAcct :user="user" :detail="true"/></span>
											<span v-if="user.isAdmin" :title="$ts.isAdmin" style="color: var(--badge);"><i class="fas fa-bookmark"></i></span>
											<span v-if="!user.isAdmin && user.isModerator" :title="$ts.isModerator" style="color: var(--badge);"><i class="far fa-bookmark"></i></span>
											<span v-if="user.isLocked" :title="$ts.isLocked"><i class="fas fa-lock"></i></span>
											<span v-if="user.isBot" :title="$ts.isBot"><i class="fas fa-robot"></i></span>
										</div>
									</div>
									<span v-if="$i && $i.id != user.id && user.isFollowed" class="followed">{{ $ts.followsYou }}</span>
									<div v-if="$i" class="actions">
										<button class="menu _button" @click="menu"><i class="fas fa-ellipsis-h"></i></button>
										<MkFollowButton v-if="$i.id != user.id" :user="user" :inline="true" :transparent="false" :full="true" class="koudoku"/>
									</div>
								</div>
								<MkAvatar class="avatar" :user="user" :disable-preview="true" :show-indicator="true"/>
								<div class="title">
									<MkUserName :user="user" :nowrap="false" class="name"/>
									<div class="bottom">
										<span class="username"><MkAcct :user="user" :detail="true"/></span>
										<span v-if="user.isAdmin" :title="$ts.isAdmin" style="color: var(--badge);"><i class="fas fa-bookmark"></i></span>
										<span v-if="!user.isAdmin && user.isModerator" :title="$ts.isModerator" style="color: var(--badge);"><i class="far fa-bookmark"></i></span>
										<span v-if="user.isLocked" :title="$ts.isLocked"><i class="fas fa-lock"></i></span>
										<span v-if="user.isBot" :title="$ts.isBot"><i class="fas fa-robot"></i></span>
									</div>
								</div>
								<div class="description">
									<Mfm v-if="user.description" :text="user.description" :is-note="false" :author="user" :i="$i" :custom-emojis="user.emojis"/>
									<p v-else class="empty">{{ $ts.noAccountDescription }}</p>
								</div>
								<div class="fields system">
									<dl v-if="user.location" class="field">
										<dt class="name"><i class="fas fa-map-marker fa-fw"></i> {{ $ts.location }}</dt>
										<dd class="value">{{ user.location }}</dd>
									</dl>
									<dl v-if="user.birthday" class="field">
										<dt class="name"><i class="fas fa-birthday-cake fa-fw"></i> {{ $ts.birthday }}</dt>
										<dd class="value">{{ user.birthday.replace('-', '/').replace('-', '/') }} ({{ $t('yearsOld', { age }) }})</dd>
									</dl>
									<dl class="field">
										<dt class="name"><i class="fas fa-calendar-alt fa-fw"></i> {{ $ts.registeredDate }}</dt>
										<dd class="value">{{ new Date(user.createdAt).toLocaleString() }} (<MkTime :time="user.createdAt"/>)</dd>
									</dl>
								</div>
								<div v-if="user.fields.length > 0" class="fields">
									<dl v-for="(field, i) in user.fields" :key="i" class="field">
										<dt class="name">
											<Mfm :text="field.name" :plain="true" :custom-emojis="user.emojis" :colored="false"/>
										</dt>
										<dd class="value">
											<Mfm :text="field.value" :author="user" :i="$i" :custom-emojis="user.emojis" :colored="false"/>
										</dd>
									</dl>
								</div>
								<div class="status">
									<MkA v-click-anime :to="userPage(user)" :class="{ active: page === 'index' }">
										<b>{{ number(user.notesCount) }}</b>
										<span>{{ $ts.notes }}</span>
									</MkA>
									<MkA v-click-anime :to="userPage(user, 'following')" :class="{ active: page === 'following' }">
										<b>{{ number(user.followingCount) }}</b>
										<span>{{ $ts.following }}</span>
									</MkA>
									<MkA v-click-anime :to="userPage(user, 'followers')" :class="{ active: page === 'followers' }">
										<b>{{ number(user.followersCount) }}</b>
										<span>{{ $ts.followers }}</span>
									</MkA>
								</div>
							</div>
						</div>

						<div class="contents">
							<template v-if="page === 'index'">
								<div>
									<div v-if="user.pinnedNotes.length > 0" class="_gap">
										<XNote v-for="note in user.pinnedNotes" :key="note.id" class="note _block" :note="note" :pinned="true"/>
									</div>
									<MkInfo v-else-if="$i && $i.id === user.id">{{ $ts.userPagePinTip }}</MkInfo>
									<template v-if="narrow">
										<XPhotos :key="user.id" :user="user"/>
										<XActivity :key="user.id" :user="user" style="margin-top: var(--margin);"/>
									</template>
								</div>
								<div>
									<XUserTimeline :user="user"/>
								</div>
							</template>
							<XFollowList v-else-if="page === 'following'" type="following" :user="user" class="_content _gap"/>
							<XFollowList v-else-if="page === 'followers'" type="followers" :user="user" class="_content _gap"/>
							<XReactions v-else-if="page === 'reactions'" :user="user" class="_gap"/>
							<XClips v-else-if="page === 'clips'" :user="user" class="_gap"/>
							<XPages v-else-if="page === 'pages'" :user="user" class="_gap"/>
							<XGallery v-else-if="page === 'gallery'" :user="user" class="_gap"/>
						</div>
					</div>
					<div v-if="!narrow" class="sub">
						<XPhotos :key="user.id" :user="user"/>
						<XActivity :key="user.id" :user="user" style="margin-top: var(--margin);"/>
					</div>
				</div>
			</MkSpacer>
			<MkError v-else-if="error" @retry="fetch()"/>
			<MkLoading v-else/>
		</transition>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import calcAge from 's-age';
import * as Acct from 'misskey-js/built/acct';
import * as misskey from 'misskey-js';
import XUserTimeline from './index.timeline.vue';
import XNote from '@/components/note.vue';
import MkFollowButton from '@/components/follow-button.vue';
import MkContainer from '@/components/ui/container.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkRemoteCaution from '@/components/remote-caution.vue';
import MkTab from '@/components/tab.vue';
import MkInfo from '@/components/ui/info.vue';
import { getScrollPosition } from '@/scripts/scroll';
import { getUserMenu } from '@/scripts/get-user-menu';
import number from '@/filters/number';
import { userPage, acct as getAcct } from '@/filters/user';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { Router } from '@/nirax';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const XFollowList = defineAsyncComponent(() => import('./follow-list.vue'));
const XReactions = defineAsyncComponent(() => import('./reactions.vue'));
const XClips = defineAsyncComponent(() => import('./clips.vue'));
const XPages = defineAsyncComponent(() => import('./pages.vue'));
const XGallery = defineAsyncComponent(() => import('./gallery.vue'));
const XPhotos = defineAsyncComponent(() => import('./index.photos.vue'));
const XActivity = defineAsyncComponent(() => import('./index.activity.vue'));

const props = withDefaults(defineProps<{
	acct: string;
	page?: string;
}>(), {
	page: 'index',
});

const router: Router = inject('router') ?? mainRouter;

let user = $ref<null | misskey.entities.UserDetailed>(null);
let error = $ref(null);
let parallaxAnimationId = $ref<null | number>(null);
let narrow = $ref<null | boolean>(null);
let rootEl = $ref<null | HTMLElement>(null);
let bannerEl = $ref<null | HTMLElement>(null);

const style = $computed(() => {
	if (user?.bannerUrl == null) return {};
	return {
		backgroundImage: `url(${ user.bannerUrl })`,
	};
});

const age = $computed(() => {
	if (user == null) return null;
	return calcAge(user.birthday);
});

function fetchUser(): void {
	if (props.acct == null) return;
	user = null;
	os.api('users/show', Acct.parse(props.acct)).then(u => {
		user = u;
	}).catch(err => {
		error = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

function menu(ev) {
	os.popupMenu(getUserMenu(user), ev.currentTarget ?? ev.target);
}

function parallaxLoop() {
	parallaxAnimationId = window.requestAnimationFrame(parallaxLoop);
	parallax();
}

function parallax() {
	const banner = bannerEl as any;
	if (banner == null) return;

	const top = getScrollPosition(rootEl);

	if (top < 0) return;

	const z = 1.75; // 奥行き(小さいほど奥)
	const pos = -(top / z);
	banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;
}

onMounted(() => {
	window.requestAnimationFrame(parallaxLoop);
	narrow = rootEl!.clientWidth < 1000;
});

onUnmounted(() => {
	if (parallaxAnimationId) {
		window.cancelAnimationFrame(parallaxAnimationId);
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => user ? [{
	active: props.page === 'index',
	title: i18n.ts.overview,
	icon: 'fas fa-home',
	onClick: () => { router.push('/@' + getAcct(user)); },
}, ...($i && ($i.id === user.id)) || user.publicReactions ? [{
	active: props.page === 'reactions',
	title: i18n.ts.reaction,
	icon: 'fas fa-laugh',
	onClick: () => { router.push('/@' + getAcct(user) + '/reactions'); },
}] : [], {
	active: props.page === 'clips',
	title: i18n.ts.clips,
	icon: 'fas fa-paperclip',
	onClick: () => { router.push('/@' + getAcct(user) + '/clips'); },
}, {
	active: props.page === 'pages',
	title: i18n.ts.pages,
	icon: 'fas fa-file-alt',
	onClick: () => { router.push('/@' + getAcct(user) + '/pages'); },
}, {
	active: props.page === 'gallery',
	title: i18n.ts.gallery,
	icon: 'fas fa-icons',
	onClick: () => { router.push('/@' + getAcct(user) + '/gallery'); },
}] : null);

definePageMetadata(computed(() => user ? {
	icon: 'fas fa-user',
	title: user.name ? `${user.name} (@${user.username})` : `@${user.username}`,
	subtitle: `@${getAcct(user)}`,
	userName: user,
	avatar: user,
	path: `/@${user.username}`,
	share: {
		title: user.name,
	},
	bg: 'var(--bg)',
} : null));
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.ftskorzw {

	> .main {

		> .punished {
			font-size: 0.8em;
			padding: 16px;
		}

		> .profile {

			> .main {
				position: relative;
				overflow: hidden;

				> .banner-container {
					position: relative;
					height: 250px;
					overflow: hidden;
					background-size: cover;
					background-position: center;

					> .banner {
						height: 100%;
						background-color: #4c5e6d;
						background-size: cover;
						background-position: center;
						box-shadow: 0 0 128px rgba(0, 0, 0, 0.5) inset;
						will-change: background-position;
					}

					> .fade {
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						height: 78px;
						background: linear-gradient(transparent, rgba(#000, 0.7));
					}

					> .followed {
						position: absolute;
						top: 12px;
						left: 12px;
						padding: 4px 8px;
						color: #fff;
						background: rgba(0, 0, 0, 0.7);
						font-size: 0.7em;
						border-radius: 6px;
					}

					> .actions {
						position: absolute;
						top: 12px;
						right: 12px;
						-webkit-backdrop-filter: var(--blur, blur(8px));
						backdrop-filter: var(--blur, blur(8px));
						background: rgba(0, 0, 0, 0.2);
						padding: 8px;
						border-radius: 24px;

						> .menu {
							vertical-align: bottom;
							height: 31px;
							width: 31px;
							color: #fff;
							text-shadow: 0 0 8px #000;
							font-size: 16px;
						}

						> .koudoku {
							margin-left: 4px;
							vertical-align: bottom;
						}
					}

					> .title {
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						padding: 0 0 8px 154px;
						box-sizing: border-box;
						color: #fff;

						> .name {
							display: block;
							margin: 0;
							line-height: 32px;
							font-weight: bold;
							font-size: 1.8em;
							text-shadow: 0 0 8px #000;
						}

						> .bottom {
							> * {
								display: inline-block;
								margin-right: 16px;
								line-height: 20px;
								opacity: 0.8;

								&.username {
									font-weight: bold;
								}
							}
						}
					}
				}

				> .title {
					display: none;
					text-align: center;
					padding: 50px 8px 16px 8px;
					font-weight: bold;
					border-bottom: solid 0.5px var(--divider);

					> .bottom {
						> * {
							display: inline-block;
							margin-right: 8px;
							opacity: 0.8;
						}
					}
				}

				> .avatar {
					display: block;
					position: absolute;
					top: 170px;
					left: 16px;
					z-index: 2;
					width: 120px;
					height: 120px;
					box-shadow: 1px 1px 3px rgba(#000, 0.2);
				}

				> .description {
					padding: 24px 24px 24px 154px;
					font-size: 0.95em;

					> .empty {
						margin: 0;
						opacity: 0.5;
					}
				}

				> .fields {
					padding: 24px;
					font-size: 0.9em;
					border-top: solid 0.5px var(--divider);

					> .field {
						display: flex;
						padding: 0;
						margin: 0;
						align-items: center;

						&:not(:last-child) {
							margin-bottom: 8px;
						}

						> .name {
							width: 30%;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
							font-weight: bold;
							text-align: center;
						}

						> .value {
							width: 70%;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
							margin: 0;
						}
					}

					&.system > .field > .name {
					}
				}

				> .status {
					display: flex;
					padding: 24px;
					border-top: solid 0.5px var(--divider);

					> a {
						flex: 1;
						text-align: center;

						&.active {
							color: var(--accent);
						}

						&:hover {
							text-decoration: none;
						}

						> b {
							display: block;
							line-height: 16px;
						}

						> span {
							font-size: 70%;
						}
					}
				}
			}
		}

		> .contents {
			> .content {
				margin-bottom: var(--margin);
			}
		}
	}

	&.max-width_500px {
		> .main {
			> .profile > .main {
				> .banner-container {
					height: 140px;

					> .fade {
						display: none;
					}

					> .title {
						display: none;
					}
				}

				> .title {
					display: block;
				}

				> .avatar {
					top: 90px;
					left: 0;
					right: 0;
					width: 92px;
					height: 92px;
					margin: auto;
				}

				> .description {
					padding: 16px;
					text-align: center;
				}

				> .fields {
					padding: 16px;
				}

				> .status {
					padding: 16px;
				}
			}

			> .contents {
				> .nav {
					font-size: 80%;
				}
			}
		}
	}

	&.wide {
		display: flex;
		width: 100%;

		> .main {
			width: 100%;
			min-width: 0;
		}

		> .sub {
			max-width: 350px;
			min-width: 350px;
			margin-left: var(--margin);
		}
	}
}
</style>
