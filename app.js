import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";

const mapWidthInput = document.getElementById("mapWidth");
const mapDepthInput = document.getElementById("mapDepth");
const wallHeightInput = document.getElementById("wallHeight");
const mapWidthValue = document.getElementById("mapWidthValue");
const mapDepthValue = document.getElementById("mapDepthValue");
const wallHeightValue = document.getElementById("wallHeightValue");
const newPlanButton = document.getElementById("newPlan");
const clearPlanButton = document.getElementById("clearPlan");
const grid = document.getElementById("grid");
const sceneContainer = document.getElementById("sceneContainer");

const state = {
  width: Number(mapWidthInput.value),
  depth: Number(mapDepthInput.value),
  wallHeight: Number(wallHeightInput.value),
  walls: []
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
sceneContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f2f7ff");

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
camera.position.set(12, 14, 12);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8ca8d8, 1.1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 16, 8);
scene.add(dirLight);

const floorMaterial = new THREE.MeshStandardMaterial({ color: "#c7d9f8" });
const wallMaterial = new THREE.MeshStandardMaterial({ color: "#396fcb" });

const planGroup = new THREE.Group();
scene.add(planGroup);

function ensureWallGrid() {
  state.walls = Array.from({ length: state.depth }, (_, z) =>
    Array.from({ length: state.width }, (_, x) => state.walls[z]?.[x] ?? false)
  );
}

function renderGrid() {
  mapWidthValue.textContent = state.width;
  mapDepthValue.textContent = state.depth;
  wallHeightValue.textContent = state.wallHeight;

  grid.style.gridTemplateColumns = `repeat(${state.width}, 1fr)`;
  grid.innerHTML = "";

  for (let z = 0; z < state.depth; z += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const cell = document.createElement("button");
      cell.className = `cell${state.walls[z][x] ? " wall" : ""}`;
      cell.type = "button";
      cell.setAttribute("aria-label", `Cell ${x + 1}, ${z + 1}`);
      cell.addEventListener("click", () => {
        state.walls[z][x] = !state.walls[z][x];
        cell.classList.toggle("wall", state.walls[z][x]);
        rebuild3D();
      });
      grid.appendChild(cell);
    }
  }
}

function clearGroup(group) {
  while (group.children.length) {
    const obj = group.children.pop();
    obj.geometry?.dispose?.();
    obj.material?.dispose?.();
  }
}

function rebuild3D() {
  clearGroup(planGroup);

  const floorGeometry = new THREE.BoxGeometry(state.width, 0.2, state.depth);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial.clone());
  floor.position.y = -0.1;
  planGroup.add(floor);

  const wallGeometry = new THREE.BoxGeometry(1, state.wallHeight, 1);

  for (let z = 0; z < state.depth; z += 1) {
    for (let x = 0; x < state.width; x += 1) {
      if (!state.walls[z][x]) continue;

      const wallBlock = new THREE.Mesh(wallGeometry, wallMaterial.clone());
      wallBlock.position.set(
        x - state.width / 2 + 0.5,
        state.wallHeight / 2,
        z - state.depth / 2 + 0.5
      );
      planGroup.add(wallBlock);
    }
  }

  controls.target.set(0, state.wallHeight / 3, 0);
  controls.update();
}

function resizeRenderer() {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function resetPlan() {
  ensureWallGrid();
  renderGrid();
  rebuild3D();
}

mapWidthInput.addEventListener("input", () => {
  state.width = Number(mapWidthInput.value);
  resetPlan();
});

mapDepthInput.addEventListener("input", () => {
  state.depth = Number(mapDepthInput.value);
  resetPlan();
});

wallHeightInput.addEventListener("input", () => {
  state.wallHeight = Number(wallHeightInput.value);
  wallHeightValue.textContent = state.wallHeight;
  rebuild3D();
});

newPlanButton.addEventListener("click", () => {
  ensureWallGrid();
  for (let z = 0; z < state.depth; z += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const border = z === 0 || x === 0 || z === state.depth - 1 || x === state.width - 1;
      state.walls[z][x] = border;
    }
  }
  renderGrid();
  rebuild3D();
});

clearPlanButton.addEventListener("click", () => {
  ensureWallGrid();
  for (let z = 0; z < state.depth; z += 1) {
    for (let x = 0; x < state.width; x += 1) {
      state.walls[z][x] = false;
    }
  }
  renderGrid();
  rebuild3D();
});

window.addEventListener("resize", resizeRenderer);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

ensureWallGrid();
resetPlan();
resizeRenderer();
animate();
