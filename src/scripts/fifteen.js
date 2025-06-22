import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const canvas = document.getElementById('webgl');
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 8, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const tileSize = 1;
const gridSize = 4;
let emptyPos = { x: 3, y: 3 };
const tiles = [];

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

function createTile(num, x, y) {
    const geometry = new THREE.BoxGeometry(1, 0.2, 1);
    const material = new THREE.MeshBasicMaterial({ map:  createNumberTexture(num), wireframe: true });
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(x * tileSize, 0, -y * tileSize);
    tile.userData = { num, x, y };
    scene.add(tile);
    return tile;
}

function setupTiles() {
    const nums = [...Array(15).keys()].map(n => n + 1);
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = y * gridSize + x;
            if (index < 15) {
                const n = nums[index];
                const tile = createTile(n, x, y);
                tiles.push(tile);
            }
        }
    }
}

function isAdjacent(tile) {
    const dx = Math.abs(tile.userData.x - emptyPos.x);
    const dy = Math.abs(tile.userData.y - emptyPos.y);

    return (dx + dy === 1);
}

function moveTile(tile) {
    const { x, y } = tile.userData;

    tile.position.set(emptyPos.x * tileSize, 0, -emptyPos.y * tileSize);
    tile.userData.x = emptyPos.x;
    tile.userData.y = emptyPos.y;
    emptyPos = { x, y };
}

function onClick(event) {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tiles);
    if (intersects.length > 0) {
        const tile = intersects[0].object;
        if (isAdjacent(tile)) {
            moveTile(tile);
        }
    }
}

window.addEventListener('click', onClick);
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

setupTiles();

function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

