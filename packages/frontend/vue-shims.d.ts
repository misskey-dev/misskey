/* eslint-disable */
declare module "*.vue" {
	import { defineComponent } from "vue";
	const component: ReturnType<typeof defineComponent>;
	// biome-ignore lint/style/noDefaultExport: vue convention
	export default component;
}
