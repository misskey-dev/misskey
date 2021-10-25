<template>
<div class="hiyeyicy" :class="{ wide: !narrow }" ref="el">
	<div class="nav" v-if="!narrow || page == null">
		<MkHeader :info="header"></MkHeader>
	
		<MkSpacer :content-max="700">
			<div class="lxpfedzu">
				<div class="banner">
					<img :src="$instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<MkInfo v-if="noMaintainerInformation" warn class="info">{{ $ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ $ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noBotProtection" warn class="info">{{ $ts.noBotProtectionWarning }} <MkA to="/admin/bot-protection" class="_link">{{ $ts.configure }}</MkA></MkInfo>

				<MkSuperMenu :def="menuDef" :grid="page == null"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div class="main">
		<MkStickyContainer>
			<template #header><MkHeader v-if="childInfo && !childInfo.hideHeader" :info="childInfo"/></template>
			<component :is="component" :key="page" @info="onInfo" v-bind="pageProps"/>
		</MkStickyContainer>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { i18n } from '@client/i18n';
import MkSuperMenu from '@client/components/ui/super-menu.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormButton from '@client/components/debobigego/button.vue';
import MkInfo from '@client/components/ui/info.vue';
import { scroll } from '@client/scripts/scroll';
import { instance } from '@client/instance';
import * as symbols from '@client/symbols';
import * as os from '@client/os';
import { lookupUser } from '@client/scripts/lookup-user';

