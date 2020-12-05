<template>
<div class="rsqzvsbo _section" v-if="meta">
	<h2># {{ $t('pinnedNotes') }}</h2>
	<MkPagination :pagination="pagination" #default="{items}">
		<XNote class="kmkqjgkl" v-for="note in items" :note="note" :key="note.id"/>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import XNote from '@/components/note.vue';
import MkPagination from '@/components/ui/pagination.vue';
import { host, instanceName } from '@/config';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		XNote,
		MkPagination,
	},

	data() {
		return {
			host: toUnicode(host),
			instanceName,
			meta: null,
			pagination: {
				endpoint: 'clips/notes',
				limit: 10,
				params: () => ({
					clipId: this.meta.pinnedClipId,
				})
			},
		};
	},

	created() {
		os.api('meta', { detail: true }).then(meta => {
			this.meta = meta;
		});

		os.api('stats').then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		signin() {
			os.popup(XSigninDialog, {
				autoSet: true
			}, {}, 'closed');
		},

		signup() {
			os.popup(XSignupDialog, {
				autoSet: true
			}, {}, 'closed');
		}
	}
});
</script>

<style lang="scss" scoped>
.rsqzvsbo {
	text-align: center;

	> h2 {
		display: inline-block;
		color: #fff;
		margin: 16px;
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.5);
	}
}

.kmkqjgkl {
	display: inline-block;
	vertical-align: middle;
	width: 600px;
	margin: 16px;
	text-align: left;
	box-shadow: 0 6px 46px rgb(0 0 0 / 30%);
	border-radius: 12px;

	@media (max-width: 800px) {
		display: block;
		width: 100%;
		margin: 12px 0;
	}
}
</style>
