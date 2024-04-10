<script>
    import { onMount } from 'svelte';

    import THREE from 'threeInstance';

    let container;
    let scene;
    let camera;
    /** @type {THREE.WebGLRenderer} */
    let renderer;

    let cubes = [];
    let cubeColor = '#00ff00';
    let cubeScale = 1;

    let disableControls = false;

    const init = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        camera.position.z = 10;
    };

    const isCubeIntersecting = (newCube, existingCube) => newCube.position.distanceTo(existingCube.position) < cubeScale;

    /**
     * Algoritms, kas:
     * 1) Generate a Random Position: Create a potential random position for a new cube.
     * 2) Check for Overlaps: Compare this position against existing cubes to check for spatial conflicts (i.e., intersections).
     * 3) Retry if Necessary: If a conflict is detected, generate a new position and check again.
     * 4) Place the Cube: Once a conflict-free position is found, add the cube to the scene.
     */
    const findFreePositionInScene = () => {
        let position;
        let maxAttempts = 100;
        let attempts = 0;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 8,  // Adjust range based on your scene size
                (Math.random() - 0.5) * 8,
                0
            );
            let isFree = true;
            for (let cube of cubes) {
                if (isCubeIntersecting({position}, cube)) {
                    isFree = false;
                    break;
                }
            }
            if (isFree) return position;
            attempts++;
        } while (attempts < maxAttempts);
        return null; // Return null if a free position is not found
    };

    const addCube = () => {
        const position = findFreePositionInScene();
        if (!position) {
            alert('Could not add cube!');
            disableControls = true;
            return;
        }

        const texture = new THREE.CanvasTexture(generateTexture());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        const geometry = new THREE.BoxGeometry(cubeScale, cubeScale, cubeScale);
        const material = new THREE.MeshBasicMaterial({ map: texture, color: cubeColor });

        const cube = new THREE.Mesh(geometry, material);
        // cube.position.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, 0);
        cube.position.copy(position);

        scene.add(cube);
        cubes.push(cube);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        cube.add(line);
    };

    const deleteLastCube = () => {
        const cubeToRemove = cubes.pop();
        if (cubeToRemove) {
            scene.remove(cubeToRemove);
            cubeToRemove.geometry.dispose();
            cubeToRemove.material.dispose();
            
            if (cubeToRemove.children.length) {
                cubeToRemove.children.forEach(child => {
                    if (child instanceof THREE.LineSegments) {
                        child.geometry.dispose();
                        child.material.dispose();
                    }
                });
            }

            disableControls = false;
        }
    };

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
    };

    // const updateCubeProperties = () => {
    //     cubes.forEach(cube => {
    //         cube.material.color.set(cubeColor);
    //         cube.scale.set(cubeScale, cubeScale, cubeScale);
    //     });
    // };

    const animate = () => {
        requestAnimationFrame(animate);
        // cubes.forEach(cube => {
        //     cube.rotation.x += 0.01;
        //     cube.rotation.y += 0.01;
        // });
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
        if (event.key === 'Enter') {
            addCube();
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            deleteLastCube();
        }
    }
</script>

<h1>#1 - Objektu ģenerēšana pēc lietotāja darbības</h1>

<div class="canvas-wrapper" bind:this={container}></div>
<button on:click={addCube} disabled={disableControls}>(Enter) Add Cube</button>

<!-- <input type="color" bind:value={cubeColor} on:change={updateCubeProperties}>
<input type="range" min="0.1" max="3" step="0.1" bind:value={cubeScale} on:input={updateCubeProperties}> -->

<input type="color" bind:value={cubeColor} disabled={disableControls}>
<input type="range" min="0.1" max="3" step="0.1" bind:value={cubeScale} disabled={disableControls}>

<style>
    .canvas-wrapper {
        height: 75vh;
        width: 100%;
    }
</style>