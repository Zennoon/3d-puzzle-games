import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Tween, Group, Easing } from '@tweenjs/tween.js';

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();

// Base
const baseARMTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_arm_2k.jpg');
const baseDisplacementTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_disp_2k.jpg');
const baseNormalTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_nor_gl_2k.jpg');
const baseDiffTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_diff_2k.jpg');

// Disk
const diskARMTexture = textureLoader.load('../textures/gravel_embedded_concrete_2k/textures/gravel_embedded_concrete_arm_2k.jpg');
const diskDisplacementTexture = textureLoader.load('../textures/gravel_embedded_concrete_2k/textures/gravel_embedded_concrete_disp_2k.jpg');
const diskNormalTexture = textureLoader.load('../textures/gravel_embedded_concrete_2k/textures/gravel_embedded_concrete_nor_gl_2k.jpg');
const diskDiffTexture = textureLoader.load('../textures/gravel_embedded_concrete_2k/textures/gravel_embedded_concrete_diff_2k.jpg');

/**
 * Base
*/

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Canvas
const canvas = document.getElementById('webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Environment Map
 */
const rgbeLoader = new RGBELoader();
rgbeLoader.load('../textures/environmentMap/2k.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * Objects
 */
const baseGeometry = new THREE.BoxGeometry(21, 1, 8);
const baseMaterial = new THREE.MeshStandardMaterial({
    map: baseDiffTexture,
    aoMap: baseARMTexture,
    roughnessMap: baseARMTexture,
    metalnessMap: baseARMTexture,
    normalMap: baseNormalTexture
});
const base = new THREE.Mesh(baseGeometry, baseMaterial);
base.position.y = -0.5;
scene.add(base);

/**
 * Towers
 */
const towers = [];
const towerHeight = 6;
const towerGeometry = new THREE.CylinderGeometry(0.2, 0.2, towerHeight, 32);
const towerMaterial = new THREE.MeshStandardMaterial({
    map: baseDiffTexture,
    aoMap: baseARMTexture,
    roughnessMap: baseARMTexture,
    metalnessMap: baseARMTexture,
    normalMap: baseNormalTexture
})

function createTower(xCoord) {
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(xCoord, towerHeight / 2, 0);
    towers.push(tower);
}

createTower(-7);
createTower(0);
createTower(7);

scene.add(...towers);

/**
 * Disks
 */
let disks = [[], [], []];
const diskMaterial = new THREE.MeshStandardMaterial({
    map: diskDiffTexture,
    aoMap: diskARMTexture,
    roughnessMap: diskARMTexture,
    metalnessMap: diskARMTexture,
    normalMap: diskNormalTexture
});

function createDisk(radius, height, x, y, towerIndex) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const disk = new THREE.Mesh(geometry, diskMaterial);
    disk.position.set(x, y, 0);
    scene.add(disk);
    disks[towerIndex].push(disk);
}

let numDisks = 4;
const numDisksInput = document.getElementById('num-disks');
const numDisksIncr = document.getElementById('incr-disks');
const numDisksDecr = document.getElementById('decr-disks');

numDisksIncr.addEventListener('click', () => {
    if (numDisks === 10) {
        return;
    }
    numDisks += 1;
    replaceDisks();
    numDisksInput.textContent = numDisks;
});

numDisksDecr.addEventListener('click', () => {
    if (numDisks === 3) {
        return;
    }
    numDisks -= 1;
    replaceDisks();
    numDisksInput.textContent = numDisks;
});


for (let i = 0; i < numDisks; i++) {
    createDisk((numDisks / 3) - 0.25 * i, 0.5, -7, 0.25 + 0.5 * i, 0);
}

function replaceDisks() {
    for (const tower of disks) {
        for (const disk of tower) {
            scene.remove(disk);
        }
    }
    disks = [[], [], []];

    for (let i = 0; i < numDisks; i++) {
        createDisk((numDisks / 3) - 0.25 * i, 0.5, -7, 0.25 + 0.5 * i, 0);
    }    
}

/**
 * Handle tower selection and disk movement
 */
let selectedTowerIndex = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(towers);

    if (intersects.length > 0) {
        const towerIndex = towers.indexOf(intersects[0].object);
        handleTowerSelection(towerIndex);
    }
}

