<template>
<FormBase>
	<FormInfo warn>{{ $ts._plugin.installWarn }}</FormInfo>

	<FormGroup>
		<FormTextarea v-model:value="code" tall>
			<span>{{ $ts.code }}</span>
		</FormTextarea>
	</FormGroup>

	<FormButton @click="install" :disabled="code == null" primary inline><i class="fas fa-check"></i> {{ $ts.install }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AiScript, parse } from '@syuilo/aiscript';
import { serialize } from '@syuilo/aiscript/built/serializer';
import { v4 as uuid } from 'uuid';
import FormTextarea from '@client/components/form/textarea.vue';
import FormSelect from '@client/components/form/select.vue';
import FormRadios from '@client/components/form/radios.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormLink from '@client/components/form/link.vue';
import FormButton from '@client/components/form/button.vue';
import FormInfo from '@client/components/form/info.vue';
import * as os from '@client/os';
import { ColdDeviceStorage } from '@client/store';
import { unisonReload } from '@client/scripts/unison-reload';
import * as symbols from '@client/symbols';

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
				icon: 'fas fa-download'
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
				os.dialog({
					type: 'error',
					text: 'Syntax error :('
				});
				return;
			}
			const meta = AiScript.collectMetadata(ast);
			if (meta == null) {
				os.dialog({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const data = meta.get(null);
			if (data == null) {
				os.dialog({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const { name, version, author, description, permissions, config } = data;
			if (name == null || version == null || author == null) {
				os.dialog({
					type: 'error',
					text: 'Required property not found :('
				});
				return;
			}

			const token = permissions == null || permissions.length === 0 ? null : await new Promise((res, rej) => {
				os.popup(import('@client/components/token-generate-window.vue'), {
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
