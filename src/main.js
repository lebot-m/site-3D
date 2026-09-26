import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// 1. Initialisation du canvas et du renderer
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a24); // Fond sombre élégant

// 2. Configuration des dimensions
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// 3. Caméra Perspective
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
scene.add(camera);

// 4. Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfffaed, 2.5);
directionalLight.position.set(20, 40, 20);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 5. Renderer WebGL
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;




// 6.0. Activer le mappage de ton professionnel (pour éviter les blancs brûlés)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.05; // Baisse cette valeur si c'est encore trop lumineux (ex: 0.4)
// 6.1. Chargement du modèle GLTF/GLB
const loader = new GLTFLoader();
loader.load(
  '../public/models/rue.glb',
  (gltf) => {
    const model = gltf.scene;

    model.traverse((child) => {
    // Si c'est une lumière importée de Blender, on divise son intensité
    if (child.isLight) {
      child.intensity *= 0.05; // Réduit l'intensité à 10% de sa valeur Blender
    }
  });

    scene.add(model);
    console.log("Modèle 3D chargé avec succès !");
  },
  (progress) => {
    console.log(`Chargement : ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
  },
  (error) => {
    console.error("Erreur de chargement du modèle 3D :", error);
  }
);

// 7. Redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

// 8. Boucle d'animation (Render Loop)
function tick() {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

const waypoints = {
  contact: {
    position: { x: 0.3378, y: 0.41662, z: 0.7 },    // Vue aérienne haute
    target: { x: 0.3378, y: 0.47018, z: 3}          // Regarde le centre de la tour
  },
  about: {
    position: { x: 0.763295, y: 0.528372, z:  -3.08908},     // Proche du pan de mur contact
    target: { x: -0.720554, y: 0.528372, z: -3.08908 }          // Fixe le mur
  },
  spare1: {
    position: { x: -0.200034, y: 0.957552, z: 0.371407},  // Autre section
    target: { x: -0.394436, y: 0.835748, z: -1.1409 }
  },
  spare2: {
    position: { x: 1.60868, y: 0.533596, z: 0.243699 },  // Autre section
    target: { x: -0.428054, y: 0.533596, z: 0.40626}
  },
  spare3: {
    position: { x: -0.029855, y: 2.92096, z: -2.55577 },  // Autre section
    target: { x: -0.29855, y: 1.16574, z: -2.55577 }
  },
  home: {
    position: { x: 0.177947, y: 2.92283, z: -0.133523 },  // Autre section
    target: { x: 0.077947, y: 0.098028, z: -0.133523 }
  }
};

// Position initiale de la caméra (Home)
camera.position.set(waypoints.home.position.x, waypoints.home.position.y, waypoints.home.position.z);
let currentTarget = { ...waypoints.home.target };
camera.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);

let currentSection = 'home';
let isAnimating = false;

// Fonction de Traveling avec GSAP
function goToSection(targetSection) {
  if (currentSection === targetSection || isAnimating) return;
  
  const dest = waypoints[targetSection];
  if (!dest) return;
  
  isAnimating = true;

  // Animation de la position de la caméra
  gsap.to(camera.position, {
    x: dest.position.x,
    y: dest.position.y,
    z: dest.position.z,
    duration: 2.5,
    ease: "power3.inOut"
  });

  // Animation de la cible de regard
  gsap.to(currentTarget, {
    x: dest.target.x,
    y: dest.target.y,
    z: dest.target.z,
    duration: 2.5,
    ease: "power3.inOut",
    onUpdate: () => {
      camera.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);
    },
    onComplete: () => {
      currentSection = targetSection;
      isAnimating = false;
      showUIContent(targetSection);
    }
  });
}


// Gestion de l'affichage de l'UI HTML
function showUIContent(sectionName) {
  document.querySelectorAll('.ui-section').forEach(sec => sec.classList.remove('active'));
  const activeSec = document.getElementById(`ui-${sectionName}`);
  if (activeSec) activeSec.classList.add('active');
}

// Écouteurs sur les boutons de navigation
document.querySelectorAll('.nav-btn').forEach(button => {
  button.addEventListener('click', (e) => {
    const targetSection = e.target.getAttribute('data-section');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Masquer temporairement l'UI pendant le traveling
    document.querySelectorAll('.ui-section').forEach(sec => sec.classList.remove('active'));
    
    goToSection(targetSection);
  });
});
