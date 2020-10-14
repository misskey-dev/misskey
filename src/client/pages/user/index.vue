<template>
<div class="mk-user-page" v-if="user" v-size="{ max: [500] }">
	<MkRemoteCaution v-if="user.host != null" :href="user.url" style="margin-bottom: var(--margin)"/>

	<!-- TODO -->
	<!-- <div class="punished" v-if="user.isSuspended"><Fa :icon="faExclamationTriangle" style="margin-right: 8px;"/> {{ $t('userSuspended') }}</div> -->
	<!-- <div class="punished" v-if="user.isSilenced"><Fa :icon="faExclamationTriangle" style="margin-right: 8px;"/> {{ $t('userSilenced') }}</div> -->

	<div class="profile _section _fitBottom">
		<div class="_content" :key="user.id">
			<div class="banner-container" :style="style">
				<div class="banner" ref="banner" :style="style"></div>
				<div class="fade"></div>
				<div class="title">
					<MkUserName class="name" :user="user" :nowrap="true"/>
					<div class="bottom">
						<span class="username"><MkAcct :user="user" :detail="true" /></span>
						<span v-if="user.isAdmin" :title="$t('isAdmin')" style="color: var(--badge);"><Fa :icon="faBookmark"/></span>
						<span v-if="!user.isAdmin && user.isModerator" :title="$t('isModerator')" style="color: var(--badge);"><Fa :icon="farBookmark"/></span>
						<span v-if="user.isLocked" :title="$t('isLocked')"><Fa :icon="faLock"/></span>
						<span v-if="user.isBot" :title="$t('isBot')"><Fa :icon="faRobot"/></span>
					</div>
				</div>
				<span class="followed" v-if="$store.getters.isSignedIn && $store.state.i.id != user.id && user.isFollowed">{{ $t('followsYou') }}</span>
				<div class="actions" v-if="$store.getters.isSignedIn">
					<button @click="menu" class="menu _button"><Fa :icon="faEllipsisH"/></button>
					<MkFollowButton v-if="$store.state.i.id != user.id" :user="user" :inline="true" :transparent="false" :full="true" class="koudoku"/>
				</div>
			</div>
			<MkAvatar class="avatar" :user="user" :disable-preview="true"/>
			<div class="title">
				<MkUserName :user="user" :nowrap="false" class="name"/>
				<div class="bottom">
					<span class="username"><MkAcct :user="user" :detail="true" /></span>
					<span v-if="user.isAdmin" :title="$t('isAdmin')" style="color: var(--badge);"><Fa :icon="faBookmark"/></span>
					<span v-if="!user.isAdmin && user.isModerator" :title="$t('isModerator')" style="color: var(--badge);"><Fa :icon="farBookmark"/></span>
					<span v-if="user.isLocked" :title="$t('isLocked')"><Fa :icon="faLock"/></span>
					<span v-if="user.isBot" :title="$t('isBot')"><Fa :icon="faRobot"/></span>
				</div>
			</div>
			<div class="description">
				<Mfm v-if="user.description" :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
				<p v-else class="empty">{{ $t('noAccountDescription') }}</p>
			</div>
			<div class="fields system">
				<dl class="field" v-if="user.location">
					<dt class="name"><Fa :icon="faMapMarker" fixed-width/> {{ $t('location') }}</dt>
					<dd class="value">{{ user.location }}</dd>
				</dl>
				<dl class="field" v-if="user.birthday">
					<dt class="name"><Fa :icon="faBirthdayCake" fixed-width/> {{ $t('birthday') }}</dt>
					<dd class="value">{{ user.birthday.replace('-', '/').replace('-', '/') }} ({{ $t('yearsOld', { age }) }})</dd>
				</dl>
				<dl class="field">
					<dt class="name"><Fa :icon="faCalendarAlt" fixed-width/> {{ $t('registeredDate') }}</dt>
					<dd class="value">{{ new Date(user.createdAt).toLocaleString() }} (<MkTime :time="user.createdAt"/>)</dd>
				</dl>
			</div>
			<div class="fields" v-if="user.fields.length > 0">
				<dl class="field" v-for="(field, i) in user.fields" :key="i">
					<dt class="name">
						<Mfm :text="field.name" :plain="true" :custom-emojis="user.emojis" :colored="false"/>
					</dt>
					<dd class="value">
						<Mfm :text="field.value" :author="user" :i="$store.state.i" :custom-emojis="user.emojis" :colored="false"/>
					</dd>
				</dl>
			</div>
			<div class="status">
				<router-link :to="userPage(user)" :class="{ active: $route.name === 'user' }">
					<b>{{ number(user.notesCount) }}</b>
					<span>{{ $t('notes') }}</span>
				</router-link>
				<router-link :to="userPage(user, 'following')" :class="{ active: $route.name === 'userFollowing' }">
					<b>{{ number(user.followingCount) }}</b>
					<span>{{ $t('following') }}</span>
				</router-link>
				<router-link :to="userPage(user, 'followers')" :class="{ active: $route.name === 'userFollowers' }">
					<b>{{ number(user.followersCount) }}</b>
					<span>{{ $t('followers') }}</span>
				</router-link>
			</div>
		</div>
	</div>

	<router-view :user="user"></router-view>
	<template v-if="$route.name == 'user'">
		<div class="_section" v-if="user.pinnedNotes.length > 0">
			<div class="_content">
				<XNote v-for="note in user.pinnedNotes" class="note _vMargin" :note="note" @update:note="pinnedNoteUpdated(note, $event)" :key="note.id" :detail="true" :pinned="true"/>
			</div>
		</div>
		<div class="_section">
			<MkContainer :body-togglable="true" class="_content">
				<template #header><Fa :icon="faImage"/>{{ $t('images') }}</template>
				<div>
					<XPhotos :user="user" :key="user.id"/>
				</div>
			</MkContainer>
		</div>
		<div class="_section">
			<MkContainer :body-togglable="true" class="_content">
				<template #header><Fa :icon="faChartBar"/>{{ $t('activity') }}</template>
				<div style="padding:8px;">
					<XActivity :user="user" :key="user.id"/>
				</div>
			</MkContainer>
		</div>
		<div class="_section">
			<XUserTimeline :user="user" class="_content"/>
		</div>
	</template>
