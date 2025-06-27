import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Tween, Group, Easing } from '@tweenjs/tween.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/**
 * Sounds
 */
const hitSound = new Audio('../sounds/hit.mp3');

const playHitSound = () => {
    hitSound.volume = 1;
    hitSound.currentTime = 0;
    hitSound.play();
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();

// Wood
const woodARMTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_arm_2k.jpg');
const woodNormalTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_nor_gl_2k.jpg');
const woodDiffTexture = textureLoader.load('../textures/rosewood_veneer1_2k/textures/rosewood_veneer1_diff_2k.jpg');

/**
 * Base
 */

// Scene
const scene = new THREE.Scene();

/**
 * Environment Map
 */
const rgbeLoader = new RGBELoader();
rgbeLoader.load('../textures/boma_2k.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = environmentMap;
    scene.environment = environmentMap;
});

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10, 5);

// Renderer
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Orbit controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(2.25, 0, -2.25);

/**
 * Objects
 */
// Tiles container
const container = new THREE.Group();
container.position.set(1.7, -0.2, -1.7);
scene.add(container);
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    map: woodDiffTexture,
    aoMap: woodARMTexture,
    roughnessMap: woodARMTexture,
    metalnessMap: woodARMTexture,
    normalMap: woodNormalTexture
});

// Floor of the container
const base = new THREE.Mesh(geometry, material);
base.scale.set(4.5, 0.2, 4.5);
container.add(base);

// Walls
const wall1 = new THREE.Mesh(geometry, material);
wall1.scale.set(0.2, 0.4, 4.5);
wall1.position.set(-2.35, 0.1, 0);
container.add(wall1);

const wall2 = new THREE.Mesh(geometry, material);
wall2.scale.set(0.2, 0.4, 4.5);
wall2.position.set(2.35, 0.1, 0);
container.add(wall2);

const wall3 = new THREE.Mesh(geometry, material);
wall3.scale.set(4.5, 0.4, 0.2);
wall3.position.set(0, 0.1, -2.35);
container.add(wall3);

const wall4 = new THREE.Mesh(geometry, material);
wall4.scale.set(4.5, 0.4, 0.2);
wall4.position.set(0, 0.1, 2.35);
container.add(wall4);

/**
 * Tiles
 */
const tileSize = 1.1;
const gridSize = 4;
let emptyPos = { x: 3, y: 3 };
const tiles = [];

// Used to write the number on the tile
function createNumberTexture(num) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), size / 2, size / 2);
    return new THREE.CanvasTexture(canvas);
}

// Creates a tile with the given number in the given x, y coordinate
function createTile(num, x, y) {
    const geometry = new THREE.BoxGeometry(1, 0.2, 1);
    const material = new THREE.MeshStandardMaterial({ map:  createNumberTexture(num) });
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(x * tileSize, 0, -y * tileSize);
    tile.userData = { num, x, y };
    scene.add(tile);
    return tile;
}

// Converts array to 4 * 4 matrix
function reverseGrid(array) {
  let matrix = [];
  for (let i = 0; i < 4; i++) {
    matrix = (array.slice(i * 4, i * 4 + 4)).concat(matrix);
  }
  return matrix.flat();
}

function isSolvable(grid) {
    let parity = 0;
    const gridWidth = Math.sqrt(grid.length);
    let row = 0;
    let blankRow = 0;

    for (let i = 0; i < grid.length; i++) {
        if (i % gridWidth == 0) {
            row += 1;
        }
        if (grid[i] == 0) {
            blankRow = row;
            continue;
        }
        for (let j = i + 1; j < grid.length; j++) {
            if (grid[i] > grid[j] && grid[j] != 0) {
                parity += 1;
            }
        }
    }

    if (gridWidth % 2 == 0) {
        if (blankRow % 2 == 0) {
            return parity % 2 == 0;
        } else {
            return parity % 2 != 0;
        }
    } else {
        return parity % 2 == 0;
    }
}

// Generates a tiles permutation that is solvable
function generateSolvableTiles() {
    const tiles = Array.from({ length: 16 }, (_, i) => i); // 0 is considered as the empty 
    let shuffled;

    // Shuffle the array until it is solvable
    do {
        shuffled = [...tiles].sort(() => Math.random() - 0.5);
    } while (!isSolvable(shuffled));
    return reverseGrid(shuffled);
}

// Create the tile grid
function setupTiles() {
    const nums = generateSolvableTiles();
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = y * gridSize + x;
            const n = nums[index];
            if (n === 0) {
                tiles.push(null);
                emptyPos = { x, y };
                continue;
            }
            const tile = createTile(n, x, y);
            tiles.push(tile);
        }
    }
}

// Checks that the clicked tile is adjacent (next) to the empty position
function isAdjacent(tile) {
    const dx = Math.abs(tile.userData.x - emptyPos.x);
    const dy = Math.abs(tile.userData.y - emptyPos.y);
    
    return (dx + dy === 1);
}

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// For the sliding animation
const tweenGroup = new Group();

function moveTile(tile) {
    const { x, y } = tile.userData;

    const emptyIndex = tiles.indexOf(null);
    const movedTileIndex = tiles.indexOf(tile);
    tiles[movedTileIndex] = null;
    tiles[emptyIndex] = tile;

    const targetPosition = {
        x: emptyPos.x * tileSize,
        y: 0,
        z: -emptyPos.y * tileSize
    }
    const moveTileIween = new Tween(tile.position)
        .to(targetPosition, 500)
        .easing(Easing.Quadratic.Out);
    moveTileIween.start();
    tweenGroup.add(moveTileIween);
    playHitSound();
    tile.userData.x = emptyPos.x;
    tile.userData.y = emptyPos.y;
    emptyPos = { x, y };
    if (checkFinished()) {
        alert('Congratulations, you have completed the puzzle');
    }
}

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Handles the user click
function onClick(event) {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tiles.filter((tile) => tile !== null));
    if (intersects.length > 0) {
        const tile = intersects[0].object;
        if (isAdjacent(tile)) {
            moveTile(tile);
        }
    }
}

window.addEventListener('click', onClick);

// Check if the puzzle was solved
const finishedNums = [13, 14, 15, null, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4];
function checkFinished() {
    for (let i = 0; i < 16; i++) {
        if (!tiles[i]) {
            if (finishedNums[i] !== null) return false;
        } else {
            if (tiles[i].userData.num !== finishedNums[i]) return false;
        }
    } 
    return true;
}

/**
 * Lights
 */
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

setupTiles();

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

function animate() {
    controls.update();
    tweenGroup.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

