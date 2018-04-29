<template>
<div class="mk-settings">
	<div class="nav">
		<p :class="{ active: page == 'profile' }" @mousedown="page = 'profile'">%fa:user .fw%%i18n:@profile%</p>
		<p :class="{ active: page == 'web' }" @mousedown="page = 'web'">%fa:desktop .fw%Web</p>
		<p :class="{ active: page == 'notification' }" @mousedown="page = 'notification'">%fa:R bell .fw%%i18n:@notification%</p>
		<p :class="{ active: page == 'drive' }" @mousedown="page = 'drive'">%fa:cloud .fw%%i18n:@drive%</p>
		<p :class="{ active: page == 'mute' }" @mousedown="page = 'mute'">%fa:ban .fw%%i18n:@mute%</p>
		<p :class="{ active: page == 'apps' }" @mousedown="page = 'apps'">%fa:puzzle-piece .fw%%i18n:@apps%</p>
		<p :class="{ active: page == 'twitter' }" @mousedown="page = 'twitter'">%fa:B twitter .fw%Twitter</p>
		<p :class="{ active: page == 'security' }" @mousedown="page = 'security'">%fa:unlock-alt .fw%%i18n:@security%</p>
		<p :class="{ active: page == 'api' }" @mousedown="page = 'api'">%fa:key .fw%API</p>
		<p :class="{ active: page == 'other' }" @mousedown="page = 'other'">%fa:cogs .fw%%i18n:@other%</p>
	</div>
	<div class="pages">
		<section class="profile" v-show="page == 'profile'">
			<h1>%i18n:@profile%</h1>
			<x-profile/>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>動作</h1>
			<mk-switch v-model="clientSettings.fetchOnScroll" @change="onChangeFetchOnScroll" text="スクロールで自動読み込み">
				<span>ページを下までスクロールしたときに自動で追加のコンテンツを読み込みます。</span>
			</mk-switch>
			<mk-switch v-model="autoPopout" text="ウィンドウの自動ポップアウト">
				<span>ウィンドウが開かれるとき、ポップアウト(ブラウザ外に切り離す)可能なら自動でポップアウトします。この設定はブラウザに記憶されます。</span>
			</mk-switch>
			<details>
				<summary>詳細設定</summary>
				<mk-switch v-model="apiViaStream" text="ストリームを経由したAPIリクエスト">
					<span>この設定をオンにすると、websocket接続を経由してAPIリクエストが行われます(パフォーマンス向上が期待できます)。オフにすると、ネイティブの fetch APIが利用されます。この設定はこのデバイスのみ有効です。</span>
				</mk-switch>
			</details>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>デザインと表示</h1>
			<div class="div">
				<button class="ui button" @click="customizeHome" style="margin-bottom: 16px">ホームをカスタマイズ</button>
			</div>
			<div class="div">
				<mk-switch v-model="darkmode" text="ダークモード"/>
				<mk-switch v-model="clientSettings.circleIcons" @change="onChangeCircleIcons" text="円形のアイコンを使用"/>
				<mk-switch v-model="clientSettings.gradientWindowHeader" @change="onChangeGradientWindowHeader" text="ウィンドウのタイトルバーにグラデーションを使用"/>
			</div>
			<mk-switch v-model="clientSettings.showPostFormOnTopOfTl" @change="onChangeShowPostFormOnTopOfTl" text="タイムライン上部に投稿フォームを表示する"/>
			<mk-switch v-model="clientSettings.showReplyTarget" @change="onChangeShowReplyTarget" text="リプライ先を表示する"/>
			<mk-switch v-model="clientSettings.showMyRenotes" @change="onChangeShowMyRenotes" text="自分の行ったRenoteをタイムラインに表示する"/>
			<mk-switch v-model="clientSettings.showRenotedMyNotes" @change="onChangeShowRenotedMyNotes" text="Renoteされた自分の投稿をタイムラインに表示する"/>
			<mk-switch v-model="clientSettings.showMaps" @change="onChangeShowMaps" text="マップの自動展開">
				<span>位置情報が添付された投稿のマップを自動的に展開します。</span>
			</mk-switch>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>サウンド</h1>
			<mk-switch v-model="enableSounds" text="サウンドを有効にする">
				<span>投稿やメッセージを送受信したときなどにサウンドを再生します。この設定はブラウザに記憶されます。</span>
			</mk-switch>
			<label>ボリューム</label>
			<el-slider
				v-model="soundVolume"
				:show-input="true"
				:format-tooltip="v => `${v}%`"
				:disabled="!enableSounds"
			/>
			<button class="ui button" @click="soundTest">%fa:volume-up% テスト</button>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>モバイル</h1>
			<mk-switch v-model="clientSettings.disableViaMobile" @change="onChangeDisableViaMobile" text="「モバイルからの投稿」フラグを付けない"/>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>言語</h1>
			<el-select v-model="lang" placeholder="言語を選択">
				<el-option-group label="推奨">
					<el-option label="自動" value=""/>
				</el-option-group>
				<el-option-group label="言語を指定">
					<el-option label="ja-JP" value="ja"/>
					<el-option label="en-US" value="en"/>
					<el-option label="fr" value="fr"/>
				</el-option-group>
			</el-select>
			<div class="none ui info">
				<p>%fa:info-circle%変更はページの再度読み込み後に反映されます。</p>
			</div>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>キャッシュ</h1>
			<button class="ui button" @click="clean">クリーンアップ</button>
			<div class="none ui info warn">
				<p>%fa:exclamation-triangle%クリーンアップを行うと、ブラウザに記憶されたアカウント情報のキャッシュ、書きかけの投稿・返信・メッセージ、およびその他のデータ(設定情報含む)が削除されます。クリーンアップを行った後はページを再度読み込みする必要があります。</p>
			</div>
		</section>

		<section class="notification" v-show="page == 'notification'">
			<h1>通知</h1>
			<mk-switch v-model="os.i.settings.autoWatch" @change="onChangeAutoWatch" text="投稿の自動ウォッチ">
				<span>リアクションしたり返信したりした投稿に関する通知を自動的に受け取るようにします。</span>
			</mk-switch>
		</section>

		<section class="drive" v-show="page == 'drive'">
			<h1>%i18n:@drive%</h1>
			<x-drive/>
		</section>

		<section class="mute" v-show="page == 'mute'">
			<h1>%i18n:@mute%</h1>
			<x-mute/>
		</section>

		<section class="apps" v-show="page == 'apps'">
			<h1>アプリケーション</h1>
			<x-apps/>
		</section>

		<section class="twitter" v-show="page == 'twitter'">
			<h1>Twitter</h1>
			<mk-twitter-setting/>
		</section>

		<section class="password" v-show="page == 'security'">
			<h1>%i18n:@password%</h1>
			<x-password/>
		</section>

		<section class="2fa" v-show="page == 'security'">
			<h1>%i18n:@2fa%</h1>
			<x-2fa/>
		</section>

		<section class="signin" v-show="page == 'security'">
			<h1>サインイン履歴</h1>
			<x-signins/>
		</section>

		<section class="api" v-show="page == 'api'">
			<h1>API</h1>
			<x-api/>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>Misskeyについて</h1>
			<p v-if="meta">このサーバーの運営者: <i><a :href="meta.maintainer.url" target="_blank">{{ meta.maintainer.name }}</a></i></p>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>Misskey Update</h1>
			<p>
				<span>バージョン: <i>{{ version }}</i></span>
				<template v-if="latestVersion !== undefined">
					<br>
					<span>最新のバージョン: <i>{{ latestVersion ? latestVersion : version }}</i></span>
				</template>
			</p>
			<button class="ui button block" @click="checkForUpdate" :disabled="checkingForUpdate">
				<template v-if="checkingForUpdate">アップデートを確認中<mk-ellipsis/></template>
				<template v-else>アップデートを確認</template>
			</button>
			<details>
				<summary>詳細設定</summary>
				<mk-switch v-model="preventUpdate" text="アップデートを延期する(非推奨)">
					<span>この設定をオンにしてもアップデートが反映される場合があります。この設定はこのデバイスのみ有効です。</span>
				</mk-switch>
			</details>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>高度な設定</h1>
			<mk-switch v-model="debug" text="デバッグモードを有効にする">
				<span>この設定はブラウザに記憶されます。</span>
			</mk-switch>
			<template v-if="debug">
				<mk-switch v-model="useRawScript" text="生のスクリプトを読み込む">
					<span>圧縮されていない「生の」スクリプトを使用します。サイズが大きいため、読み込みに時間がかかる場合があります。この設定はブラウザに記憶されます。</span>
				</mk-switch>
				<div class="none ui info">
				<p>%fa:info-circle%Misskeyはソースマップも提供しています。</p>
			</div>
			</template>
			<mk-switch v-model="enableExperimental" text="実験的機能を有効にする">
				<span>実験的機能を有効にするとMisskeyの動作が不安定になる可能性があります。この設定はブラウザに記憶されます。</span>
			</mk-switch>
			<details v-if="debug">
				<summary>ツール</summary>
				<button class="ui button block" @click="taskmngr">タスクマネージャ</button>
			</details>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>%i18n:@license%</h1>
			<div v-html="license"></div>
			<a :href="licenseUrl" target="_blank">サードパーティ</a>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XProfile from './settings.profile.vue';
