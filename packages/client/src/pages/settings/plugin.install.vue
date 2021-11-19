<template>
<FormBase>
	<FormInfo warn>{{ $ts._plugin.installWarn }}</FormInfo>

	<FormGroup>
		<FormTextarea v-model="code" tall>
			<span>{{ $ts.code }}</span>
		</FormTextarea>
	</FormGroup>

	<FormButton :disabled="code == null" primary inline @click="install"><i class="fas fa-check"></i> {{ $ts.install }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AiScript, parse } from '@syuilo/aiscript';
import { serialize } from '@syuilo/aiscript/built/serializer';
import { v4 as uuid } from 'uuid';
import FormTextarea from '@/components/form/textarea.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormInfo from '@/components/debobigego/info.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormTextarea,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
		FormLink,
		FormButton,
		FormInfo,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts._plugin.install,
				icon: 'fas fa-download',
				bg: 'var(--bg)',
			},
			code: null,
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		installPlugin({ id, meta, ast, token }) {
			ColdDeviceStorage.set('plugins', ColdDeviceStorage.get('plugins').concat({
				...meta,
				id,
				active: true,
				configData: {},
				token: token,
				ast: ast
			}));
		},

		async install() {
			let ast;
			try {
				ast = parse(this.code);
			} catch (e) {
				os.alert({
					type: 'error',
					text: 'Syntax error :('
				});
				return;
			}
			const meta = AiScript.collectMetadata(ast);
			if (meta == null) {
				os.alert({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const data = meta.get(null);
			if (data == null) {
				os.alert({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const { name, version, author, description, permissions, config } = data;
			if (name == null || version == null || author == null) {
				os.alert({
					type: 'error',
					text: 'Required property not found :('
				});
				return;
			}

			const token = permissions == null || permissions.length === 0 ? null : await new Promise((res, rej) => {
				os.popup(import('@/components/token-generate-window.vue'), {
					title: this.$ts.tokenRequested,
					information: this.$ts.pluginTokenRequestedDescription,
					initialName: name,
					initialPermissions: permissions
				}, {
					done: async result => {
						const { name, permissions } = result;
						const { token } = await os.api('miauth/gen-token', {
							session: null,
							name: name,
							permission: permissions,
						});

						res(token);
					}
				}, 'closed');
			});

			this.installPlugin({
				id: uuid(),
				meta: {
					name, version, author, description, permissions, config
				},
				token,
				ast: serialize(ast)
			});

			os.success();

			this.$nextTick(() => {
				unisonReload();
			});
		},
	}
});
</script>
