import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import asphalt from "/asphalt.jpg";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.setClearAlpha(0);
const bg_color = "#000";
let position = 0;
let isAnimating = true;

// renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById("app").appendChild(renderer.domElement);
renderer.domElement.id = `car-canvas`;
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);
camera.position.set(1, 10, 2.5);

const scene = new THREE.Scene();

const assetLoader = new GLTFLoader();

let car;
let mixer;
let action;
assetLoader.load("../models/car/scene.gltf", (gltf) => {
  car = gltf.scene;
  scene.add(car);
  mixer = new THREE.AnimationMixer(car);
  const clips = gltf.animations;
  const clip = THREE.AnimationClip.findByName(clips, "Animation");
  action = mixer.clipAction(clip);
  handleLoad();

  car.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });

  const carbon = car.getObjectByName("Object_92");
  carbon.material.metalness = 0.5;
  carbon.material.roughness = 0.2;
  carbon.castShadow = true;
});

scene.fog = new THREE.Fog(bg_color, 0.01, 10);

const textureLoader = new THREE.TextureLoader();
textureLoader.load(asphalt, (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.x = 5;
  tex.repeat.y = 5;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ map: tex })
  );
  ground.traverse((child) => {
    if (child.isMesh) {
      child.receiveShadow = true;
    }
  });
  ground.receiveShadow = true;
  ground.rotation.x = -Math.PI * 0.5;
  scene.add(ground);
});

const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambLight);

const dLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dLight1.position.set(5, 5, 5);
const dLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
dLight2.position.set(-5, -5, -5);
dLight2.castShadow = true;
scene.add(dLight1, dLight2);

const clock = new THREE.Clock();
const animate = () => {
  if (mixer) mixer.update(clock.getDelta());
  renderer.render(scene, camera);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  requestAnimationFrame(animate);
};
animate();

addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

function handleLoad() {
  document.querySelector(".loading").style.display = "none";
  handleText();
  moveCamera(2, 1.5, 2.5, 2, 0.5);
}

addEventListener("wheel", function (event) {
  if (isAnimating) return;

  let prevPosition = position;

  if (event.deltaY < 0 && position > 0) {
    position -= 1;
    isAnimating = true;
  } else if (event.deltaY > 0 && position < 3) {
    position += 1;
    isAnimating = true;
  }

  if (prevPosition !== position) {
    switch (position) {
      case 0:
        moveCamera(2, 1.5, 2.5, 2, 0);
        break;
      case 1:
        moveCamera(0, 1, 5, 2, 0);
        if (prevPosition === 2) closeDoors();
        break;
      case 2:
        moveCamera(-2, 1.2, -2.3, 2, 0);
        openDoors();
        break;
      case 3:
        moveCamera(3, 2, 2, 2, 0);
        closeDoors();
        break;
      default:
        break;
    }
  }
});

function moveCamera(x, y, z, duration, delay) {
  gsap.to(camera.position, {
    x,
    y,
    z,
    duration,
    delay,
    onComplete: () => {
      isAnimating = false;
    },
  });
}

function openDoors() {
  action.reset();
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  action.timeScale = 2;
  action.play();
}

function closeDoors() {
  action.reset();
  action.play();
  action.loop = true;
  action.repetitions = 1;
  action.timeScale = -2;
}

function handleText() {
  gsap.from(".headline", {
    opacity: 0,
    duration: 1,
    delay: 1.5,
    y: 50,
  });
}
