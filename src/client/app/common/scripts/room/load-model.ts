import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Furniture } from './furniture';

export function loadModel(furniture: Furniture) {
	return new Promise<GLTF>((res, rej) => {
		const loader = new GLTFLoader();
		loader.load(`/assets/furnitures/${furniture.type}/${furniture.type}.glb`, gltf => {
			gltf.scene.name = furniture.id;
			gltf.scene.position.x = furniture.position.x;
			gltf.scene.position.y = furniture.position.y;
			gltf.scene.position.z = furniture.position.z;
			gltf.scene.rotation.x = furniture.rotation.x;
			gltf.scene.rotation.y = furniture.rotation.y;
			gltf.scene.rotation.z = furniture.rotation.z;
			gltf.scene.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			res(gltf);
		}, null, rej);
	});
}
