<template>
<div class="_formRoot">
	<FormSelect v-model="lang" class="_formBlock">
		<template #label>{{ $ts.uiLanguage }}</template>
		<option v-for="x in langs" :key="x[0]" :value="x[0]">{{ x[1] }}</option>
		<template #caption>
			<I18n :src="$ts.i18nInfo" tag="span">
				<template #link>
					<MkLink url="https://crowdin.com/project/misskey">Crowdin</MkLink>
				</template>
			</I18n>
		</template>
	</FormSelect>

	<FormSwitch v-model="showFixedPostForm" class="_formBlock">{{ $ts.showFixedPostForm }}</FormSwitch>

	<FormSection>
		<template #label>{{ $ts.behavior }}</template>
		<FormSwitch v-model="imageNewTab" class="_formBlock">{{ $ts.openImageInNewTab }}</FormSwitch>
		<FormSwitch v-model="enableInfiniteScroll" class="_formBlock">{{ $ts.enableInfiniteScroll }}</FormSwitch>
		<FormSwitch v-model="useReactionPickerForContextMenu" class="_formBlock">{{ $ts.useReactionPickerForContextMenu }}</FormSwitch>
		<FormSwitch v-model="disablePagesScript" class="_formBlock">{{ $ts.disablePagesScript }}</FormSwitch>

		<FormSelect v-model="serverDisconnectedBehavior" class="_formBlock">
			<template #label>{{ $ts.whenServerDisconnected }}</template>
			<option value="reload">{{ $ts._serverDisconnectedBehavior.reload }}</option>
			<option value="dialog">{{ $ts._serverDisconnectedBehavior.dialog }}</option>
			<option value="quiet">{{ $ts._serverDisconnectedBehavior.quiet }}</option>
		</FormSelect>
	</FormSection>

	<FormSection>
		<template #label>{{ $ts.appearance }}</template>
		<FormSwitch v-model="disableAnimatedMfm" class="_formBlock">{{ $ts.disableAnimatedMfm }}</FormSwitch>
		<FormSwitch v-model="reduceAnimation" class="_formBlock">{{ $ts.reduceUiAnimation }}</FormSwitch>
		<FormSwitch v-model="useBlurEffect" class="_formBlock">{{ $ts.useBlurEffect }}</FormSwitch>
		<FormSwitch v-model="useBlurEffectForModal" class="_formBlock">{{ $ts.useBlurEffectForModal }}</FormSwitch>
		<FormSwitch v-model="showGapBetweenNotesInTimeline" class="_formBlock">{{ $ts.showGapBetweenNotesInTimeline }}</FormSwitch>
		<FormSwitch v-model="loadRawImages" class="_formBlock">{{ $ts.loadRawImages }}</FormSwitch>
		<FormSwitch v-model="disableShowingAnimatedImages" class="_formBlock">{{ $ts.disableShowingAnimatedImages }}</FormSwitch>
		<FormSwitch v-model="squareAvatars" class="_formBlock">{{ $ts.squareAvatars }}</FormSwitch>
		<FormSwitch v-model="useSystemFont" class="_formBlock">{{ $ts.useSystemFont }}</FormSwitch>
		<FormSwitch v-model="useOsNativeEmojis" class="_formBlock">{{ $ts.useOsNativeEmojis }}
			<div><Mfm :key="useOsNativeEmojis" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
		</FormSwitch>

		<FormRadios v-model="fontSize" class="_formBlock">
			<template #label>{{ $ts.fontSize }}</template>
			<option value="small"><span style="font-size: 14px;">Aa</span></option>
			<option :value="null"><span style="font-size: 16px;">Aa</span></option>
			<option value="large"><span style="font-size: 18px;">Aa</span></option>
			<option value="veryLarge"><span style="font-size: 20px;">Aa</span></option>
		</FormRadios>
	</FormSection>

	<FormSection>
		<FormSwitch v-model="aiChanMode">{{ $ts.aiChanMode }}</FormSwitch>
	</FormSection>

	<FormSelect v-model="instanceTicker" class="_formBlock">
		<template #label>{{ $ts.instanceTicker }}</template>
		<option value="none">{{ $ts._instanceTicker.none }}</option>
		<option value="remote">{{ $ts._instanceTicker.remote }}</option>
		<option value="always">{{ $ts._instanceTicker.always }}</option>
	</FormSelect>

	<FormSelect v-model="nsfw" class="_formBlock">
		<template #label>{{ $ts.nsfw }}</template>
		<option value="respect">{{ $ts._nsfw.respect }}</option>
		<option value="ignore">{{ $ts._nsfw.ignore }}</option>
		<option value="force">{{ $ts._nsfw.force }}</option>
	</FormSelect>

	<FormGroup>
		<template #label>{{ $ts.defaultNavigationBehaviour }}</template>
		<FormSwitch v-model="defaultSideView">{{ $ts.openInSideView }}</FormSwitch>
	</FormGroup>

	<FormSelect v-model="chatOpenBehavior" class="_formBlock">
		<template #label>{{ $ts.chatOpenBehavior }}</template>
		<option value="page">{{ $ts.showInPage }}</option>
		<option value="window">{{ $ts.openInWindow }}</option>
		<option value="popout">{{ $ts.popout }}</option>
	</FormSelect>

	<FormLink to="/settings/deck" class="_formBlock">{{ $ts.deck }}</FormLink>

	<FormLink to="/settings/custom-css" class="_formBlock"><template #icon><i class="fas fa-code"></i></template>{{ $ts.customCss }}</FormLink>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormGroup from '@/components/form/group.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/link.vue';