function onTouchStart(event) {
    if (event.touches.length > 0) {
        mouse.x = (event.touches[0].clientX / sizes.width) * 2 - 1;
        mouse.y = - (event.touched[0].clientY / sizes.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(towers);

        if (intersects.length > 0) {
            const towerIndex = towers.indexOf(intersects[0].object);
            handleTowerSelection(towerIndex);
        }
    }
}

function handleTowerSelection(towerIndex) {
    if (selectedTowerIndex === null) {
        selectedTowerIndex = towerIndex;
        towers[towerIndex].material.map = null;
        towers[towerIndex].material.color.set(0xffff00);
    } else {
        moveDisk(selectedTowerIndex, towerIndex);
        towers[selectedTowerIndex].material.color.set(0x808080);
        selectedTowerIndex = null;
    }

    if (disks[2].length === numDisks) {
         disks[2].forEach(disk => {
            disk.material.color.set(0xFFD700); // Golden color
        });

        // Change color of rods (towers)
        towers.forEach(tower => {
            tower.material.color.set(0xFFD700); // Golden color
        });

        // Change color of base
        base.material.color.set(0xFFD700); // Golden color

        alert("Game finished!");
    }
}
const tweensGroup = new Group();

function moveDisk(fromTowerIndex, toTowerIndex) {
    if (disks[fromTowerIndex].length === 0) {
        return;
    }

    const fromDisk = disks[fromTowerIndex][disks[fromTowerIndex].length - 1]; // Get the disk to be moved
    const toDisk = disks[toTowerIndex][disks[toTowerIndex].length - 1]; // Get the top disk from the tower to be moved to
    if (toDisk && fromDisk.geometry.parameters.radiusTop > toDisk.geometry.parameters.radiusTop) {
        return; // An attempt to put a larger disk on top of a smaller one
    }

    disks[fromTowerIndex].pop();
    console.log(disks, toTowerIndex);

    const targetPosition = {
        x: towers[toTowerIndex].position.x,
        y: 0.25 + disks[toTowerIndex].length * 0.5,
        z: 0
    };
    console.log('Here');
    console.log(targetPosition);

    const upPosition = { ...fromDisk.position, y: towerHeight + 1 };
    const moveUpTween = new Tween(fromDisk.position)
        .to(upPosition, 500)
        .easing(Easing.Quadratic.Out)
    const moveSideWaysTween = new Tween(fromDisk.position)
        .to({ x: targetPosition.x }, 1000)
        .easing(Easing.Quadratic.Out)
    const moveDownTween = new Tween(fromDisk.position)
        .to(targetPosition, 500)
        .easing(Easing.Quadratic.Out)

    moveUpTween.chain(moveSideWaysTween);
    moveSideWaysTween.chain(moveDownTween);
    moveUpTween.start();
    
    tweensGroup.add(moveUpTween, moveSideWaysTween, moveDownTween);

    disks[toTowerIndex].push(fromDisk);
    console.log('Disk added to destination');
    console.log(disks);

    if (disks[2].length === numDisks) {
        // Game finished, change colors to golden

        // Change color of disks
        disks[2].forEach(disk => {
            disk.material.color.set(0xFFD700); // Golden color
        });

        // Change color of rods (towers)
        towers.forEach(tower => {
            tower.material.color.set(0xFFD700); // Golden color
        });

        // Change color of base
        base.material.color.set(0xFFD700); // Golden color

        console.log("Game finished!");
        // You can add further logic here for game completion actions
    }
}

window.addEventListener('click', onMouseClick);
window.addEventListener('touchstart', onTouchStart);

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
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 10
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const tick = () =>
{
    // Update controls
    controls.update()
    tweensGroup.update();

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
