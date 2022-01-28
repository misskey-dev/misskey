<template>
<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
	<div v-if="!narrow || page == null" class="nav">
		<MkHeader :info="header"></MkHeader>
	
		<MkSpacer :content-max="700" :margin-min="16">
			<div class="lxpfedzu">
				<div class="banner">
					<img :src="$instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<MkInfo v-if="noMaintainerInformation" warn class="info">{{ $ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ $ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noBotProtection" warn class="info">{{ $ts.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ $ts.configure }}</MkA></MkInfo>

				<MkSuperMenu :def="menuDef" :grid="page == null"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div class="main">
		<MkStickyContainer>
			<template #header><MkHeader v-if="childInfo && !childInfo.hideHeader" :info="childInfo"/></template>
			<component :is="component" :ref="el => pageChanged(el)" :key="page" v-bind="pageProps"/>
		</MkStickyContainer>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, isRef, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { i18n } from '@/i18n';
import MkSuperMenu from '@/components/ui/super-menu.vue';
import MkInfo from '@/components/ui/info.vue';
import { scroll } from '@/scripts/scroll';
import { instance } from '@/instance';
import * as symbols from '@/symbols';
import * as os from '@/os';
import { lookupUser } from '@/scripts/lookup-user';

export default defineComponent({
	components: {
		MkSuperMenu,
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
			title: i18n.ts.controlPanel,
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
		const pageChanged = (page) => {
			if (page == null) return;
			const viewInfo = page[symbols.PAGE_INFO];
			if (isRef(viewInfo)) {
				watch(viewInfo, () => {
					childInfo.value = viewInfo.value;
				}, { immediate: true });
			} else {
				childInfo.value = viewInfo;
			}
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
			title: i18n.ts.quickAction,
			items: [{
				type: 'button',
				icon: 'fas fa-search',
				text: i18n.ts.lookup,
				action: lookup,
			}, ...(instance.disableRegistration ? [{
				type: 'button',
				icon: 'fas fa-user',
				text: i18n.ts.invite,
				action: invite,
			}] : [])],
		}, {
			title: i18n.ts.administration,
			items: [{
				icon: 'fas fa-tachometer-alt',
				text: i18n.ts.dashboard,
				to: '/admin/overview',
				active: page.value === 'overview',
			}, {
				icon: 'fas fa-users',
				text: i18n.ts.users,
				to: '/admin/users',
				active: page.value === 'users',
			}, {
				icon: 'fas fa-laugh',
				text: i18n.ts.customEmojis,
				to: '/admin/emojis',
				active: page.value === 'emojis',
			}, {
				icon: 'fas fa-globe',
				text: i18n.ts.federation,
				to: '/admin/federation',
				active: page.value === 'federation',
			}, {
				icon: 'fas fa-clipboard-list',
				text: i18n.ts.jobQueue,
				to: '/admin/queue',
				active: page.value === 'queue',
			}, {
				icon: 'fas fa-cloud',
				text: i18n.ts.files,
				to: '/admin/files',
				active: page.value === 'files',
			}, {
				icon: 'fas fa-broadcast-tower',
				text: i18n.ts.announcements,
				to: '/admin/announcements',
				active: page.value === 'announcements',
			}, {
				icon: 'fas fa-audio-description',
				text: i18n.ts.ads,
				to: '/admin/ads',
				active: page.value === 'ads',
			}, {
				icon: 'fas fa-exclamation-circle',
				text: i18n.ts.abuseReports,
				to: '/admin/abuses',
				active: page.value === 'abuses',
			}],
		}, {
			title: i18n.ts.settings,
			items: [{
				icon: 'fas fa-cog',
				text: i18n.ts.general,
				to: '/admin/settings',
				active: page.value === 'settings',
			}, {
				icon: 'fas fa-envelope',
				text: i18n.ts.emailServer,
				to: '/admin/email-settings',
				active: page.value === 'email-settings',
			}, {
				icon: 'fas fa-cloud',
				text: i18n.ts.objectStorage,
				to: '/admin/object-storage',
				active: page.value === 'object-storage',
			}, {
				icon: 'fas fa-lock',
				text: i18n.ts.security,
				to: '/admin/security',
				active: page.value === 'security',
			}, {
				icon: 'fas fa-globe',
				text: i18n.ts.relays,
				to: '/admin/relays',
				active: page.value === 'relays',
			}, {
				icon: 'fas fa-share-alt',
				text: i18n.ts.integration,
				to: '/admin/integrations',
				active: page.value === 'integrations',
			}, {
				icon: 'fas fa-ban',
				text: i18n.ts.instanceBlocking,
				to: '/admin/instance-block',
				active: page.value === 'instance-block',
			}, {
				icon: 'fas fa-ghost',
				text: i18n.ts.proxyAccount,
				to: '/admin/proxy-account',
				active: page.value === 'proxy-account',
			}, {
				icon: 'fas fa-cogs',
				text: i18n.ts.other,
				to: '/admin/other-settings',
				active: page.value === 'other-settings',
			}],
		}, {
			title: i18n.ts.info,
			items: [{
				icon: 'fas fa-database',
				text: i18n.ts.database,
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
				case 'email-settings': return defineAsyncComponent(() => import('./email-settings.vue'));
				case 'object-storage': return defineAsyncComponent(() => import('./object-storage.vue'));
				case 'security': return defineAsyncComponent(() => import('./security.vue'));
				case 'relays': return defineAsyncComponent(() => import('./relays.vue'));
				case 'integrations': return defineAsyncComponent(() => import('./integrations.vue'));
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
				os.alert({
					type: 'info',
					text: x.code
				});
			}).catch(e => {
				os.alert({
					type: 'error',
					text: e
				});
			});
		};

		const lookup = (ev) => {
			os.popupMenu([{
				text: i18n.ts.user,
				icon: 'fas fa-user',
				action: () => {
					lookupUser();
				}
			}, {
				text: i18n.ts.note,
				icon: 'fas fa-pencil-alt',
				action: () => {
					alert('TODO');
				}
			}, {
				text: i18n.ts.file,
				icon: 'fas fa-cloud',
				action: () => {
					alert('TODO');
				}
			}, {
				text: i18n.ts.instance,
				icon: 'fas fa-globe',
				action: () => {
					alert('TODO');
				}
			}], ev.currentTarget ?? ev.target);
		};

		return {
			[symbols.PAGE_INFO]: INFO,
			menuDef,
			header: {
				title: i18n.ts.controlPanel,
			},
			noMaintainerInformation,
			noBotProtection,
			page,
			narrow,
			view,
			el,
			pageChanged,
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
