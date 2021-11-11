<template>
<div class="_debobigegoItem">
	<div class="_debobigegoPanel anocepby">
		<span class="key"><slot name="key"></slot></span>
		<span class="value"><slot name="value"></slot></span>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './debobigego.scss';

export default defineComponent({

});
</script>

<style lang="scss" scoped>
.anocepby {
	display: flex;
	align-items: center;
	padding: 14px var(--debobigegoContentHMargin);

	> .key {
		margin-right: 12px;
		white-space: nowrap;
	}

	> .value {
		margin-left: auto;
		opacity: 0.7;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}
}
</style>
