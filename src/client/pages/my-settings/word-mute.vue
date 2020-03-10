<template>
	<section class="rrfwjxfl _card">
		<div class="_title"><fa :icon="faFilter"/> {{ $t('wordMute') }}</div>
		<div class="_content">
			<small>{{ $t('wordMuteDescription') }}</small>
            
            <mk-pagination :pagination="mutedWordsPagination" class="mutedWord" ref="list">
                <template #empty><p>{{ $t('noMutedWord') }}</p></template>
                <template #default="{items}">
                    <div class="record" v-for="mutedWord in items" :key="mutedWord.id">
                        <button class="_textButton del" @click="del(mutedWord.id)"><fa :icon="faTimes" /></button>
                        <div>{{ mutedWord.condition.join(' ') }}</div>
                    </div>
                </template>
            </mk-pagination>
		</div>
        <div class="_footer">
            <mk-input v-model="inputWordToMute" @keydown="onKeydown">
                {{ $t('inputWordToMute') }}
                <template #desc>{{ $t('inputWordToMuteDescription') }}</template>
            </mk-input>
            <mk-button @click="add()" primary inline :disabled="!inputWordToMute"><fa :icon="faPlus"/>{{ $t('add') }}</mk-button>
        </div>
	</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTimes, faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import MkPagination from '../../components/ui/pagination.vue';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';

export default Vue.extend({
    components: {
        MkPagination,
        MkInput,
        MkButton,
    },
    data () {
        return {
			mutedWordsPagination: {
				endpoint: 'mute/words/list',
				limit: 10,
            },
            inputWordToMute: '',
            changed: false,
			faTimes, faSave, faFilter, faPlus
        };
    },
    watch: {
        mutedWords () {
            this.changed = true;
        }
    },
	methods: {
		add() {
            const condition = this.inputWordToMute.split(/\s+/g);
			this.$root.api('mute/words/create', {
                condition,
			}).then(() => {
                this.inputWordToMute = '';
                this.$nextTick(() => this.$refs.list.reload());
			}).catch((err) => {
				this.$root.dialog({
					type: 'error',
					text: err.id
				});
            });
		},
		del(id: string) {
			this.$root.api('mute/words/delete', {
                id,
			}).then(() => {
                this.$refs.list.reload();
			}).catch((err) => {
				this.$root.dialog({
					type: 'error',
					text: err.id
				});
            });
        },
        onKeydown(ev: KeyboardEvent) {
            if (ev.keyCode === 13 && this.inputWordToMute) {
                this.add();
            }
        }
	}
})
</script>

<style lang="scss" scoped>
.rrfwjxfl {
	> ._content {
		max-height: 350px;
		overflow: auto;

        > .mutedWord {
            > .record {
                display: flex;
                align-items: center;
                border-bottom: 1px solid var(--divider);
                height: 48px;

                > .del {
                    margin-right: 8px;
                }
            }

			> .empty {
				opacity: 0.5 !important;
			}
        }
	}
}
</style>