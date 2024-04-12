<script>
    import { onMount, onDestroy } from 'svelte';

    import * as CANNON from 'cannon'; // Cannon.js fizikas bibliotēka
    import THREE from "threeInstance";

    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
    
    // GUI, citi vadības elementi:
    import GUI from 'lil-gui';
    import Stats from 'three/examples/jsm/libs/stats.module.js';

    // 3D objekti:
    import { Water } from 'three/examples/jsm/objects/Water.js';
    import { Sky } from 'three/addons/objects/Sky.js';
  
    let scene; 
    let camera;
    let renderer;
    let world;
    let controls, water, sun;

    // 3D modeļu objekti:
    let football;
    let footballGoalNet;
    let waterSurface;

    let container, stats;

    const initScene = () => {
        scene = new THREE.Scene(); // Three.js ainas izveide

        // Setup room environment:
        // const environment = new RoomEnvironment(renderer);
        // const pmremGenerator = new THREE.PMREMGenerator(renderer);
        // scene.background = new THREE.Color(0xbbbbbb);
        // scene.environment = pmremGenerator.fromScene(environment).texture;
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        container.appendChild(renderer.domElement);

        // Perspektīvas skata uzstādīšana un novietošana:
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
        camera.position.set(30, 30, 100);

        // Orbital controls for movement in the scene:
        controls = new OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.target.set( 0, 10, 0 );
        controls.minDistance = 40.0;
        controls.maxDistance = 200.0;
        controls.update();

        // Apgaismojuma uzstādīšana:
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with intensity 1
        directionalLight.position.set(0, 100, 100); // Set light position
        scene.add(directionalLight); // Add light to the scene

        // Fizika:

        world = new CANNON.World();
        world.gravity.set(0, -9.82, 0); // -9.8 m/s^2 paātrinājums y asī, kas atbilst Zemes gravitācijai
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        // Saule:
        sun = new THREE.Vector3();

        const updateSun = () => {
            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);

            sun.setFromSphericalCoords( 1, phi, theta );

            sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
            water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

            if ( renderTarget !== undefined ) renderTarget.dispose();

            sceneEnv.add( sky );
            renderTarget = pmremGenerator.fromScene( sceneEnv );
            scene.add( sky );

            scene.environment = renderTarget.texture;
        }

        // Ūdens ģeometrija:
        const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().setPath('/src/assets/').load('textures/waternormals.jpg', function ( texture ) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                } ),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: scene.fog !== undefined
            }
        );

        water.rotation.x = - Math.PI / 2;

        scene.add(water);

        // Debesis:
        const sky = new Sky();
        sky.scale.setScalar( 10000 );
        scene.add( sky );

        const skyUniforms = sky.material.uniforms;
        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        // Sākuma parametri ainas pārvaldībai:
        const parameters = {
            elevation: 2,
            azimuth: 180
        };

        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        const sceneEnv = new THREE.Scene();

        let renderTarget;
        updateSun();


        // Dažādu modeļu vadības kontroles elementi (GUI) un statistika:
        stats = new Stats();
        container.appendChild(stats.dom);
        
        const gui = new GUI();

        const folderSky = gui.addFolder( 'Sky' );
        folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
        folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );

        const waterUniforms = water.material.uniforms;

        const folderWater = gui.addFolder( 'Water' );
        folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
        folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );

        // Modeļu ielāde:

        const loader = new GLTFLoader().setPath('/src/assets/models/');

        loader.load('soccer_ball.glb', (gltf) => {
            football = gltf.scene;
            football.scale.set(2, 2, 2); // Set scale factors
            scene.add(football);
            // TODO: Add physics body for football
        }, undefined, error => {
            console.log(error);
        });
        // loader.load('football_goal.glb', (gltf) => {
        //     footballGoalNet = gltf.scene;
        //     // goalNet.scale.set(0.05, 0.05, 0.05); // Set scale factors
        //     scene.add(footballGoalNet);
        //     // TODO: Add physics body for goal net
        // }, undefined, error => {
        //     console.log(error);
        // });
        // // animated_water_surface.glb
        // loader.load('ocean_water_surface.glb', (gltf) => {
        //     const waterSurface = gltf.scene;
        //     // waterSurface.scale.set(0.15, 0.15, 0.15); // Set scale factors
        //     scene.add(waterSurface);
        //     // TODO: Add physics body for water surface
        // }, undefined, error => {
        //     console.log(error);
        // });

        window.addEventListener( 'resize', onWindowResize );
    };

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Katrā kadrā izpilda noteiktas datu ielādes un attēlošanas darbības:
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        stats.update();
        
        render();

        // Update physics world
        world.step(1 / 60);

        // Update Three.js scene objects based on physics simulation
        // TODO: Update positions and orientations of objects
    };

    const render = () => {
        const time = performance.now() * 0.001;

        football.position.y = Math.sin( time ) * 20 + 5;
        football.rotation.x = time * 0.5;
        football.rotation.z = time * 0.51;

        water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

        renderer.render( scene, camera );
    };

    onMount(() => {
        initScene();
        animate();
    });

</script>

<div id="scene" class="canvas-wrapper" bind:this={container}></div>

<style>
    .canvas-wrapper {
        position: relative;
    }
</style>