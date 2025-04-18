import * as THREE from '../modules/three-r175/build/three.module.js';

export class GpuPicker {
    constructor(renderer, width=512, height=512) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;

        this.pickingScene = new THREE.Scene();
        this.pickingRT = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
        });
    }

    addChunkMesh(chunkKey, pickingMesh) {
        pickingMesh.name = `PickingChunk_${chunkKey}`;
        this.pickingScene.add(pickingMesh);
    }

    removeChunkMesh(pickingMesh) {
        if (!pickingMesh) return;
        
        // Remove from scene
        this.pickingScene.remove(pickingMesh);
        
        // Dispose resources
        if (pickingMesh.geometry) {
            pickingMesh.geometry.dispose();
            pickingMesh.geometry = null;
        }
        if (pickingMesh.material) {
            pickingMesh.material.dispose();
            pickingMesh.material = null;
        }
        
        pickingMesh = null;
    }

    pick(camera, mouseX, mouseY) {
        // Convert screen coords to picking coords
        const canvasRect = this.renderer.domElement.getBoundingClientRect();
        const px = Math.floor((mouseX - canvasRect.left) * (this.width / canvasRect.width));
        const py = Math.floor((canvasRect.height - (mouseY - canvasRect.top)) * (this.height / canvasRect.height));

        this.renderer.setRenderTarget(this.pickingRT);
        this.renderer.clear();
        this.renderer.render(this.pickingScene, camera);
        this.renderer.setRenderTarget(null);

        const pixel = new Uint8Array(4);
        this.renderer.readRenderTargetPixels(this.pickingRT, px, py, 1, 1, pixel);

        if (pixel[3] < 255) {
            // Transparent => no building
            return null;
        }
        const r = pixel[0], g = pixel[1], b = pixel[2];
        const buildingID = (r << 16) | (g << 8) | b;
        return buildingID;
    }

    dispose() {
        if (this.pickingRT) {
            this.pickingRT.dispose();
            this.pickingRT = null;
        }
        
        // Clear picking scene and dispose all meshes
        this.pickingScene.traverse((obj) => {
            if (obj.isMesh) {
                if (obj.geometry) {
                    obj.geometry.dispose();
                    obj.geometry = null;
                }
                if (obj.material) {
                    obj.material.dispose();
                    obj.material = null;
                }
            }
        });
        
        this.pickingScene.clear();
        this.pickingScene = null;
    }
}