import XMute from './settings.mute.vue';
import XPassword from './settings.password.vue';
import X2fa from './settings.2fa.vue';
import XApi from './settings.api.vue';
import XApps from './settings.apps.vue';
import XSignins from './settings.signins.vue';
import XDrive from './settings.drive.vue';
import { url, docsUrl, license, lang, version } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';
import MkTaskManager from './taskmanager.vue';

export default Vue.extend({
	components: {
		XProfile,
		XMute,
		XPassword,
		X2fa,
		XApi,
		XApps,
		XSignins,
		XDrive
	},
	data() {
		return {
			page: 'profile',
			meta: null,
			license,
			version,
			latestVersion: undefined,
			checkingForUpdate: false,
			darkmode: localStorage.getItem('darkmode') == 'true',
			enableSounds: localStorage.getItem('enableSounds') == 'true',
			autoPopout: localStorage.getItem('autoPopout') == 'true',
			apiViaStream: localStorage.getItem('apiViaStream') ? localStorage.getItem('apiViaStream') == 'true' : true,
			soundVolume: localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) : 50,
			lang: localStorage.getItem('lang') || '',
			preventUpdate: localStorage.getItem('preventUpdate') == 'true',
			debug: localStorage.getItem('debug') == 'true',
			useRawScript: localStorage.getItem('useRawScript') == 'true',
			enableExperimental: localStorage.getItem('enableExperimental') == 'true'
		};
	},
	computed: {
		licenseUrl(): string {
			return `${docsUrl}/${lang}/license`;
		}
	},
	watch: {
		autoPopout() {
			localStorage.setItem('autoPopout', this.autoPopout ? 'true' : 'false');
		},
		apiViaStream() {
			localStorage.setItem('apiViaStream', this.apiViaStream ? 'true' : 'false');
		},
		darkmode() {
			(this as any)._updateDarkmode_(this.darkmode);
		},
		enableSounds() {
			localStorage.setItem('enableSounds', this.enableSounds ? 'true' : 'false');
		},
		soundVolume() {
			localStorage.setItem('soundVolume', this.soundVolume.toString());
		},
		lang() {
			localStorage.setItem('lang', this.lang);
		},
		preventUpdate() {
			localStorage.setItem('preventUpdate', this.preventUpdate ? 'true' : 'false');
		},
		debug() {
			localStorage.setItem('debug', this.debug ? 'true' : 'false');
		},
		useRawScript() {
			localStorage.setItem('useRawScript', this.useRawScript ? 'true' : 'false');
		},
		enableExperimental() {
			localStorage.setItem('enableExperimental', this.enableExperimental ? 'true' : 'false');
		}
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.meta = meta;
		});
	},
	methods: {
		taskmngr() {
			(this as any).os.new(MkTaskManager);
		},
		customizeHome() {
			this.$router.push('/i/customize-home');
			this.$emit('done');
		},
		onChangeFetchOnScroll(v) {
			this.$store.dispatch('settings/set', {
				key: 'fetchOnScroll',
				value: v
			});
		},
		onChangeAutoWatch(v) {
			(this as any).api('i/update', {
				autoWatch: v
			});
		},
		onChangeDark(v) {
			this.$store.dispatch('settings/set', {
				key: 'dark',
				value: v
			});
		},
		onChangeShowPostFormOnTopOfTl(v) {
			this.$store.dispatch('settings/set', {
				key: 'showPostFormOnTopOfTl',
				value: v
			});
		},
		onChangeShowReplyTarget(v) {
			this.$store.dispatch('settings/set', {
				key: 'showReplyTarget',
				value: v
			});
		},
		onChangeShowMyRenotes(v) {
			this.$store.dispatch('settings/set', {
				key: 'showMyRenotes',
				value: v
			});
		},
		onChangeShowRenotedMyNotes(v) {
			this.$store.dispatch('settings/set', {
				key: 'showRenotedMyNotes',
				value: v
			});
		},
		onChangeShowMaps(v) {
			this.$store.dispatch('settings/set', {
				key: 'showMaps',
				value: v
			});
		},
		onChangeCircleIcons(v) {
			this.$store.dispatch('settings/set', {
				key: 'circleIcons',
				value: v
			});
		},
		onChangeGradientWindowHeader(v) {
			this.$store.dispatch('settings/set', {
				key: 'gradientWindowHeader',
				value: v
			});
		},
		onChangeDisableViaMobile(v) {
			this.$store.dispatch('settings/set', {
				key: 'disableViaMobile',
				value: v
			});
		},
		checkForUpdate() {
			this.checkingForUpdate = true;
			checkForUpdate((this as any).os, true, true).then(newer => {
				this.checkingForUpdate = false;
				this.latestVersion = newer;
				if (newer == null) {
					(this as any).apis.dialog({
						title: '利用可能な更新はありません',
						text: 'お使いのMisskeyは最新です。'
					});
				} else {
					(this as any).apis.dialog({
						title: '新しいバージョンが利用可能です',
						text: 'ページを再度読み込みすると更新が適用されます。'
					});
				}
			});
		},
		clean() {
			localStorage.clear();
			(this as any).apis.dialog({
				title: 'キャッシュを削除しました',
				text: 'ページを再度読み込みしてください。'
			});
		},
		soundTest() {
			const sound = new Audio(`${url}/assets/message.mp3`);
			sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 0.5;
			sound.play();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display flex
	width 100%
	height 100%

	> .nav
		flex 0 0 200px
		width 100%
		height 100%
		padding 16px 0 0 0
		overflow auto
		border-right solid 1px isDark ? #1c2023 : #ddd

		> p
			display block
			padding 10px 16px
			margin 0
			color isDark ? #9aa2a7 : #666
			cursor pointer
			user-select none
			transition margin-left 0.2s ease

			> [data-fa]
				margin-right 4px

			&:hover
				color isDark ? #fff : #555

			&.active
				margin-left 8px
				color $theme-color !important

	> .pages
		width 100%
		height 100%
		flex auto
		overflow auto

		> section
			margin 32px
			color isDark ? #c4ccd2 : #4a535a

			> h1
				margin 0 0 1em 0
				padding 0 0 8px 0
				font-size 1em
				color isDark ? #e3e7ea : #555
				border-bottom solid 1px isDark ? #1c2023 : #eee

			&, >>> *
				.ui.button.block
					margin 16px 0

				> section
					margin 32px 0

					> h2
						margin 0 0 1em 0
						padding 0 0 8px 0
						font-size 1em
						color isDark ? #e3e7ea : #555
						border-bottom solid 1px isDark ? #1c2023 : #eee

		> .web
			> .div
				border-bottom solid 1px isDark ? #1c2023 : #eee
				margin 16px 0

.mk-settings[data-darkmode]
	root(true)

.mk-settings:not([data-darkmode])
	root(false)

</style>
