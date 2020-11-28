<template>
<FormBase class="znqjceqz">
	<section class="_formItem">
		<div class="_formPanel" style="text-align: center; padding: 16px;">
			<img src="/assets/icons/512.png" alt="" style="display: block; width: 100px; margin: 0 auto; border-radius: 16px;"/>
			<div style="margin-top: 0.75em;">Misskey</div>
			<div style="opacity: 0.5;">v{{ version }}</div>
		</div>
	</section>
	<section class="_formItem" style="text-align: center; padding: 0 16px;">
		{{ $t('_aboutMisskey.about') }}
	</section>
	<FormGroup>
		<FormLink to="https://github.com/syuilo/misskey" external><template #icon><Fa :icon="faCode"/></template>{{ $t('_aboutMisskey.source') }}</FormLink>
		<FormLink to="https://crowdin.com/project/misskey" external><template #icon><Fa :icon="faLanguage"/></template>{{ $t('_aboutMisskey.translation') }}</FormLink>
		<FormLink to="https://www.patreon.com/syuilo" external><template #icon><Fa :icon="faHandHoldingMedical"/></template>{{ $t('_aboutMisskey.donate') }}</FormLink>
	</FormGroup>
	<FormGroup>
		<template #label>{{ $t('_aboutMisskey.contributors') }}</template>
		<FormLink to="https://github.com/syuilo" external>@syuilo</FormLink>
		<FormLink to="https://github.com/AyaMorisawa" external>@AyaMorisawa</FormLink>
		<FormLink to="https://github.com/mei23" external>@mei23</FormLink>
		<FormLink to="https://github.com/acid-chicken" external>@acid-chicken</FormLink>
		<FormLink to="https://github.com/tamaina" external>@tamaina</FormLink>
		<FormLink to="https://github.com/rinsuki" external>@rinsuki</FormLink>
		<FormLink to="https://github.com/Xeltica" external>@Xeltica</FormLink>
		<FormLink to="https://github.com/u1-liquid" external>@u1-liquid</FormLink>
		<template #caption><MkLink url="https://github.com/syuilo/misskey/graphs/contributors">{{ $t('_aboutMisskey.allContributors') }}</MkLink></template>
	</FormGroup>
	<FormGroup>
		<template #label><Mfm text="[jelly ❤]"/> {{ $t('_aboutMisskey.patrons') }}</template>
		<FormKeyValueView v-for="patron in patrons" :key="patron"><template #key>{{ patron }}</template></FormKeyValueView>
		<template #caption>{{ $t('_aboutMisskey.morePatrons') }}</template>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle, faCode, faLanguage, faHandHoldingMedical, } from '@fortawesome/free-solid-svg-icons';
import { version } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormKeyValueView from '@/components/form/key-value-view.vue';
import MkLink from '@/components/link.vue';
import * as os from '@/os';

const patrons = [
	'Satsuki Yanagi',
	'noellabo',
	'Gargron',
	'Atsuko Tominaga',
	'AureoleArk',
	'naga_rus',
	'Melilot',
	'Hekovic',
	'Nokotaro Takeda',
	'dansup',
	'nenohi',
	'motcha',
	'nanami kan',
	'Eduardo Quiros',
	'Peter G.',
	'YUKIMOCHI',
	'Efertone',
	'makokunsan',
	'mewl hayabusa',
	'見当かなみ',
	'natalie',
	'takimura',
	'sikyosyounin',
	'weepjp',
	'mydarkstar',
	'Nesakko',
	'sheeta.s',
	'osapon',
	'YuzuRyo61',
	'wara',
	'mkatze',
	'kiritan',
	'CG',
	'Denshi',
	'Osushimaru',
	'Liaizon Wakest',
];

export default defineComponent({
	components: {
		FormBase,
		FormGroup,
		FormLink,
		FormKeyValueView,
		MkLink,
	},

	data() {
		return {
			INFO: {
				title: this.$t('aboutMisskey'),
				icon: null
			},
			version,
			patrons,
			faInfoCircle, faCode, faLanguage, faHandHoldingMedical,
		}
	},
});
</script>

<style lang="scss" scoped>
.znqjceqz {
	max-width: 800px;
	box-sizing: border-box;
	margin: 0 auto;
}
</style>
