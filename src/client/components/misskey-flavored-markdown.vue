<template>
<mfm-core v-bind="$attrs" class="havbbuyv" :class="{ nowrap: $attrs['nowrap'] }"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MfmCore from './mfm';

export default defineComponent({
	components: {
		MfmCore
	}
});
</script>

<style lang="scss" scoped>
.havbbuyv {
	white-space: pre-wrap;

	&.nowrap {
		white-space: pre;
		word-wrap: normal; // https://codeday.me/jp/qa/20190424/690106.html
		overflow: hidden;
		text-overflow: ellipsis;
	}

	::v-deep(.quote) {
		display: block;
		margin: 8px;
		padding: 6px 0 6px 12px;
		color: var(--fg);
		border-left: solid 3px var(--fg);
		opacity: 0.7;
	}

	::v-deep(pre) {
		font-size: 0.8em;
	}

	> ::v-deep(code) {
		word-break: break-all;
	}

	::v-deep(.title) {
		text-align: center;
		border-bottom: solid 1px var(--divider);
	}
}
</style>
