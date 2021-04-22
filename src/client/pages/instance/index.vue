<template>
<div class="hiyeyicy" :class="{ wide: !narrow }" ref="el">
	<div class="nav" v-if="!narrow || page == null">
		<FormBase>
			<FormGroup>
				<div class="_formItem">
					<div class="_formPanel lxpfedzu">
						<img :src="$instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
					</div>
				</div>
				<FormLink :active="page === 'overview'" replace to="/instance/overview"><template #icon><i class="fas fa-tachometer-alt"></i></template>{{ $ts.overview }}</FormLink>
			</FormGroup>
			<FormGroup>
				<template #label>{{ $ts.quickAction }}</template>
				<FormButton @click="lookup"><i class="fas fa-search"></i> {{ $ts.lookup }}</FormButton>
				<FormButton v-if="$instance.disableRegistration" @click="invite"><i class="fas fa-user"></i> {{ $ts.invite }}</FormButton>
			</FormGroup>
			<FormGroup>
				<FormLink :active="page === 'users'" replace to="/instance/users"><template #icon><i class="fas fa-users"></i></template>{{ $ts.users }}</FormLink>
				<FormLink :active="page === 'emojis'" replace to="/instance/emojis"><template #icon><i class="fas fa-laugh"></i></template>{{ $ts.customEmojis }}</FormLink>
				<FormLink :active="page === 'federation'" replace to="/instance/federation"><template #icon><i class="fas fa-globe"></i></template>{{ $ts.federation }}</FormLink>
				<FormLink :active="page === 'queue'" replace to="/instance/queue"><template #icon><i class="fas fa-clipboard-list"></i></template>{{ $ts.jobQueue }}</FormLink>
				<FormLink :active="page === 'files'" replace to="/instance/files"><template #icon><i class="fas fa-cloud"></i></template>{{ $ts.files }}</FormLink>
				<FormLink :active="page === 'announcements'" replace to="/instance/announcements"><template #icon><i class="fas fa-broadcast-tower"></i></template>{{ $ts.announcements }}</FormLink>
				<FormLink :active="page === 'database'" replace to="/instance/database"><template #icon><i class="fas fa-database"></i></template>{{ $ts.database }}</FormLink>
				<FormLink :active="page === 'abuses'" replace to="/instance/abuses"><template #icon><i class="fas fa-exclamation-circle"></i></template>{{ $ts.abuseReports }}</FormLink>
			</FormGroup>
			<FormGroup>
				<template #label>{{ $ts.settings }}</template>
				<FormLink :active="page === 'settings'" replace to="/instance/settings"><template #icon><i class="fas fa-cog"></i></template>{{ $ts.general }}</FormLink>
				<FormLink :active="page === 'files-settings'" replace to="/instance/files-settings"><template #icon><i class="fas fa-cloud"></i></template>{{ $ts.files }}</FormLink>
				<FormLink :active="page === 'email-settings'" replace to="/instance/email-settings"><template #icon><i class="fas fa-envelope"></i></template>{{ $ts.emailServer }}</FormLink>
				<FormLink :active="page === 'object-storage'" replace to="/instance/object-storage"><template #icon><i class="fas fa-cloud"></i></template>{{ $ts.objectStorage }}</FormLink>
				<FormLink :active="page === 'security'" replace to="/instance/security"><template #icon><i class="fas fa-lock"></i></template>{{ $ts.security }}</FormLink>
				<FormLink :active="page === 'service-worker'" replace to="/instance/service-worker"><template #icon><i class="fas fa-bolt"></i></template>ServiceWorker</FormLink>
				<FormLink :active="page === 'relays'" replace to="/instance/relays"><template #icon><i class="fas fa-globe"></i></template>{{ $ts.relays }}</FormLink>
				<FormLink :active="page === 'integrations'" replace to="/instance/integrations"><template #icon><i class="fas fa-share-alt"></i></template>{{ $ts.integration }}</FormLink>
				<FormLink :active="page === 'instance-block'" replace to="/instance/instance-block"><template #icon><i class="fas fa-ban"></i></template>{{ $ts.instanceBlocking }}</FormLink>
				<FormLink :active="page === 'proxy-account'" replace to="/instance/proxy-account"><template #icon><i class="fas fa-ghost"></i></template>{{ $ts.proxyAccount }}</FormLink>
				<FormLink :active="page === 'other-settings'" replace to="/instance/other-settings"><template #icon><i class="fas fa-cogs"></i></template>{{ $ts.other }}</FormLink>
			</FormGroup>
		</FormBase>
	</div>
	<div class="main">
		<component :is="component" :key="page" @info="onInfo" v-bind="pageProps"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { i18n } from '@client/i18n';
import FormLink from '@client/components/form/link.vue';
import FormGroup from '@client/components/form/group.vue';
import FormBase from '@client/components/form/base.vue';
import FormButton from '@client/components/form/button.vue';
import { scroll } from '@client/scripts/scroll';
import * as symbols from '@client/symbols';
import * as os from '@client/os';
import { lookupUser } from '@client/scripts/lookup-user';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormGroup,
		FormButton,
	},

	props: {
		initialPage: {
			type: String,
			required: false
		}
	},

	setup(props, context) {
		const indexInfo = {
			title: i18n.locale.instance,
			icon: 'fas fa-cog'
		};
		const INFO = ref(indexInfo);
		const page = ref(props.initialPage);
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);
		const onInfo = (viewInfo) => {
			INFO.value = viewInfo;
		};
		const pageProps = ref({});
		const component = computed(() => {
			if (page.value == null) return null;
			switch (page.value) {
				case 'overview': return defineAsyncComponent(() => import('./overview.vue'));
				case 'users': return defineAsyncComponent(() => import('./users.vue'));
				case 'emojis': return defineAsyncComponent(() => import('./emojis.vue'));
				case 'federation': return defineAsyncComponent(() => import('./federation.vue'));
				case 'queue': return defineAsyncComponent(() => import('./queue.vue'));
				case 'files': return defineAsyncComponent(() => import('./files.vue'));
				case 'announcements': return defineAsyncComponent(() => import('./announcements.vue'));
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
				scroll(el.value, 0);
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
			os.modalMenu([{
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
			page,
			narrow,
			view,
			el,
			onInfo,
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
		max-width: 1100px;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			box-sizing: border-box;
			border-right: solid 0.5px var(--divider);
			overflow: auto;
		}

		> .main {
			flex: 1;
			min-width: 0;
			overflow: auto;
			--baseContentWidth: 100%;
		}
	}
}

.lxpfedzu {
	padding: 16px;

	> img {
		display: block;
		margin: auto;
		height: 42px;
		border-radius: 8px;
	}
}
</style>
