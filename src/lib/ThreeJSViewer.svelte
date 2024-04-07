<script>
    import { onMount } from 'svelte';
    import * as THREE from 'three';

    let container;
    let scene;
    let camera;
    /** @type {THREE.WebGLRenderer} */
    let renderer;

    let cubes = [];  // Store multiple cubes

    const init = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        camera.position.z = 5;
    };

    const addCube = () => {
        const texture = new THREE.CanvasTexture(generateTexture());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, 0);  // Randomize position
        scene.add(cube);
        cubes.push(cube);

        // Add edges
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        cube.add(line);
    }

    const generateTexture = () => {
        const size = 64; // The size of the texture
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');

        // Draw the checkerboard
        context.fillStyle = 'white';
        context.fillRect(0, 0, size, size);
        context.fillStyle = 'black';
        for (let y = 0; y < size; y += 16) {
            for (let x = 0; x < size; x += 16) {
                if ((x ^ y) & 16) {
                    context.fillRect(x, y, 8, 8);
                }
            }
        }

        return canvas;
    }

    const animate = () => {
        requestAnimationFrame(animate);
        cubes.forEach(cube => {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
        });
        renderer.render(scene, camera);
    };

    onMount(() => {
        init();
        animate();
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            renderer.dispose();
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    const handleKeyDown = event => {
        if (event.key === 'Enter') {  // Press 'Enter' to add a cube
            addCube();
        }
    }
</script>

<div class="canvas-wrapper" bind:this={container}></div>
<button on:click={addCube}>Add Cube</button>


<style>
    .canvas-wrapper {
        height: 100vh;
        width: 100%;
    }
</style>