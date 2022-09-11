<template>
<div class="mk-media-banner">
	<div v-if="media.isSensitive && hide" class="sensitive" @click="hide = false">
		<span class="icon"><i class="fas fa-exclamation-triangle"></i></span>
		<b>{{ $ts.sensitive }}</b>
		<span>{{ $ts.clickToShow }}</span>
	</div>
	<a v-else class="download"
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span class="icon"><i class="fas fa-download"></i></span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';

const props = withDefaults(defineProps<{
	media: misskey.entities.DriveFile;
}>(), {
});

let hide = $ref(true);
</script>

<style lang="scss" scoped>
.mk-media-banner {
	width: 100%;
	border-radius: 4px;
	margin-top: 4px;
	overflow: hidden;

	> .download,
	> .sensitive {
		display: flex;
		align-items: center;
		font-size: 12px;
		padding: 8px 12px;
		white-space: nowrap;

		> * {
			display: block;
		}

		> b {
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> *:not(:last-child) {
			margin-right: .2em;
		}

		> .icon {
			font-size: 1.6em;
		}
	}

	> .download {
		background: var(--noteAttachedFile);
	}

	> .sensitive {
		background: #111;
		color: #fff;
	}
}
</style>
