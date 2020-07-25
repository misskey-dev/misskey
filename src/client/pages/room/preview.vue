<template>
<canvas width="224" height="128"></canvas>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as THREE from 'three';

export default defineComponent({
	data() {
		return {
			selected: null,
			objectHeight: 0,
			orbitRadius: 5
		};
	},

	mounted() {
		const canvas = this.$el;

		const width = canvas.width;
		const height = canvas.height;

		const scene = new THREE.Scene();

		const renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: false
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(width, height);
		renderer.setClearColor(0x000000);
		renderer.autoClear = false;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.cullFace = THREE.CullFaceBack;

		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
		camera.zoom = 10;
		camera.position.x = 0;
		camera.position.y = 2;
		camera.position.z = 0;
		camera.updateProjectionMatrix();
		scene.add(camera);

		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		ambientLight.castShadow = false;
		scene.add(ambientLight);

		const light = new THREE.PointLight(0xffffff, 1, 100);
		light.position.set(3, 3, 3);
		scene.add(light);

		const grid = new THREE.GridHelper(5, 16, 0x444444, 0x222222);
		scene.add(grid);

		const render = () => {
			const timer = Date.now() * 0.0004;
			requestAnimationFrame(render);
			
			camera.position.y = Math.sin(Math.PI / 6) * this.orbitRadius;	// Math.PI / 6 => 30deg
			camera.position.z = Math.cos(timer) * this.orbitRadius;
			camera.position.x = Math.sin(timer) * this.orbitRadius;
			camera.lookAt(new THREE.Vector3(0, this.objectHeight / 2, 0));
			renderer.render(scene, camera);
		};

		this.selected = selected => {
			const obj = selected.clone();

			// Remove current object
			const current = scene.getObjectByName('obj');
			if (current != null) {
				scene.remove(current);
			}

			// Add new object
			obj.name = 'obj';
			obj.position.x = 0;
			obj.position.y = 0;
			obj.position.z = 0;
			obj.rotation.x = 0;
			obj.rotation.y = 0;
			obj.rotation.z = 0;
			obj.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.material = child.material.clone();
					return child.material.emissive.setHex(0x000000);
				}
			});
			const objectBoundingBox = new THREE.Box3().setFromObject(obj);
			this.objectHeight = objectBoundingBox.max.y - objectBoundingBox.min.y;

			const objectWidth = objectBoundingBox.max.x - objectBoundingBox.min.x;
			const objectDepth = objectBoundingBox.max.z - objectBoundingBox.min.z;

			const horizontal = Math.hypot(objectWidth, objectDepth) / camera.aspect;
			this.orbitRadius = Math.max(horizontal, this.objectHeight) * camera.zoom * 0.625 / Math.tan(camera.fov * 0.5 * (Math.PI / 180));
		
			scene.add(obj);
		};

		render();
	},
});
</script>
