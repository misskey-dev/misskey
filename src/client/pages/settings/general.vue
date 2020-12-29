<template>
<FormBase>
	<FormSwitch v-model:value="titlebar">{{ $ts.showTitlebar }}</FormSwitch>
	<FormSwitch v-model:value="showFixedPostForm">{{ $ts.showFixedPostForm }}</FormSwitch>

	<FormSelect v-model:value="lang">
		<template #label>{{ $ts.uiLanguage }}</template>
		<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
		<template #caption>
			<I18n :src="$ts.i18nInfo" tag="span">
				<template #link>
					<MkLink url="https://crowdin.com/project/misskey">Crowdin</MkLink>
				</template>
			</I18n>
		</template>
	</FormSelect>

	<FormGroup>
		<template #label>{{ $ts.behavior }}</template>
		<FormSwitch v-model:value="imageNewTab">{{ $ts.openImageInNewTab }}</FormSwitch>
		<FormSwitch v-model:value="enableInfiniteScroll">{{ $ts.enableInfiniteScroll }}</FormSwitch>
		<FormSwitch v-model:value="disablePagesScript">{{ $ts.disablePagesScript }}</FormSwitch>
	</FormGroup>

	<FormSelect v-model:value="serverDisconnectedBehavior">
		<template #label>{{ $ts.whenServerDisconnected }}</template>
		<option value="reload">{{ $ts._serverDisconnectedBehavior.reload }}</option>
		<option value="dialog">{{ $ts._serverDisconnectedBehavior.dialog }}</option>
		<option value="quiet">{{ $ts._serverDisconnectedBehavior.quiet }}</option>
	</FormSelect>

	<FormGroup>
		<template #label>{{ $ts.appearance }}</template>
		<FormSwitch v-model:value="disableAnimatedMfm">{{ $ts.disableAnimatedMfm }}</FormSwitch>
		<FormSwitch v-model:value="reduceAnimation">{{ $ts.reduceUiAnimation }}</FormSwitch>
		<FormSwitch v-model:value="useBlurEffectForModal">{{ $ts.useBlurEffectForModal }}</FormSwitch>
		<FormSwitch v-model:value="showGapBetweenNotesInTimeline">{{ $ts.showGapBetweenNotesInTimeline }}</FormSwitch>
		<FormSwitch v-model:value="loadRawImages">{{ $ts.loadRawImages }}</FormSwitch>
		<FormSwitch v-model:value="disableShowingAnimatedImages">{{ $ts.disableShowingAnimatedImages }}</FormSwitch>
		<FormSwitch v-model:value="useSystemFont">{{ $ts.useSystemFont }}</FormSwitch>
		<FormSwitch v-model:value="useOsNativeEmojis">{{ $ts.useOsNativeEmojis }}
			<div><Mfm text="🍮🍦🍭🍩🍰🍫🍬🥞🍪" :key="useOsNativeEmojis"/></div>
		</FormSwitch>
	</FormGroup>

	<FormRadios v-model="fontSize">
		<template #desc>{{ $ts.fontSize }}</template>
		<option value="small"><span style="font-size: 14px;">Aa</span></option>
		<option :value="null"><span style="font-size: 16px;">Aa</span></option>
		<option value="large"><span style="font-size: 18px;">Aa</span></option>
		<option value="veryLarge"><span style="font-size: 20px;">Aa</span></option>
	</FormRadios>

	<FormSelect v-model:value="instanceTicker">
		<template #label>{{ $ts.instanceTicker }}</template>
		<option value="none">{{ $ts._instanceTicker.none }}</option>
		<option value="remote">{{ $ts._instanceTicker.remote }}</option>
		<option value="always">{{ $ts._instanceTicker.always }}</option>
	</FormSelect>

	<FormSelect v-model:value="nsfw">
		<template #label>{{ $ts.nsfw }}</template>
		<option value="respect">{{ $ts._nsfw.respect }}</option>
		<option value="ignore">{{ $ts._nsfw.ignore }}</option>
		<option value="force">{{ $ts._nsfw.force }}</option>
	</FormSelect>

	<FormGroup>
		<template #label>{{ $ts.defaultNavigationBehaviour }}</template>
		<FormSwitch v-model:value="defaultSideView">{{ $ts.openInSideView }}</FormSwitch>
	</FormGroup>

	<FormSelect v-model:value="chatOpenBehavior">
		<template #label>{{ $ts.chatOpenBehavior }}</template>
		<option value="page">{{ $ts.showInPage }}</option>
		<option value="window">{{ $ts.openInWindow }}</option>
		<option value="popout">{{ $ts.popout }}</option>
	</FormSelect>

	<FormLink to="/settings/deck">{{ $ts.deck }}</FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage, faCog, faColumns, faCogs } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormLink from '@/components/form/link.vue';
import FormButton from '@/components/form/button.vue';
import MkLink from '@/components/link.vue';
import { langs } from '@/config';
import { defaultStore } from '@/store';
import { ColdDeviceStorage } from '@/store';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkLink,
		FormSwitch,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
		FormLink,
		FormButton,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$ts.general,
				icon: faCogs
			},
			langs,
			lang: localStorage.getItem('lang'),
			fontSize: localStorage.getItem('fontSize'),
			useSystemFont: localStorage.getItem('useSystemFont') != null,
			faImage, faCog, faColumns
		}
	},

	computed: {
		serverDisconnectedBehavior: defaultStore.makeGetterSetter('serverDisconnectedBehavior'),
		reduceAnimation: defaultStore.makeGetterSetter('animation', v => !v, v => !v),
		useBlurEffectForModal: defaultStore.makeGetterSetter('useBlurEffectForModal'),
		showGapBetweenNotesInTimeline: defaultStore.makeGetterSetter('showGapBetweenNotesInTimeline'),
		disableAnimatedMfm: defaultStore.makeGetterSetter('animatedMfm', v => !v, v => !v),
		useOsNativeEmojis: defaultStore.makeGetterSetter('useOsNativeEmojis'),
		disableShowingAnimatedImages: defaultStore.makeGetterSetter('disableShowingAnimatedImages'),
		loadRawImages: defaultStore.makeGetterSetter('loadRawImages'),
		titlebar: defaultStore.makeGetterSetter('titlebar'),
		imageNewTab: defaultStore.makeGetterSetter('imageNewTab'),
		nsfw: defaultStore.makeGetterSetter('nsfw'),
		disablePagesScript: defaultStore.makeGetterSetter('disablePagesScript'),
		showFixedPostForm: defaultStore.makeGetterSetter('showFixedPostForm'),
		defaultSideView: defaultStore.makeGetterSetter('defaultSideView'),
		chatOpenBehavior: ColdDeviceStorage.makeGetterSetter('chatOpenBehavior'),
		instanceTicker: defaultStore.makeGetterSetter('instanceTicker'),
		enableInfiniteScroll: defaultStore.makeGetterSetter('enableInfiniteScroll'),
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

		showGapBetweenNotesInTimeline() {
			this.reloadAsk();
		},
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		async reloadAsk() {
			const { canceled } = await os.dialog({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
				showCancelButton: true
			});
			if (canceled) return;

			location.reload();
		}
	}
});
</script>
