<script>
    import { onMount } from 'svelte';

    import THREE from "threeInstance";

    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    
    // GUI, citi vadības elementi:
    import GUI from 'lil-gui';
    import Stats from 'three/examples/jsm/libs/stats.module.js';

    // 3D objekti:
    import { Water } from 'three/examples/jsm/objects/Water.js';
    import { Sky } from 'three/addons/objects/Sky.js';

    // SKATĪT: Peldošu laivu piemērs ar Three.js un water shader (saite: https://sbcode.net/threejs/gerstnerwater/)
  
    let scene; 
    let camera;
    let renderer;

    let water;
    let sun;

    let container;

    let controls;
    let stats;
    
    // Sākuma parametri ainas pārvaldībai:
    let gui;
    let parameters = {
        elevation: 0.5,
        azimuth: 180,
        orbitSpeed: 0
    };

    // 3D modeļu objekti:
    let waterPoloBall;
    let waterPoloGoalNet;
    
    const initScene = () => {
        // Three.js ainas izveide
        scene = new THREE.Scene();
        
        // Iespējo WebGL renderētāju:
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        container.appendChild(renderer.domElement);

        // Perspektīvas skata uzstādīšana un novietošana:
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
        camera.position.set(30, 30, 100);

        // Kameras kustības noteikšana:
        controls = new OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.target.set(0, 10, 0);
        controls.minDistance = 40.0;
        controls.maxDistance = 200.0;
        controls.update();

        // Apgaismojuma uzstādīšana:
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 100, 100);
        scene.add(directionalLight);

        // Saule:
        sun = new THREE.Vector3();

        // Funkcija, kas tiek izpildīta brīdī, kad ar GUI palīdzību tiek mainīti debesu parametri
        // Tie tiek uzreiz pamainīti un uzstādīti debesu / saules objektam
        const updateSun = () => {
            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);

            if (parameters.orbitSpeed > 0) {

            }

            sun.setFromSphericalCoords(1, phi, theta);

            sky.material.uniforms['sunPosition'].value.copy(sun);
            water.material.uniforms['sunDirection'].value.copy(sun).normalize();

            if (renderTarget !== undefined) renderTarget.dispose();

            sceneEnv.add(sky);
            renderTarget = pmremGenerator.fromScene(sceneEnv);
            scene.add(sky);

            scene.environment = renderTarget.texture;
        }

        // Ūdens ģeometrija:
        // const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
        const waterGeometry = new THREE.PlaneGeometry(4096, 4096, 256, 256);
        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader()
                    .setPath('/src/assets/')
                    .load('textures/waternormals.jpg', texture => {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                // fog: scene.fog !== undefined
                fog: undefined
            }
        );
        water.material.wireframe = false;
        water.rotation.x = - Math.PI / 2;

        scene.add(water);

        // Debesis:
        const sky = new Sky();
        sky.scale.setScalar(10000);
        scene.add(sky);

        const skyUniforms = sky.material.uniforms;
        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const sceneEnv = new THREE.Scene();

        let renderTarget;
        updateSun();

        // TODO: Saules pozīcija pēc dienas laika:

        // Dažādu modeļu vadības kontroles elementi (GUI) un statistika:
        stats = new Stats();
        container.appendChild(stats.dom);
        
        gui = new GUI();

        const folderSky = gui.addFolder('Debesis');
        folderSky.add(parameters, 'elevation', -5, 15, 0.1).name('Pacēlums').onChange(updateSun);
        folderSky.add(parameters, 'azimuth', - 180, 180, 0.1).name('Azimuta leņķis').onChange(updateSun);  // https://lv.wikipedia.org/wiki/Azimuts - Leņķis starp atskaites plakni un punktu
        folderSky.add(parameters, 'orbitSpeed', 0, 1, 0.1).name('Saules kustības ātrums').onChange(updateSun);

        const waterUniforms = water.material.uniforms;

        const folderWater = gui.addFolder('Ūdens virsma');
        folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('Deformācijas skala');
        folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('Izmērs');

        // Modeļu ielāde:
        
        // Ūdenspolo bumba:
        new GLTFLoader()
            .setPath('/src/assets/models/')
            .load('waterpolo_ball_FINAL_v2.glb', (gltf) => {
                waterPoloBall = gltf.scene;
                waterPoloBall.scale.set(0.1, 0.1, 0.1);
                scene.add(waterPoloBall);
                animateModelIntro(waterPoloBall, new THREE.Vector3(3, 3, 3), 1);
            }, undefined, error => {
                console.log(error);
            });
        
        // Ūdenspolo vārti:
        new FBXLoader()
            .setPath('/src/assets/models/')
            .load('water_polo_goal_FINAL.fbx', (gltf) => {
                waterPoloGoalNet = gltf;
                waterPoloGoalNet.scale.set(0.01, 0.01, 0.01);
                scene.add(waterPoloGoalNet);
                animateModelIntro(waterPoloGoalNet, new THREE.Vector3(0.7, 0.7, 0.7), 1);

                waterPoloGoalNet.position.x = -250; // Vārti vienmēr atradīsies noteiktā attālumā no futbola bumbas sākotnējās pozīcijas (0, 0, 0)
            }, undefined, error => {
                console.log(error);
            });

        window.addEventListener('resize', onWindowResize);
    };

    const animateModelIntro = (model, targetScale, targetOpacity) => {
        const duration = 1000; // ms
        graduallyLoadObject(model.scale, targetScale, duration);
        if (model.material) {
            graduallyLoadObject(model.material, { opacity: targetOpacity }, duration, () => {
                model.material.transparent = targetOpacity < 1;
            });
        }
    }

    const graduallyLoadObject = (object, targetProperties, duration, onComplete) => {
        const startTime = Date.now();
        const initialProperties = {};
        for (const key in targetProperties) {
            initialProperties[key] = object[key];
        }

        const update = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            for (const key in targetProperties) {
                object[key] = initialProperties[key] + (targetProperties[key] - initialProperties[key]) * t;
            }
            if (t < 1) {
                requestAnimationFrame(update);
            } else {
                onComplete?.();
            }
        }

        update();
    }

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
    };

    const render = () => {
        const time = performance.now() * 0.001;

        if (waterPoloBall) {
            // Katru reizi, kad tiek renderēts kadrs, bumbai piemēro rotācijas animāciju y koordinātas virzienā, kas laika gaitā mainās ( -1*20 + 5 ... 1*20 + 5 )
            waterPoloBall.position.y = Math.sin(time) * 20 + 5;
            waterPoloBall.rotation.x = time * 0.5;
            waterPoloBall.rotation.y = time * 0.5;
            waterPoloBall.rotation.z = time * 0.51;
        }

        water.material.uniforms['time'].value += 1.0 / 60.0;

        renderer.render(scene, camera);
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