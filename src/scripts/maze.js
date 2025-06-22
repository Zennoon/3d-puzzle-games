import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Sky } from 'three/addons/objects/Sky.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const toggleInfo = document.getElementById('toggle-help');
const helpDiv = document.getElementById('help-div');

// Toggle help information
toggleInfo.addEventListener('click', () => {
    helpDiv.classList.toggle('hidden');
});

const canvas = document.getElementById('webgl')
const scene = new THREE.Scene();

/**
 * Sounds
 */
const hitSound = new Audio('../sounds/hit.mp3');

const playHitSound = (collision) => {
    console.log('object');
    hitSound.volume = 1;
    hitSound.currentTime = 0;
    hitSound.play();
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();

// Floor
const floorAlphaTexture = textureLoader.load('../textures/floor/alpha.jpg');
const floorColorTexture = textureLoader.load('../textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.jpg');
const floorARMTexture = textureLoader.load('../textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.jpg');
const floorNormalTexture = textureLoader.load('../textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.jpg');
const floorDisplacementTexture = textureLoader.load('../textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.jpg');

floorColorTexture.colorSpace = THREE.SRGBColorSpace;

floorColorTexture.repeat.set(8, 8);
floorARMTexture.repeat.set(8, 8);
floorNormalTexture.repeat.set(8, 8);
floorDisplacementTexture.repeat.set(8, 8);

floorColorTexture.wrapS = THREE.RepeatWrapping;
floorARMTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorDisplacementTexture.wrapS = THREE.RepeatWrapping;

floorColorTexture.wrapT = THREE.RepeatWrapping;
floorARMTexture.wrapT = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping;
floorDisplacementTexture.wrapT = THREE.RepeatWrapping;

// Wall
const wallColorTexture = textureLoader.load('../textures/rock_wall_2k/textures/rock_wall_diff_2k.jpg');
wallColorTexture.colorSpace = THREE.SRGBColorSpace;
const wallARMTexture = textureLoader.load('../textures/rock_wall_2k/textures/rock_wall_arm_2k.jpg');
const wallNormalTexture = textureLoader.load('../textures/rock_wall_2k/textures/rock_wall_nor_gl_2k.jpg');

wallColorTexture.repeat.set(2, 1);
wallARMTexture.repeat.set(2, 1);
wallNormalTexture.repeat.set(2, 1);

wallColorTexture.wrapS = THREE.RepeatWrapping;
wallARMTexture.wrapS = THREE.RepeatWrapping;
wallNormalTexture.wrapS = THREE.RepeatWrapping;

wallColorTexture.wrapT = THREE.RepeatWrapping;
wallARMTexture.wrapT = THREE.RepeatWrapping;
wallNormalTexture.wrapT = THREE.RepeatWrapping;

/**
 * Physics
 */
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, 0, 0);

// Materials (used to dictate what happens when two objects collide)
const wallPhysicsMaterial = new CANNON.Material('wall');
const ballPhysicsMaterial = new CANNON.Material('ball');

const wallBallContactMaterial = new CANNON.ContactMaterial(wallPhysicsMaterial, ballPhysicsMaterial, {
    friction: 0.7,
    restitution: 0.1
});

world.addContactMaterial(wallBallContactMaterial);

/**
 * Objects
 */

// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 100, 100),
    new THREE.MeshStandardMaterial({
        alphaMap: floorAlphaTexture,
        transparent: true,
        map: floorColorTexture,
        aoMap: floorARMTexture,
        roughnessMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture,
        displacementScale: 0.3,
        displacementBias: - 0.36,
        side: THREE.DoubleSide
    })
);

floor.rotation.x = - Math.PI * 0.5
scene.add(floor);

/**
 * Maze
 */
const maze = new THREE.Group();
scene.add(maze);

// Walls
const wallGeometry = new THREE.BoxGeometry(0.25, 3, 1);
const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    aoMap: wallARMTexture,
    roughnessMap: wallARMTexture,
    metalnessMap: wallARMTexture,
    normalMap: wallNormalTexture,
    side: THREE.DoubleSide
});

function createWall(x, y, z, scale, rotate = false) {
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.scale.z = scale;
    if (rotate) {
        wall.rotation.y = - Math.PI * 0.5;
    }
    wall.position.set(x, y, z);
    maze.add(wall);
    const wallShape = new CANNON.Box(new CANNON.Vec3(0.125, 1.5, scale / 2));
    const wallBody = new CANNON.Body({ mass: 0, shape: wallShape, material: wallPhysicsMaterial });
    wallBody.position.copy(wall.position);
    if (rotate) {
        const quat = new CANNON.Quaternion();
        quat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), wall.rotation.y);
        wallBody.quaternion.copy(quat);
    }
    //wallBody.allowSleep = true;
    world.addBody(wallBody);
}   

