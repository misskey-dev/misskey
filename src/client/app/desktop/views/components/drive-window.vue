<template>
<mk-window ref="window" @closed="destroyDom" width="800px" height="500px" :popout-url="popout">
	<template #header>
		<p v-if="usage" :class="$style.info"><b>{{ usage.toFixed(1) }}%</b> {{ $t('used') }}</p>
		<span :class="$style.title"><fa icon="cloud"/>{{ $t('@.drive') }}</span>
	</template>
	<x-drive :class="$style.browser" multiple :init-folder="folder" ref="browser"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';

export default Vue.extend({
	i18n: i18n('desktop/views/components/drive-window.vue'),
	components: {
		XDrive: () => import('./drive.vue').then(m => m.default),
	},
	props: ['folder'],
	data() {
		return {
			usage: null
		};
	},
	mounted() {
		this.$root.api('drive').then(info => {
			this.usage = info.usage / info.capacity * 100;
		});
	},
	methods: {
		popout() {
			const folder = (this.$refs.browser as any) ? (this.$refs.browser as any).folder : null;
			if (folder) {
				return `${url}/i/drive/folder/${folder.id}`;
			} else {
				return `${url}/i/drive`;
			}
		}
	}
});
</script>

<style lang="stylus" module>
.title
	> [data-icon]
		margin-right 4px

.info
	position absolute
	top 0
	left 16px
	margin 0
	font-size 80%

.browser
	height 100%

</style>