import { langs } from '@/config';
import { defaultStore } from '@/store';
import { ColdDeviceStorage } from '@/store';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkLink,
		FormSwitch,
		FormSelect,
		FormRadios,
		FormGroup,
		FormLink,
		FormSection,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.general,
				icon: 'fas fa-cogs',
				bg: 'var(--bg)'
			},
			langs,
			lang: localStorage.getItem('lang'),
			fontSize: localStorage.getItem('fontSize'),
			useSystemFont: localStorage.getItem('useSystemFont') != null,
		}
	},

	computed: {
		serverDisconnectedBehavior: defaultStore.makeGetterSetter('serverDisconnectedBehavior'),
		reduceAnimation: defaultStore.makeGetterSetter('animation', v => !v, v => !v),
		useBlurEffectForModal: defaultStore.makeGetterSetter('useBlurEffectForModal'),
		useBlurEffect: defaultStore.makeGetterSetter('useBlurEffect'),
		showGapBetweenNotesInTimeline: defaultStore.makeGetterSetter('showGapBetweenNotesInTimeline'),
		disableAnimatedMfm: defaultStore.makeGetterSetter('animatedMfm', v => !v, v => !v),
		useOsNativeEmojis: defaultStore.makeGetterSetter('useOsNativeEmojis'),
		disableShowingAnimatedImages: defaultStore.makeGetterSetter('disableShowingAnimatedImages'),
		loadRawImages: defaultStore.makeGetterSetter('loadRawImages'),
		imageNewTab: defaultStore.makeGetterSetter('imageNewTab'),
		nsfw: defaultStore.makeGetterSetter('nsfw'),
		disablePagesScript: defaultStore.makeGetterSetter('disablePagesScript'),
		showFixedPostForm: defaultStore.makeGetterSetter('showFixedPostForm'),
		defaultSideView: defaultStore.makeGetterSetter('defaultSideView'),
		chatOpenBehavior: ColdDeviceStorage.makeGetterSetter('chatOpenBehavior'),
		instanceTicker: defaultStore.makeGetterSetter('instanceTicker'),
		enableInfiniteScroll: defaultStore.makeGetterSetter('enableInfiniteScroll'),
		useReactionPickerForContextMenu: defaultStore.makeGetterSetter('useReactionPickerForContextMenu'),
		squareAvatars: defaultStore.makeGetterSetter('squareAvatars'),
		aiChanMode: defaultStore.makeGetterSetter('aiChanMode'),
	},

	watch: {
		lang() {
			localStorage.setItem('lang', this.lang);
			localStorage.removeItem('locale');
			this.reloadAsk();
		},

		fontSize() {
			if (this.fontSize == null) {
				localStorage.removeItem('fontSize');
			} else {
				localStorage.setItem('fontSize', this.fontSize);
			}
			this.reloadAsk();
		},

		useSystemFont() {
			if (this.useSystemFont) {
				localStorage.setItem('useSystemFont', 't');
			} else {
				localStorage.removeItem('useSystemFont');
			}
			this.reloadAsk();
		},

		enableInfiniteScroll() {
			this.reloadAsk();
		},

		squareAvatars() {
			this.reloadAsk();
		},

		aiChanMode() {
			this.reloadAsk();
		},

		showGapBetweenNotesInTimeline() {
			this.reloadAsk();
		},

		instanceTicker() {
			this.reloadAsk();
		},
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async reloadAsk() {
			const { canceled } = await os.confirm({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
			});
			if (canceled) return;

			unisonReload();
		}
	}
});
</script>