export default defineComponent({
	components: {
		FormBase,
		MkSuperMenu,
		FormGroup,
		FormButton,
		MkInfo,
	},

	provide: {
		shouldOmitHeaderTitle: false,
	},

	props: {
		initialPage: {
			type: String,
			required: false
		}
	},

	setup(props, context) {
		const indexInfo = {
			title: i18n.locale.controlPanel,
			icon: 'fas fa-cog',
			bg: 'var(--bg)',
			hideHeader: true,
		};
		const INFO = ref(indexInfo);
		const childInfo = ref(null);
		const page = ref(props.initialPage);
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);
		const onInfo = (viewInfo) => {
			childInfo.value = viewInfo;
		};
		const pageProps = ref({});

		const isEmpty = (x: any) => x == null || x == '';

		const noMaintainerInformation = ref(false);
		const noBotProtection = ref(false);

		os.api('meta', { detail: true }).then(meta => {
			// TODO: 設定が完了しても残ったままになるので、ストリーミングでmeta更新イベントを受け取ってよしなに更新する
			noMaintainerInformation.value = isEmpty(meta.maintainerName) || isEmpty(meta.maintainerEmail);
			noBotProtection.value = !meta.enableHcaptcha && !meta.enableRecaptcha;
		});

		const menuDef = computed(() => [{
			title: i18n.locale.quickAction,
			items: [{
				type: 'button',
				icon: 'fas fa-search',
				text: i18n.locale.lookup,
				action: lookup,
			}, ...(instance.disableRegistration ? [{
				type: 'button',
				icon: 'fas fa-user',
				text: i18n.locale.invite,
				action: invite,
			}] : [])],
		}, {
			title: i18n.locale.administration,
			items: [{
				icon: 'fas fa-tachometer-alt',
				text: i18n.locale.dashboard,
				to: '/admin/overview',
				active: page.value === 'overview',
			}, {
				icon: 'fas fa-users',
				text: i18n.locale.users,
				to: '/admin/users',
				active: page.value === 'users',
			}, {
				icon: 'fas fa-laugh',
				text: i18n.locale.customEmojis,
				to: '/admin/emojis',
				active: page.value === 'emojis',
			}, {
				icon: 'fas fa-globe',
				text: i18n.locale.federation,
				to: '/admin/federation',
				active: page.value === 'federation',
			}, {
				icon: 'fas fa-clipboard-list',
				text: i18n.locale.jobQueue,
				to: '/admin/queue',
				active: page.value === 'queue',
			}, {
				icon: 'fas fa-cloud',
				text: i18n.locale.files,
				to: '/admin/files',
				active: page.value === 'files',
			}, {
				icon: 'fas fa-broadcast-tower',
				text: i18n.locale.announcements,
				to: '/admin/announcements',
				active: page.value === 'announcements',
			}, {
				icon: 'fas fa-audio-description',
				text: i18n.locale.ads,
				to: '/admin/ads',
				active: page.value === 'ads',
			}, {
				icon: 'fas fa-exclamation-circle',
				text: i18n.locale.abuseReports,
				to: '/admin/abuses',
				active: page.value === 'abuses',
			}],
		}, {
			title: i18n.locale.settings,
			items: [{
				icon: 'fas fa-cog',
				text: i18n.locale.general,
				to: '/admin/settings',
				active: page.value === 'settings',
			}, {
				icon: 'fas fa-cloud',
				text: i18n.locale.files,
				to: '/admin/files-settings',
				active: page.value === 'files-settings',
			}, {
				icon: 'fas fa-envelope',
				text: i18n.locale.emailServer,
				to: '/admin/email-settings',
				active: page.value === 'email-settings',
			}, {
				icon: 'fas fa-cloud',
				text: i18n.locale.objectStorage,
				to: '/admin/object-storage',
				active: page.value === 'object-storage',
			}, {
				icon: 'fas fa-lock',
				text: i18n.locale.security,
				to: '/admin/security',
				active: page.value === 'security',
			}, {
				icon: 'fas fa-bolt',
				text: 'ServiceWorker',
				to: '/admin/service-worker',
				active: page.value === 'service-worker',
			}, {
				icon: 'fas fa-globe',
				text: i18n.locale.relays,
				to: '/admin/relays',
				active: page.value === 'relays',
			}, {
				icon: 'fas fa-share-alt',
				text: i18n.locale.integration,
				to: '/admin/integrations',
				active: page.value === 'integrations',
			}, {
				icon: 'fas fa-ban',
				text: i18n.locale.instanceBlocking,
				to: '/admin/instance-block',
				active: page.value === 'instance-block',
			}, {
				icon: 'fas fa-ghost',
				text: i18n.locale.proxyAccount,
				to: '/admin/proxy-account',
				active: page.value === 'proxy-account',
			}, {
				icon: 'fas fa-cogs',
				text: i18n.locale.other,
				to: '/admin/other-settings',
				active: page.value === 'other-settings',
			}],
		}, {
			title: i18n.locale.info,
			items: [{
				icon: 'fas fa-database',
				text: i18n.locale.database,
				to: '/admin/database',
				active: page.value === 'database',
			}],
		}]);
		const component = computed(() => {
			if (page.value == null) return null;
			switch (page.value) {
				case 'overview': return defineAsyncComponent(() => import('./overview.vue'));
				case 'users': return defineAsyncComponent(() => import('./users.vue'));
				case 'emojis': return defineAsyncComponent(() => import('./emojis.vue'));
				case 'federation': return defineAsyncComponent(() => import('../federation.vue'));
				case 'queue': return defineAsyncComponent(() => import('./queue.vue'));
				case 'files': return defineAsyncComponent(() => import('./files.vue'));
				case 'announcements': return defineAsyncComponent(() => import('./announcements.vue'));
				case 'ads': return defineAsyncComponent(() => import('./ads.vue'));
				case 'database': return defineAsyncComponent(() => import('./database.vue'));
				case 'abuses': return defineAsyncComponent(() => import('./abuses.vue'));
				case 'settings': return defineAsyncComponent(() => import('./settings.vue'));
				case 'files-settings': return defineAsyncComponent(() => import('./files-settings.vue'));
				case 'email-settings': return defineAsyncComponent(() => import('./email-settings.vue'));
				case 'object-storage': return defineAsyncComponent(() => import('./object-storage.vue'));
				case 'security': return defineAsyncComponent(() => import('./security.vue'));
				case 'bot-protection': return defineAsyncComponent(() => import('./bot-protection.vue'));
				case 'service-worker': return defineAsyncComponent(() => import('./service-worker.vue'));
				case 'relays': return defineAsyncComponent(() => import('./relays.vue'));
				case 'integrations': return defineAsyncComponent(() => import('./integrations.vue'));
				case 'integrations/twitter': return defineAsyncComponent(() => import('./integrations-twitter.vue'));
				case 'integrations/github': return defineAsyncComponent(() => import('./integrations-github.vue'));
				case 'integrations/discord': return defineAsyncComponent(() => import('./integrations-discord.vue'));
				case 'instance-block': return defineAsyncComponent(() => import('./instance-block.vue'));
				case 'proxy-account': return defineAsyncComponent(() => import('./proxy-account.vue'));
				case 'other-settings': return defineAsyncComponent(() => import('./other-settings.vue'));
			}
		});

		watch(component, () => {
			pageProps.value = {};

			nextTick(() => {
				scroll(el.value, { top: 0 });
			});
		}, { immediate: true });

		watch(() => props.initialPage, () => {
			if (props.initialPage == null && !narrow.value) {
				page.value = 'overview';
			} else {
				page.value = props.initialPage;
				if (props.initialPage == null) {
					INFO.value = indexInfo;
				}
			}
		});

		onMounted(() => {
			narrow.value = el.value.offsetWidth < 800;
			if (!narrow.value) {
				page.value = 'overview';
			}
		});

		const invite = () => {
			os.api('admin/invite').then(x => {
				os.dialog({
					type: 'info',
					text: x.code
				});
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			});
		};

		const lookup = (ev) => {
			os.popupMenu([{
				text: i18n.locale.user,
				icon: 'fas fa-user',
				action: () => {
					lookupUser();
				}
			}, {
				text: i18n.locale.note,
				icon: 'fas fa-pencil-alt',
				action: () => {
					alert('TODO');
				}
			}, {
				text: i18n.locale.file,
				icon: 'fas fa-cloud',
				action: () => {
					alert('TODO');
				}
			}, {
				text: i18n.locale.instance,
				icon: 'fas fa-globe',
				action: () => {
					alert('TODO');
				}
			}], ev.currentTarget || ev.target);
		};

		return {
			[symbols.PAGE_INFO]: INFO,
			menuDef,
			header: {
				title: i18n.locale.controlPanel,
			},
			noMaintainerInformation,
			noBotProtection,
			page,
			narrow,
			view,
			el,
			onInfo,
			childInfo,
			pageProps,
			component,
			invite,
			lookup,
		};
	},
});
</script>

<style lang="scss" scoped>
.hiyeyicy {
	&.wide {
		display: flex;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			max-width: 280px;
			box-sizing: border-box;
			border-right: solid 0.5px var(--divider);
			overflow: auto;
			height: 100%;
		}

		> .main {
			flex: 1;
			min-width: 0;
		}
	}

	> .nav {
		.lxpfedzu {
			> .info {
				margin: 16px 0;
			}

			> .banner {
				margin: 16px;

				> .icon {
					display: block;
					margin: auto;
					height: 42px;
					border-radius: 8px;
				}
			}
		}
	}
}
</style>
