<template>
<canvas width=224 height=128></canvas>
</template>

<script lang="ts">
import Vue from 'vue';
import * as THREE from 'three';

export default Vue.extend({
	props: {
		object: {
			required: true
		}
	},

	data() {
		return {
			scene: null,
			renderer: null,
			camera: null,
			objectBoundingBox: null
		};
	},

	watch: {
		object() {
			this.initObj();
		}
	},

	mounted() {
		const canvas = this.$el;

		const width = canvas.width;
		const height = canvas.height;

		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.renderer.setClearColor(0x000000, 0);
		this.renderer.autoClear = false;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.cullFace = THREE.CullFaceBack;

		this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
		this.camera.zoom = 10;
		this.camera.position.x = 0;
		this.camera.position.y = 2;
		this.camera.position.z = 0;
		this.camera.updateProjectionMatrix();
		this.scene.add(this.camera);

		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		ambientLight.castShadow = false;
		this.scene.add(ambientLight);

		const light = new THREE.PointLight(0xffffff, 1, 100);
		light.position.set(3, 3, 3);
		this.scene.add(light);

		const grid = new THREE.GridHelper(5, 16, 0x444444, 0x222222);
		this.scene.add(grid);

		this.initObj();

		this.render();
	},

	methods: {
		initObj() {
			// Remove current object
			const current = this.scene.getObjectByName('obj');
			if (current != null) {
				this.scene.remove(current);
			}

			// Add new object
			const previewObj = this.object.clone();
			previewObj.name = 'obj';
			previewObj.position.x = 0;
			previewObj.position.y = 0;
			previewObj.position.z = 0;
			previewObj.rotation.x = 0;
			previewObj.rotation.y = 0;
			previewObj.rotation.z = 0;
			previewObj.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.material = child.material.clone();
					return child.material.emissive.setHex(0x000000);
				}
			});
			this.objectBoundingBox = new THREE.Box3().setFromObject(previewObj);
			this.scene.add(previewObj);
		},

		render() {
			const timer = Date.now() * 0.0004;
			requestAnimationFrame(this.render);
			if (this.object != null) {
				const objectHeight = this.objectBoundingBox.max.y - this.objectBoundingBox.min.y;
				this.camera.position.y = 2 + objectHeight / 2;
				this.camera.position.z = Math.cos(timer) * 10;
				this.camera.position.x = Math.sin(timer) * 10;
				this.camera.lookAt(new THREE.Vector3(0, objectHeight / 2, 0));
				this.renderer.render(this.scene, this.camera);
			}
		}
	}
});
</script>