createWall(-4, 1.5, 0, 10);
createWall(-2, 1.5, 0, 4, true);
createWall(-3, 1.5, -2, 2);
createWall(-0.5, 1.5, -5, 7, true);
createWall(0.5, 1.5, -4, 7, true);
createWall(-3, 1.5, 3, 4);
createWall(-2.5, 1.5, 1, 1, true);
createWall(-2, 1.5, -1, 2);
createWall(-1.5, 1.5, -2, 1, true);
createWall(-1, 1.5, -1.5, 1);
createWall(-2, 1.5, 3, 2);
createWall(-1.5, 1.5, -3, 3, true);
createWall(-1, 1.5, 3, 2, true);
createWall(0, 1.5, 2, 4, true);
createWall(0.5, 1.5, 5, 7, true);
createWall(1, 1.5, 3, 2);
createWall(1, 1.5, 4, 4, true);
createWall(-1, 1.5, 1, 2);
createWall(2, 1.5, 1.5, 1);
createWall(2.5, 1.5, 1, 1, true);
createWall(3, 1.5, 1.5, 1);
createWall(3, 1.5, 3, 2, true);
createWall(0, 1.5, -1.5, 3);
createWall(1, 1.5, -1, 2, true);
createWall(2, 1.5, -1.5, 1);
createWall(2, 1.5, -3, 2, true);
createWall(3, 1.5, -1.5, 3);
createWall(2, 1.5, 0, 2, true);
createWall(1, 1.5, 0.5, 1);
createWall(0.5, 1.5, 1, 1, true);
createWall(1, 1.5, -3, 2);
createWall(4, 1.5, 0, 10);

// Ball
const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 32),
    new THREE.MeshStandardMaterial({
        color: 'red'
    })
);

ball.position.set(-3.4375, 0.3, 6)
scene.add(ball);

const ballShape = new CANNON.Sphere(0.3);
const ballBody = new CANNON.Body({
    mass: 1,
    shape: ballShape,
    material: ballPhysicsMaterial
});

ballBody.position.copy(ball.position);
ballBody.velocity = new CANNON.Vec3(0, 0, 0);
ballBody.addEventListener('collide', playHitSound);
world.addBody(ballBody);

// Define the movement of the ball (when clicking arrow keys, we apply an impulse to the center of the ball)
window.addEventListener('keydown', ({ key }) => {
    switch (key) {
        case 'ArrowUp':
            ballBody.wakeUp();
            ballBody.velocity = new CANNON.Vec3(0, 0, 0);
            ballBody.applyLocalImpulse(new CANNON.Vec3(0, 0, -1), new CANNON.Vec3(0, 0, 0));
            break;
        case 'ArrowLeft':
            ballBody.velocity = new CANNON.Vec3(0, 0, 0);
            ballBody.wakeUp();
            ballBody.applyLocalImpulse(new CANNON.Vec3(-1, 0, 0), new CANNON.Vec3(0, 0, 0));
            break;
        case 'ArrowRight':
            ballBody.velocity = new CANNON.Vec3(0, 0, 0);
            ballBody.wakeUp();
            ballBody.applyLocalImpulse(new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(0, 0, 0));
            break;
        case 'ArrowDown':
            ballBody.velocity = new CANNON.Vec3(0, 0, 0);
            ballBody.wakeUp();
            ballBody.applyLocalImpulse(new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, 0));
            break;
        case 'h': // For halt
            ballBody.velocity = new CANNON.Vec3(0, 0, 0);
            break;
        default:
            ballBody.sleep()
    }
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#86cdff', 1)
scene.add(ambientLight)

// Directional light
const directionalLight = new THREE.DirectionalLight('#86cdff', 1.5)
directionalLight.position.set(3, 2, -8)
scene.add(directionalLight)


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)

camera.position.z = 10;
camera.position.y = 5;
scene.add(camera)

// Controls (only work when the game is finished)
let controls;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Sky
 */
const sky = new Sky();
sky.scale.set(100, 100, 100);
scene.add(sky);

sky.material.uniforms['turbidity'].value = 10;
sky.material.uniforms['rayleigh'].value = 3;
sky.material.uniforms['mieCoefficient'].value = 0.1;
sky.material.uniforms['mieDirectionalG'].value = 0.95;
sky.material.uniforms['sunPosition'].value.set(0.3, -0.0, -0.95);

/**
 * Fog
 */

scene.fog = new THREE.FogExp2('#02343f', 0.1);

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;
let completed = false;
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;
    // // Update controls
    if (controls) controls.update();

    // Update physics world
    world.step(1 / 60, deltaTime);

    // Update objects
    ball.position.copy(ballBody.position);
    ball.quaternion.copy(ballBody.quaternion);

    if (ball.position.x > 3 && ball.position.z < -5) {
        completed = true;
    }

    // Update camera and apply controls if game is finished
    if (completed && !controls) {
        alert('Congratulations! You have finished the maze!')
        camera.position.z = 10;
        camera.position.y = 5;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        controls = new OrbitControls(camera, canvas)
        controls.enableDamping = true
    } else if (!completed) {
        camera.position.copy(ball.position);
        camera.position.y = 4;
        camera.lookAt(ball.position);
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