</div>
<div v-else-if="error">
	<MkError @retry="fetch()"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import { faExclamationTriangle, faEllipsisH, faRobot, faLock, faBookmark, faChartBar, faImage, faBirthdayCake, faMapMarker } from '@fortawesome/free-solid-svg-icons';
import { faCalendarAlt, faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import * as age from 's-age';
import XUserTimeline from './index.timeline.vue';
import XNote from '@/components/note.vue';
import MkFollowButton from '@/components/follow-button.vue';
import MkContainer from '@/components/ui/container.vue';
import MkRemoteCaution from '@/components/remote-caution.vue';
import Progress from '@/scripts/loading';
import parseAcct from '../../../misc/acct/parse';
import { getScrollPosition } from '@/scripts/scroll';
import { getUserMenu } from '@/scripts/get-user-menu';
import number from '../../filters/number';
import { userPage, acct } from '../../filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		XUserTimeline,
		XNote,
		MkFollowButton,
		MkContainer,
		MkRemoteCaution,
		XPhotos: defineAsyncComponent(() => import('./index.photos.vue')),
		XActivity: defineAsyncComponent(() => import('./index.activity.vue')),
	},

	data() {
		return {
			INFO: computed(() => this.user ? {
				header: [{
					userName: this.user,
					avatar: this.user,
				}],
				action: {
					icon: faEllipsisH,
					handler: this.menu
				}
			} : null),
			user: null,
			error: null,
			parallaxAnimationId: null,
			faExclamationTriangle, faEllipsisH, faRobot, faLock, faBookmark, farBookmark, faChartBar, faImage, faBirthdayCake, faMapMarker, faCalendarAlt
		};
	},

	computed: {
		style(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},

		age(): number {
			return age(this.user.birthday);
		}
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	mounted() {
		window.requestAnimationFrame(this.parallaxLoop);
	},

	beforeUnmount() {
		window.cancelAnimationFrame(this.parallaxAnimationId);
	},

	methods: {
		fetch() {
			if (this.$route.params.user == null) return;
			Progress.start();
			os.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
			}).catch(e => {
				this.error = e;
			}).finally(() => {
				Progress.done();
			});
		},

		menu(ev) {
			os.modalMenu(getUserMenu(this.user), ev.currentTarget || ev.target);
		},

		parallaxLoop() {
			this.parallaxAnimationId = window.requestAnimationFrame(this.parallaxLoop);
			this.parallax();
		},

		parallax() {
			const banner = this.$refs.banner as any;
			if (banner == null) return;

			const top = getScrollPosition(this.$el);

			if (top < 0) return;

			const z = 1.75; // 奥行き(小さいほど奥)
			const pos = -(top / z);
			banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;
		},

		pinnedNoteUpdated(oldValue, newValue) {
			const i = this.user.pinnedNotes.findIndex(n => n === oldValue);
			this.user.pinnedNotes[i] = newValue;
		},

		number,

		userPage
	}
});
</script>

<style lang="scss" scoped>
.mk-user-page {
	> .punished {
		font-size: 0.8em;
		padding: 16px;
	}

	> .profile {
		> ._content {
			position: relative;
			overflow: hidden;

			> .banner-container {
				position: relative;
				height: 250px;
				overflow: hidden;
				background-size: cover;
				background-position: center;
				border-radius: 12px;

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
					-webkit-backdrop-filter: blur(8px);
					backdrop-filter: blur(8px);
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
				border-bottom: solid 1px var(--divider);

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
				border-top: solid 1px var(--divider);

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
					}
				}

				&.system > .field > .name {
				}
			}

			> .status {
				display: flex;
				padding: 24px;
				border-top: solid 1px var(--divider);

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

	> .content {
		margin-bottom: var(--margin);
	}

	&.max-width_500px {
		> .profile > ._content {
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
	}
}
</style>
