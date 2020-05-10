<template>
<div class="relaycxt">
	<portal to="icon"><fa :icon="faBroadcastTower"/></portal>
	<portal to="title">{{ $t('relays') }}</portal>


	<section class="_card lookup">
		<mk-input v-model="inbox">
			<span>{{ $t('inbox') }}</span>
		</mk-input>
		<mk-button @click="add(inbox)" primary style="margin: 0 auto 16px auto;"><fa :icon="faPlus"/> {{ $t('add') }}</mk-button>
	</section>

	<section class="_card relays">
		<div class="_content relay" v-for="relay in relays" :key="relay.inbox">
			<div>{{ relay.inbox }}</div>
			<div>{{ relay.status }}</div>
			<div class="buttons">
				<mk-button class="button" inline @click="remove(relay.inbox)"><fa :icon="faTrashAlt"/> {{ $t('remove') }}</mk-button>
			</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBroadcastTower, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../i18n';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkTextarea from '../../components/ui/textarea.vue';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('relays') as string
		};
	},

	components: {
		MkButton,
		MkInput,
		MkTextarea,
	},

	data() {
		return {
			relays: [],
			inbox: '',
			faBroadcastTower, faSave, faTrashAlt, faPlus
		}
	},

	created() {
		this.$root.api('admin/relays/list').then(relays => {
			this.relays = relays;
		});
	},

	methods: {
		add(inbox: string) {
			this.$root.api('admin/relays/add', {
				inbox
			}).then(relay => {
				
			});
		},

		remove(inbox: string) {
			this.$root.api('admin/relays/remove', {
				inbox
			}).then(() => {
				
			});
		},

	}
});
</script>

<style lang="scss" scoped>
.ztgjmzrw {
	> .relays {
		> .relay {
			> .buttons {
				> .button:first-child {
					margin-right: 8px;
				}
			}
		}
	}
}
</style>
