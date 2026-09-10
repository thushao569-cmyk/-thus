import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PuppetData, JointKinematics, ActiveJoints } from '../types';
import { Compass, RotateCw, Eye, Music, Volume2 } from 'lucide-react';

export interface Nutcracker3DSceneProps {
  puppets: PuppetData[];
  selectedPuppetId: string;
  onSelectPuppet: (puppetId: string) => void;
  puppetKinematics: Record<string, JointKinematics>;
  puppetActiveJoints: Record<string, ActiveJoints>;
  isPlaying: boolean;
  onManualTrigger?: (joint: 'leftArm' | 'body' | 'rightArm' | 'leftLeg' | 'rightLeg') => void;
}

interface PuppetJointNodes {
  puppet: PuppetData;
  turntable: THREE.Group;
  nutcrackerRoot: THREE.Group;
  torsoHead: THREE.Group;
  headGroup: THREE.Group;
  jaw: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  windingKey: THREE.Group;
  instrumentGroup?: THREE.Group;
  valves?: THREE.Mesh[];
  keys?: THREE.Mesh[];
  strings?: THREE.Mesh[];
  acousticFlash?: THREE.Mesh;
  tutuGroup?: THREE.Group;
  capeMesh?: THREE.Mesh;
  starWandMesh?: THREE.Mesh;
  selectionRing: THREE.Mesh;
  haloGlow?: THREE.Mesh;
  spotlight?: THREE.SpotLight;
}

export const Nutcracker3DScene: React.FC<Nutcracker3DSceneProps> = ({
  puppets,
  selectedPuppetId,
  onSelectPuppet,
  puppetKinematics,
  puppetActiveJoints,
  isPlaying,
  onManualTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // References to 3D animated joints mapped per puppet ID
  const puppetNodesRef = useRef<Map<string, PuppetJointNodes>>(new Map());
  const combTeethRef = useRef<THREE.Mesh[]>([]);
  const musicCylinderRef = useRef<THREE.Mesh | null>(null);

  // Keep references to latest props for 60fps render loop
  const stateRef = useRef({
    puppets,
    selectedPuppetId,
    puppetKinematics,
    puppetActiveJoints,
    isPlaying,
  });

  const onSelectPuppetRef = useRef(onSelectPuppet);
  onSelectPuppetRef.current = onSelectPuppet;

  useEffect(() => {
    stateRef.current = {
      puppets,
      selectedPuppetId,
      puppetKinematics,
      puppetActiveJoints,
      isPlaying,
    };
  }, [puppets, selectedPuppetId, puppetKinematics, puppetActiveJoints, isPlaying]);

  const [activeCamPreset, setActiveCamPreset] = useState<'perspective' | 'front' | 'side' | 'top'>('perspective');

  const puppetsConfigKey = puppets.map(p => `${p.id}:${p.instrument}:${p.outfit || ''}:${p.isBlackNutcracker ? '1' : '0'}:${p.themeColor || ''}`).join('|');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null;

    // 2. Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 14.5);
    camera.lookAt(0, 2.0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 4.0;
    controls.maxDistance = 28;
    controls.target.set(0, 2.0, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xFFF9F0, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFF4E0, 1.4);
    keyLight.position.set(5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xE0ECFF, 0.65);
    rimLight.position.set(-6, 7, -6);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xF5A623, 0.5, 12);
    warmFill.position.set(0, 1.8, 3.2);
    scene.add(warmFill);

    // 6. Base Stage: Music Box Pedestal (Stage diameter enlarged to 2x original: radius 3.5->7.0)
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    // Shared Materials
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x382414, roughness: 0.68, metalness: 0.06 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.88, roughness: 0.22 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xC59B27, metalness: 0.85, roughness: 0.28 });
    const blackLacquerMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.22, metalness: 0.35 });
    const birchFaceMat = new THREE.MeshStandardMaterial({ color: 0xF5D4B3, roughness: 0.6, metalness: 0.02 });
    const whiteClothMat = new THREE.MeshStandardMaterial({ color: 0xF2ECE1, roughness: 0.55, metalness: 0.05 });
    const steelBladeMat = new THREE.MeshStandardMaterial({ color: 0xDCE2E8, metalness: 0.92, roughness: 0.12 });
    const ebonyWoodMat = new THREE.MeshStandardMaterial({ color: 0x221B17, roughness: 0.38, metalness: 0.12 });
    const silverKeyMat = new THREE.MeshStandardMaterial({ color: 0xE8ECF0, metalness: 0.95, roughness: 0.12 });

    // Wide Stage Plinth (Diameter doubled from 7.0 to 14.0: radiusTop 3.5 -> 7.0, radiusBottom 3.7 -> 7.4)
    const plinthGeo = new THREE.CylinderGeometry(7.0, 7.4, 0.35, 64);
    const plinthMesh = new THREE.Mesh(plinthGeo, darkWoodMat);
    plinthMesh.position.y = 0.175;
    plinthMesh.receiveShadow = true;
    baseGroup.add(plinthMesh);

    // Brass inlay trim ring around plinth (radius doubled from 3.55 to 7.1)
    const brassTrimGeo = new THREE.TorusGeometry(7.1, 0.045, 16, 96);
    brassTrimGeo.rotateX(Math.PI / 2);
    const brassTrimMesh = new THREE.Mesh(brassTrimGeo, goldMat);
    brassTrimMesh.position.y = 0.18;
    baseGroup.add(brassTrimMesh);

    // Brass corner feet around the 2x enlarged stage perimeter
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const footGeo = new THREE.SphereGeometry(0.18, 16, 12);
      footGeo.scale(1, 0.7, 1.4);
      const footMesh = new THREE.Mesh(footGeo, goldMat);
      footMesh.position.set(Math.cos(angle) * 7.04, 0.08, Math.sin(angle) * 7.04);
      footMesh.rotation.y = -angle;
      footMesh.castShadow = true;
      baseGroup.add(footMesh);
    }

    // Music Box Mechanical Core on front of pedestal
    const cylinderGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.4, 24);
    cylinderGeo.rotateZ(Math.PI / 2);
    const cylinderMesh = new THREE.Mesh(cylinderGeo, brassMat);
    cylinderMesh.position.set(0, 0.52, 3.2);
    cylinderMesh.castShadow = true;
    baseGroup.add(cylinderMesh);
    musicCylinderRef.current = cylinderMesh;

    // Small golden pins on the music cylinder
    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.09, 8);
    pinGeo.rotateX(Math.PI / 2);
    for (let p = 0; p < 36; p++) {
      const pAngle = (p * 1.3) % (Math.PI * 2);
      const pX = -1.0 + ((p * 0.25) % 2.0);
      const pin = new THREE.Mesh(pinGeo, goldMat);
      pin.position.set(pX, 0.52 + Math.sin(pAngle) * 0.38, 3.2 + Math.cos(pAngle) * 0.38);
      cylinderMesh.add(pin);
    }

    // Steel tuned comb teeth (八音簧齿)
    const combTeeth: THREE.Mesh[] = [];
    for (let t = 0; t < 16; t++) {
      const toothGeo = new THREE.BoxGeometry(0.05, 0.015, 0.32);
      const tooth = new THREE.Mesh(toothGeo, steelBladeMat);
      tooth.position.set(-0.75 + t * 0.1, 0.65, 2.95);
      tooth.castShadow = true;
      baseGroup.add(tooth);
      combTeeth.push(tooth);
    }
    combTeethRef.current = combTeeth;

    // 7. BUILD EACH NUTCRACKER PUPPET ON THE STAGE
    const newPuppetNodes = new Map<string, PuppetJointNodes>();

    const getPuppetPosition = (idx: number, total: number): { x: number; z: number } => {
      if (total === 1) return { x: 0, z: 0 };
      if (total === 2) {
        return idx === 0 ? { x: -2.4, z: 0.2 } : { x: 2.4, z: 0.2 };
      }
      if (total === 3) {
        if (idx === 0) return { x: -2.8, z: 0.4 };
        if (idx === 1) return { x: 2.8, z: 0.4 };
        return { x: 0, z: -1.6 };
      }
      if (total === 4) {
        const positions = [
          { x: -2.5, z: 1.0 },
          { x: 2.5, z: 1.0 },
          { x: -1.8, z: -1.6 },
          { x: 1.8, z: -1.6 },
        ];
        return positions[idx] || { x: 0, z: 0 };
      }
      if (total === 5) {
        // Grand Ballet Nutcracker 5-character theatrical arrangement:
        // Downstage center-front: Ballerina Princess & Ballerina Prince close to audience
        // Upstage center: Grand Tuxedo Maestro
        // Left Wing: Red Commander
        // Right Wing: Blue Drummer
        const stageLayout = [
          { x: 0, z: -1.8 },    // 0: 黑色燕尾服绅士 (Center Upstage)
          { x: -1.85, z: 1.15 }, // 1: 糖果芭蕾公主 (Downstage Front-Left)
          { x: 1.85, z: 1.15 },  // 2: 胡桃夹子王子 (Downstage Front-Right)
          { x: -3.85, z: -0.35 },// 3: 皇家红袍卫兵 (Stage Left)
          { x: 3.85, z: -0.35 }, // 4: 军乐队鼓手 (Stage Right)
        ];
        return stageLayout[idx] || { x: 0, z: 0 };
      }
      // General layout for >= 6
      const angle = (idx * Math.PI * 2) / total;
      return { x: Math.sin(angle) * 3.6, z: Math.cos(angle) * 2.2 };
    };

    stateRef.current.puppets.forEach((puppet, idx) => {
      const pos = getPuppetPosition(idx, stateRef.current.puppets.length);

      // Turntable Group for this puppet
      const turntableGroup = new THREE.Group();
      turntableGroup.position.set(pos.x, 0.35, pos.z);
      baseGroup.add(turntableGroup);

      // Turntable disc (Puppet individual control disc diameter shrunk to 1/2 of original: radiusTop 1.25 * 0.5 = 0.625, radiusBottom 1.3 * 0.5 = 0.65)
      const discGeo = new THREE.CylinderGeometry(0.625, 0.65, 0.08, 40);
      const discMesh = new THREE.Mesh(discGeo, brassMat);
      discMesh.position.y = 0.04;
      discMesh.receiveShadow = true;
      discMesh.castShadow = true;
      turntableGroup.add(discMesh);

      // Concentric rings (radius shrunk to 1/2 of original: 0.95 * 0.5 = 0.475)
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.475, 0.012, 12, 36).rotateX(Math.PI / 2), goldMat);
      ring1.position.y = 0.082;
      turntableGroup.add(ring1);

      // Selection Halo Ring around the base (radius shrunk to 1/2 of original: 1.32 * 0.5 = 0.66)
      const selRingGeo = new THREE.TorusGeometry(0.66, 0.025, 16, 48);
      selRingGeo.rotateX(Math.PI / 2);
      const ringHex = puppet.themeColor ? parseInt(puppet.themeColor.replace('#', '0x'), 16) : (puppet.instrument === 'drum' ? 0x2563EB : 0xDC2626);
      const selRingMat = new THREE.MeshStandardMaterial({
        color: ringHex,
        emissive: ringHex,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.2,
      });
      const selectionRing = new THREE.Mesh(selRingGeo, selRingMat);
      selectionRing.position.y = 0.06;
      turntableGroup.add(selectionRing);

      // Spotlight for selected puppet
      const spot = new THREE.SpotLight(0xFFFBEB, 0.85, 22, Math.PI / 6, 0.4);
      spot.position.set(pos.x, 8, pos.z + 3);
      spot.target = turntableGroup;
      scene.add(spot);

      // Build 3D Nutcracker character figure
      const figure = createNutcrackerCharacter(puppet, {
        goldMat,
        blackLacquerMat,
        birchFaceMat,
        whiteClothMat,
        steelBladeMat,
        darkWoodMat,
        ebonyWoodMat,
        silverKeyMat,
      });

      figure.nutcrackerRoot.position.set(0, 0.08, 0);
      turntableGroup.add(figure.nutcrackerRoot);

      // Tag all meshes with puppetId for raycasting click selection
      turntableGroup.traverse((obj) => {
        obj.userData = { puppetId: puppet.id };
      });

      newPuppetNodes.set(puppet.id, {
        puppet,
        turntable: turntableGroup,
        nutcrackerRoot: figure.nutcrackerRoot,
        torsoHead: figure.torsoHead,
        headGroup: figure.headGroup,
        jaw: figure.jaw,
        leftArm: figure.leftArm,
        rightArm: figure.rightArm,
        leftLeg: figure.leftLeg,
        rightLeg: figure.rightLeg,
        windingKey: figure.windingKey,
        instrumentGroup: figure.instrumentGroup,
        valves: figure.valves,
        keys: figure.keys,
        strings: figure.strings,
        acousticFlash: figure.acousticFlash,
        tutuGroup: figure.tutuGroup,
        capeMesh: figure.capeMesh,
        starWandMesh: figure.starWandMesh,
        selectionRing,
        spotlight: spot,
      });
    });

    puppetNodesRef.current = newPuppetNodes;

    // 8. RAYCAST CLICK LISTENER FOR SELECTING PUPPETS DIRECTLY IN 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: MouseEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: MouseEvent) => {
      // Check if it was a click (not a drag)
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 8) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur) {
          if (cur.userData && cur.userData.puppetId) {
            onSelectPuppetRef.current(cur.userData.puppetId);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 9. ANIMATION LOOP
    let lastTime = performance.now();
    let time = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      time += delta * 60;

      const { puppets: currPuppets, selectedPuppetId: selId, puppetKinematics: kMap, puppetActiveJoints: aMap, isPlaying: playing } = stateRef.current;

      // Rotate music box cylinder when playing
      if (musicCylinderRef.current && playing) {
        musicCylinderRef.current.rotation.x += delta * 2.8;
      }

      // Update each puppet's joints independently!
      currPuppets.forEach((puppet) => {
        const nodes = puppetNodesRef.current.get(puppet.id);
        if (!nodes) return;

        const k = kMap[puppet.id];
        const a = aMap[puppet.id] || { leftArm: false, body: false, rightArm: false, leftLeg: false, rightLeg: false };

        const isFiveChord = Boolean(k?.isFiveChord ?? (a.leftArm && a.body && a.rightArm && a.leftLeg && a.rightLeg));
        const leftArmAngle = k ? k.leftArmAngle : (a.leftArm ? -45 : 0);
        const bodyElevate = k ? k.bodyElevate : (a.body ? -20 : 0);
        const bodyTilt = k ? k.bodyTilt : 0;
        let rightArmAngle = k ? k.rightArmAngle : (a.rightArm ? 45 : 0);
        const leftLegAngle = k ? (k.leftLegAngle ?? 0) : (a.leftLeg ? -25 : 0);
        const rightLegAngle = k ? (k.rightLegAngle ?? 0) : (a.rightLeg ? -25 : 0);
        const spinAngle = k?.spinAngle ?? 0;

        if (!k && isFiveChord) {
          rightArmAngle = -120;
        }

        const isSelected = puppet.id === selId;

        // Selection ring and spotlight
        if (nodes.selectionRing) {
          const mat = nodes.selectionRing.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            mat.emissiveIntensity = 1.0 + Math.sin(time * 0.08) * 0.35;
            nodes.selectionRing.scale.set(1.03, 1.03, 1.03);
          } else {
            mat.emissiveIntensity = 0.2;
            nodes.selectionRing.scale.set(1, 1, 1);
          }
        }
        if (nodes.spotlight) {
          nodes.spotlight.intensity = isSelected ? 1.2 : 0.4;
        }

        // 1. Turntable Rotation (360° spin on five chord or gentle ambient)
        const spinRad = THREE.MathUtils.degToRad(spinAngle);
        nodes.turntable.rotation.y = spinRad;

        // 2. Torso Elevation & Tilt
        const elevateMeters = (bodyElevate / 20) * 0.22;
        nodes.torsoHead.position.y = 1.22 + elevateMeters;
        nodes.torsoHead.rotation.z = THREE.MathUtils.degToRad(bodyTilt);

        // 3. Lower Jaw biting & embouchure
        const jawDrop = Math.max(0, -elevateMeters * 0.9);
        nodes.jaw.position.y = 0.19 - jawDrop;

        // 4. Back Winding Key
        if (playing) {
          nodes.windingKey.rotation.z += delta * 4.2;
        }

        // 5. Left & Right Leg Movements
        const leftLegAngleVal = k ? (k.leftLegAngle ?? 0) : (a.leftLeg ? -25 : 0);
        const rightLegAngleVal = k ? (k.rightLegAngle ?? 0) : (a.rightLeg ? -25 : 0);
        nodes.leftLeg.rotation.x = THREE.MathUtils.degToRad(leftLegAngleVal);
        nodes.rightLeg.rotation.x = THREE.MathUtils.degToRad(rightLegAngleVal);

        // 6. INSTRUMENT-SPECIFIC PLAYING ANIMATIONS & POSING
        const isHit = Boolean(a.leftArm || a.body || a.rightArm || a.leftLeg || a.rightLeg);
        const inst = puppet.instrument;

        if (inst === 'trumpet') {
          // --- 吹奏小号 (Trumpet Playing) ---
          // Both arms held up to hold trumpet and press valves
          const tValve0 = Boolean(a.leftArm || (playing && Math.sin(time * 0.35) > 0.1));
          const tValve1 = Boolean(a.body || a.rightArm || (playing && Math.sin(time * 0.35 + 1.8) > 0.1));
          const tValve2 = Boolean(a.leftLeg || a.rightLeg || (playing && Math.sin(time * 0.35 + 3.4) > 0.1));

          if (nodes.valves && nodes.valves.length >= 3) {
            nodes.valves[0].position.y = 0.04 - (tValve0 ? 0.04 : 0);
            nodes.valves[1].position.y = 0.04 - (tValve1 ? 0.04 : 0);
            nodes.valves[2].position.y = 0.04 - (tValve2 ? 0.04 : 0);
          }

          // Left hand firmly supports underside of valve block
          nodes.leftArm.rotation.set(-1.18, 0.16, -0.48);
          // Right hand fingers resting on valve tops, tapping
          const fingerTap = (tValve0 || tValve1 || tValve2) ? 0.06 : 0;
          nodes.rightArm.rotation.set(-1.22 - fingerTap, -0.14, 0.48);

          // Trumpet bell angle proud lift & rhythmic sway
          if (nodes.instrumentGroup) {
            const bellLift = isHit ? -0.26 : -0.16;
            const bellSway = playing ? Math.sin(time * 0.12) * 0.03 : 0;
            nodes.instrumentGroup.rotation.x = bellLift + bellSway;
            nodes.instrumentGroup.rotation.y = playing ? Math.cos(time * 0.09) * 0.025 : 0;
          }

          // Head nodding along with playing rhythm
          nodes.headGroup.rotation.x = playing ? Math.sin(time * 0.1) * 0.05 : 0;
          nodes.headGroup.rotation.z = playing ? Math.cos(time * 0.08) * 0.03 : 0;

          // Mouth embouchure puff
          nodes.jaw.position.y = 0.19 - (isHit ? 0.04 : (playing ? 0.02 : 0));

          // Bell acoustic flash
          if (nodes.acousticFlash) {
            const mat = nodes.acousticFlash.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = isHit ? 1.8 : 0.25;
            nodes.acousticFlash.scale.setScalar(isHit ? 1.35 : 1.0);
          }
        }
        else if (inst === 'tuba') {
          // --- 吹奏大号 (Tuba Playing) ---
          // Bass sway
          const bassSway = playing ? Math.sin(time * 0.1) * 0.06 : 0;
          nodes.torsoHead.rotation.z = THREE.MathUtils.degToRad(bodyTilt) + bassSway;
          nodes.torsoHead.position.y = 1.22 + elevateMeters + (playing ? Math.abs(Math.sin(time * 0.12)) * 0.03 : 0);

          // Left arm cradles the heavy brass coils
          nodes.leftArm.rotation.set(-0.85, 0.32, -0.52);

          // 4 valve pistons pumping
          if (nodes.valves) {
            nodes.valves.forEach((vMesh, vIdx) => {
              const vActive = isHit || (playing && Math.sin(time * 0.3 + vIdx * 1.3) > 0.15);
              vMesh.position.y = (0.88 - vIdx * 0.06) - (vActive ? 0.04 : 0);
            });
          }

          // Right arm pumping valves on front of tuba
          const vPump = playing ? Math.sin(time * 0.25) * 0.05 : 0;
          nodes.rightArm.rotation.set(-0.95 + vPump, -0.18, 0.42);

          // Embouchure deep puff
          nodes.jaw.position.y = 0.19 - (isHit ? 0.05 : (playing ? 0.025 : 0));

          // Upward bell acoustic flash
          if (nodes.acousticFlash) {
            const mat = nodes.acousticFlash.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = isHit ? 1.6 : 0.25;
            nodes.acousticFlash.scale.setScalar(isHit ? 1.3 : 1.0);
          }
        }
        else if (inst === 'clarinet') {
          // --- 吹奏单簧管 (Clarinet Playing) ---
          // Both arms held at mouth height holding clarinet body
          nodes.leftArm.rotation.set(-0.88, 0.16, -0.42);
          nodes.rightArm.rotation.set(-0.78, -0.14, 0.38);

          // Lyrical woodwind body sway
          if (nodes.instrumentGroup) {
            nodes.instrumentGroup.rotation.x = 0.82 + (playing ? Math.sin(time * 0.08) * 0.06 : 0);
            nodes.instrumentGroup.rotation.y = playing ? Math.sin(time * 0.06) * 0.05 : 0;
          }

          // Keys tapping along clarinet tone holes
          if (nodes.keys) {
            nodes.keys.forEach((kMesh, kIdx) => {
              const kActive = isHit || (playing && Math.sin(time * 0.4 + kIdx * 0.9) > 0.1);
              kMesh.position.z = 0.034 - (kActive ? 0.015 : 0);
            });
          }

          // Gentle head tilt & embouchure
          nodes.headGroup.rotation.x = playing ? Math.sin(time * 0.07) * 0.04 : 0;
          nodes.headGroup.rotation.z = playing ? Math.sin(time * 0.05) * 0.03 : 0;
          nodes.jaw.position.y = 0.19 - (isHit ? 0.035 : (playing ? 0.018 : 0));

          if (nodes.acousticFlash) {
            const mat = nodes.acousticFlash.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = isHit ? 1.5 : 0.25;
            nodes.acousticFlash.scale.setScalar(isHit ? 1.25 : 1.0);
          }
        }
        else if (inst === 'oboe') {
          // --- 吹奏双簧管 (Oboe Playing) ---
          // Both hands holding the slender oboe body
          nodes.leftArm.rotation.set(-0.84, 0.18, -0.44);
          nodes.rightArm.rotation.set(-0.76, -0.16, 0.40);

          // Melodic expressive phrasing
          if (nodes.instrumentGroup) {
            nodes.instrumentGroup.rotation.x = 0.76 + (playing ? Math.sin(time * 0.07) * 0.06 : 0);
            nodes.instrumentGroup.rotation.y = playing ? Math.cos(time * 0.05) * 0.05 : 0;
          }

          // 7 Silver keys tapping
          if (nodes.keys) {
            nodes.keys.forEach((kMesh, kIdx) => {
              const kActive = isHit || (playing && Math.sin(time * 0.38 + kIdx * 0.8) > 0.1);
              kMesh.position.z = 0.032 - (kActive ? 0.015 : 0);
            });
          }

          nodes.headGroup.rotation.x = playing ? Math.sin(time * 0.06) * 0.04 : 0;
          nodes.jaw.position.y = 0.19 - (isHit ? 0.035 : (playing ? 0.016 : 0));

          if (nodes.acousticFlash) {
            const mat = nodes.acousticFlash.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = isHit ? 1.5 : 0.25;
            nodes.acousticFlash.scale.setScalar(isHit ? 1.25 : 1.0);
          }
        }
        else if (inst === 'harp') {
          // --- 弹竖琴 (Harp Playing) ---
          // Body turns slightly toward harp column
          nodes.torsoHead.rotation.y = -0.22;
          nodes.torsoHead.rotation.z = THREE.MathUtils.degToRad(bodyTilt) + (playing ? Math.sin(time * 0.1) * 0.03 : 0);

          // Dynamic dual-hand plucking across the strings
          const pluckL = playing ? Math.sin(time * 0.24) * 0.18 : 0;
          const sweepL = playing ? Math.cos(time * 0.3) * 0.12 : 0;
          nodes.leftArm.rotation.set(-0.76 + pluckL, 0.35, -0.42 + sweepL);

          const pluckR = playing ? Math.sin(time * 0.24 + 1.2) * 0.18 : 0;
          const sweepR = playing ? Math.cos(time * 0.3 + 1.2) * 0.12 : 0;
          nodes.rightArm.rotation.set(-0.84 + pluckR, 0.16, 0.32 + sweepR);

          // 10 golden strings glow and shimmer when plucked
          if (nodes.strings) {
            nodes.strings.forEach((strMesh, sIdx) => {
              const strActive = isHit || (playing && Math.sin(time * 0.28 + sIdx * 0.65) > 0.2);
              const mat = strMesh.material as THREE.MeshStandardMaterial;
              mat.emissiveIntensity = strActive ? 1.8 : 0.25;
            });
          }

          nodes.headGroup.rotation.y = playing ? Math.sin(time * 0.08) * 0.08 : 0;
        }
        else if (inst === 'drum') {
          // --- 打鼓 (Drum Playing) ---
          // Left and right drumsticks alternate strikes on drumhead
          const strokeL = isHit && (a.leftArm || a.rightArm)
            ? 0.42
            : (playing ? Math.max(0, Math.sin(time * 0.42)) * 0.38 : 0);
          const strokeR = isHit && (a.body || a.leftLeg || a.rightLeg)
            ? 0.42
            : (playing ? Math.max(0, Math.sin(time * 0.42 + Math.PI)) * 0.38 : 0);

          nodes.leftArm.rotation.set(-0.72 + strokeL, 0.15, -0.22);
          nodes.rightArm.rotation.set(-0.72 + strokeR, -0.15, 0.22);

          // Percussive body bounce
          const drumBounce = isHit ? -0.04 : (playing ? Math.abs(Math.sin(time * 0.21)) * 0.025 : 0);
          nodes.torsoHead.position.y = 1.22 + elevateMeters + drumBounce;

          // Drumhead impact ripple flash
          if (nodes.acousticFlash) {
            const mat = nodes.acousticFlash.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = isHit ? 1.8 : 0.25;
            nodes.acousticFlash.scale.setScalar(isHit ? 1.3 : 1.0);
          }
        }
        else {
          // --- 八音钟琴 / 军官 (Bell / Default with sword & chime mallet) ---
          const leftRad = THREE.MathUtils.degToRad(leftArmAngle);
          nodes.leftArm.rotation.z = leftRad * 0.85;
          nodes.leftArm.rotation.x = -Math.sin(leftRad) * 0.3;

          const rightRad = THREE.MathUtils.degToRad(rightArmAngle);
          if (rightArmAngle < -60) {
            const raiseRad = THREE.MathUtils.degToRad(Math.abs(rightArmAngle) - 30);
            nodes.rightArm.rotation.z = THREE.MathUtils.degToRad(20);
            nodes.rightArm.rotation.x = -raiseRad;
          } else {
            nodes.rightArm.rotation.z = rightRad * 0.85;
            nodes.rightArm.rotation.x = -Math.sin(rightRad) * 0.4;
          }
        }

        // --- 芭蕾舞者动态表现 (Ballet Costumes & Expressive Kinematics) ---
        if (nodes.tutuGroup) {
          // Tutu 蓬蓬裙轻柔浮动
          nodes.tutuGroup.rotation.z = playing ? Math.sin(time * 0.12) * 0.03 : 0;
          nodes.tutuGroup.position.y = 0.18 + (playing ? Math.sin(time * 0.16) * 0.012 : 0);
        }

        if (nodes.capeMesh) {
          // 王子深蓝披风随音律微拂
          nodes.capeMesh.rotation.x = 0.12 + (playing ? Math.sin(time * 0.14) * 0.05 : 0);
        }

        if (puppet.outfit === 'princess' && inst === 'bell') {
          // 糖果公主挥舞仙子魔杖
          const wandWave = playing ? Math.sin(time * 0.22) * 0.25 : 0;
          nodes.rightArm.rotation.set(-0.85 + wandWave, -0.2, 0.35);
          nodes.leftArm.rotation.set(-0.6, 0.25, -0.4);
        }

        if (isFiveChord && puppet.outfit === 'princess') {
          // 五音华丽回旋时公主举手展臂 (en couronne)
          nodes.leftArm.rotation.set(-1.95, 0.25, -0.38);
          nodes.rightArm.rotation.set(-1.95, -0.25, 0.38);
        }
      });

      // Vibrating comb teeth
      if (combTeethRef.current && playing) {
        combTeethRef.current.forEach((tooth, idx) => {
          const flutter = Math.sin(time * 0.03 + idx) * 0.006;
          tooth.position.y = 0.65 + flutter;
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [puppets.length, puppetsConfigKey]);

  // Preset camera angles
  const setCameraPreset = (preset: 'perspective' | 'front' | 'side' | 'top') => {
    setActiveCamPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'perspective') {
      camera.position.set(0, 5.2, 14.5);
      controls.target.set(0, 2.0, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 3.6, 14.0);
      controls.target.set(0, 2.0, 0);
    } else if (preset === 'side') {
      camera.position.set(14.0, 4.0, 0.8);
      controls.target.set(0, 2.0, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 16.5, 4.0);
      controls.target.set(0, 1.2, 0);
    }
  };

  const selectedPuppet = puppets.find((p) => p.id === selectedPuppetId) || puppets[0];
  const selectedKinematics = puppetKinematics[selectedPuppetId];
  const selectedActive = puppetActiveJoints[selectedPuppetId] || { leftArm: false, body: false, rightArm: false, leftLeg: false, rightLeg: false };

  const isFiveChord = Boolean(
    selectedKinematics?.isFiveChord ??
      (selectedActive.leftArm && selectedActive.body && selectedActive.rightArm && selectedActive.leftLeg && selectedActive.rightLeg)
  );

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex flex-col items-center justify-center">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        id="three-canvas-container"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Puppet Switcher Chips at top of stage */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2 flex-wrap">
        {puppets.map((puppet) => {
          const isSel = puppet.id === selectedPuppetId;
          const isDrum = puppet.instrument === 'drum';

          return (
            <button
              key={puppet.id}
              onClick={() => onSelectPuppet(puppet.id)}
              className={`px-3 py-1.5 rounded-full border text-xs font-serif transition-all flex items-center gap-2 shadow-xs backdrop-blur-md cursor-pointer ${
                isSel
                  ? isDrum
                    ? 'bg-blue-950/90 text-blue-100 border-blue-400 ring-2 ring-blue-500/40'
                    : 'bg-amber-950/90 text-amber-100 border-amber-400 ring-2 ring-amber-500/40'
                  : 'bg-white/85 text-neutral-700 border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/60"
                style={{ backgroundColor: puppet.themeColor }}
              />
              <span className="font-medium tracking-wide">{puppet.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 flex items-center gap-0.5">
                {isDrum ? <Volume2 className="w-2.5 h-2.5" /> : <Music className="w-2.5 h-2.5" />}
                {isDrum ? '鼓点伴奏' : '八音钟琴'}
              </span>
              {isSel && (
                <span className="text-[10px] font-sans font-bold text-amber-400 bg-amber-950/80 px-1 rounded">
                  编辑中
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3D Interaction Hints (Bottom Left) */}
      <div className="absolute bottom-4 left-6 z-20 flex items-center gap-2 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/80 shadow-xs text-xs text-neutral-600">
        <Compass className="w-3.5 h-3.5 text-neutral-500" />
        <span className="font-serif">点击 3D 小人直接选中切换 · 按住鼠标左键可 360° 旋转观察</span>
      </div>

      {/* Camera View Angle Selector (Bottom Right) */}
      <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 bg-white/85 backdrop-blur-md p-1 rounded-xl border border-neutral-200/80 shadow-xs text-xs">
        <button
          onClick={() => setCameraPreset('perspective')}
          className={`px-2.5 py-1 rounded-lg transition-all font-serif ${
            activeCamPreset === 'perspective'
              ? 'bg-neutral-900 text-amber-100 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="默认 3/4 透视全景"
        >
          双偶透视
        </button>
        <button
          onClick={() => setCameraPreset('front')}
          className={`px-2.5 py-1 rounded-lg transition-all font-serif ${
            activeCamPreset === 'front'
              ? 'bg-neutral-900 text-amber-100 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="正对木偶礼仪姿态"
        >
          正面特写
        </button>
        <button
          onClick={() => setCameraPreset('side')}
          className={`px-2.5 py-1 rounded-lg transition-all font-serif ${
            activeCamPreset === 'side'
              ? 'bg-neutral-900 text-amber-100 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="侧面观察发条与打击联动"
        >
          侧面视角
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className={`px-2.5 py-1 rounded-lg transition-all font-serif ${
            activeCamPreset === 'top'
              ? 'bg-neutral-900 text-amber-100 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="俯瞰舞台转台圆盘"
        >
          俯瞰转台
        </button>
      </div>

      {/* Top Motion Status for selected puppet */}
      <div className="absolute top-4 right-6 flex items-center gap-2 z-20 flex-wrap justify-end">
        <div className="px-3 py-1 text-xs rounded-full border border-neutral-300 bg-white/85 backdrop-blur-md text-neutral-800 shadow-xs flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-serif font-medium">
            当前编辑: {selectedPuppet.name} ({selectedPuppet.instrument === 'drum' ? '鼓乐伴舞' : '钟鸣主舞'})
          </span>
        </div>

        {isFiveChord && (
          <div
            className="px-3 py-1 text-xs rounded-full border border-amber-500/80 bg-amber-950/90 text-amber-200 shadow-md flex items-center gap-1.5 animate-pulse"
          >
            <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span className="font-serif font-semibold tracking-wide">
              五音合奏 · 华丽回旋
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// HELPER BUILDER FUNCTION FOR 3D NUTCRACKER FIGURE
// ------------------------------------------------------------------

function createNutcrackerCharacter(
  puppet: PuppetData,
  materials: {
    goldMat: THREE.Material;
    blackLacquerMat: THREE.Material;
    birchFaceMat: THREE.Material;
    whiteClothMat: THREE.Material;
    steelBladeMat: THREE.Material;
    darkWoodMat: THREE.Material;
    ebonyWoodMat: THREE.Material;
    silverKeyMat: THREE.Material;
  }
) {
  const isPrincess = puppet.outfit === 'princess' || puppet.themeColor === '#EC4899';
  const isPrince = puppet.outfit === 'prince' || puppet.themeColor === '#2563EB';
  const isTuxedo = puppet.outfit === 'tuxedo' || puppet.isBlackNutcracker || puppet.themeColor === '#18181B';
  const isDrummer = puppet.instrument === 'drum';

  // Specialized materials for Princess Ballerina and Prince Ballerina
  const princessPinkMat = new THREE.MeshStandardMaterial({
    color: 0xF472B6,
    roughness: 0.35,
    metalness: 0.1,
  });

  const tutuTulleMat = new THREE.MeshStandardMaterial({
    color: 0xFFD1DC,
    roughness: 0.6,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
  });

  const tutuFrillMat = new THREE.MeshStandardMaterial({
    color: 0xFCE7F3,
    roughness: 0.55,
    metalness: 0.05,
    transparent: true,
    opacity: 0.94,
  });

  const princessTightsMat = new THREE.MeshStandardMaterial({
    color: 0xFFF1F2,
    roughness: 0.5,
    metalness: 0.05,
  });

  const princeBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2563EB,
    roughness: 0.35,
    metalness: 0.15,
  });

  const princeCapeMat = new THREE.MeshStandardMaterial({
    color: 0x1E3A8A,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const roseGemMat = new THREE.MeshStandardMaterial({
    color: 0xFB7185,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0xE11D48,
    emissiveIntensity: 0.45,
  });

  const sapphireGemMat = new THREE.MeshStandardMaterial({
    color: 0x3B82F6,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x1D4ED8,
    emissiveIntensity: 0.45,
  });

  const goldenHairMat = new THREE.MeshStandardMaterial({
    color: 0xDF9B35,
    roughness: 0.65,
  });

  // Body / Tunic Material
  const tunicMat = isPrincess
    ? princessPinkMat
    : isPrince
    ? princeBlueMat
    : isTuxedo
    ? new THREE.MeshStandardMaterial({
        color: 0x111114,
        roughness: 0.3,
        metalness: 0.15,
      })
    : new THREE.MeshStandardMaterial({
        color: isDrummer ? 0x1D4E89 : 0xC82320,
        roughness: 0.45,
        metalness: 0.08,
      });

  // Face, hands, and chin: identical warm birch wood tone as all other puppets
  const faceMat = materials.birchFaceMat;

  const nutcrackerRoot = new THREE.Group();

  // A. LOWER BODY (Legs & Pointe Shoes / Slippers / Boots)
  const trouserGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.65, 16);
  const legTrouserMat = isPrincess
    ? princessTightsMat
    : isPrince
    ? materials.whiteClothMat
    : isTuxedo
    ? materials.blackLacquerMat
    : materials.whiteClothMat;

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.32, 1.2, 0);
  nutcrackerRoot.add(leftLeg);

  const trouserL = new THREE.Mesh(trouserGeo, legTrouserMat);
  trouserL.position.set(0, -0.32, 0);
  trouserL.castShadow = true;
  leftLeg.add(trouserL);

  if (isTuxedo) {
    // Gold/satin side stripe on tuxedo trouser
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.65, 0.02), materials.goldMat);
    stripeL.position.set(-0.16, -0.32, 0);
    leftLeg.add(stripeL);
  }

  if (isPrincess) {
    const shoeLeft = createBallerinaPointeShoe(princessPinkMat, roseGemMat, materials.goldMat);
    shoeLeft.position.set(0, -1.2, 0);
    leftLeg.add(shoeLeft);
  } else if (isPrince) {
    const shoeLeft = createPrinceBalletSlipper(materials.whiteClothMat, materials.goldMat);
    shoeLeft.position.set(0, -1.2, 0);
    leftLeg.add(shoeLeft);
  } else {
    const bootLeft = createNutcrackerBoot(materials.blackLacquerMat, materials.goldMat);
    bootLeft.position.set(0, -1.2, 0);
    leftLeg.add(bootLeft);
  }

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.32, 1.2, 0);
  nutcrackerRoot.add(rightLeg);

  const trouserR = new THREE.Mesh(trouserGeo, legTrouserMat);
  trouserR.position.set(0, -0.32, 0);
  trouserR.castShadow = true;
  rightLeg.add(trouserR);

  if (isTuxedo) {
    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.65, 0.02), materials.goldMat);
    stripeR.position.set(0.16, -0.32, 0);
    rightLeg.add(stripeR);
  }

  if (isPrincess) {
    const shoeRight = createBallerinaPointeShoe(princessPinkMat, roseGemMat, materials.goldMat);
    shoeRight.position.set(0, -1.2, 0);
    rightLeg.add(shoeRight);
  } else if (isPrince) {
    const shoeRight = createPrinceBalletSlipper(materials.whiteClothMat, materials.goldMat);
    shoeRight.position.set(0, -1.2, 0);
    rightLeg.add(shoeRight);
  } else {
    const bootRight = createNutcrackerBoot(materials.blackLacquerMat, materials.goldMat);
    bootRight.position.set(0, -1.2, 0);
    rightLeg.add(bootRight);
  }

  // B. UPPER BODY & HEAD
  const torsoHead = new THREE.Group();
  torsoHead.position.set(0, 1.22, 0);
  nutcrackerRoot.add(torsoHead);

  let tutuGroup: THREE.Group | undefined;
  let capeMesh: THREE.Mesh | undefined;

  // Pelvis
  const pelvisGeo = new THREE.CylinderGeometry(0.48, 0.44, 0.22, 16);
  const pelvis = new THREE.Mesh(pelvisGeo, tunicMat);
  pelvis.position.y = 0.11;
  pelvis.castShadow = true;
  torsoHead.add(pelvis);

  // Belt / Waistband & Buckle / Tutu Ribbon
  const beltGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.11, 24);
  const belt = new THREE.Mesh(
    beltGeo,
    isPrincess ? materials.goldMat : (isTuxedo ? materials.blackLacquerMat : materials.goldMat)
  );
  belt.position.y = 0.22;
  belt.castShadow = true;
  torsoHead.add(belt);

  if (isPrincess) {
    // Rosette Gem Brooch on princess waistband
    const rosette = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12).rotateX(Math.PI / 2), roseGemMat);
    rosette.position.set(0, 0.22, 0.51);
    torsoHead.add(rosette);
  } else {
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), materials.goldMat);
    buckle.position.set(0, 0.22, 0.5);
    torsoHead.add(buckle);
  }

  // Torso Bodice / Jacket
  const torsoGeo = new THREE.CylinderGeometry(0.54, 0.46, 0.88, 20);
  const torso = new THREE.Mesh(torsoGeo, tunicMat);
  torso.position.y = 0.68;
  torso.castShadow = true;
  torsoHead.add(torso);

  if (isPrincess) {
    // --- 芭蕾公主经典盛装 (Classical Ballerina Princess Tutu & Sweetheart Bodice) ---
    // Multi-tier Platter Tutu Skirt
    tutuGroup = new THREE.Group();
    tutuGroup.position.set(0, 0.18, 0);
    torsoHead.add(tutuGroup);

    // Tier 1: Wide platter tulle disc
    const platterDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 0.95, 0.08, 32),
      tutuTulleMat
    );
    platterDisc.castShadow = true;
    platterDisc.receiveShadow = true;
    tutuGroup.add(platterDisc);

    // Tier 2: Fluted upper tulle rim
    const frillDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.68, 0.11, 28),
      tutuFrillMat
    );
    frillDisc.position.y = 0.06;
    tutuGroup.add(frillDisc);

    // Tier 3: Bodice basque / peplum
    const basqueGeo = new THREE.CylinderGeometry(0.56, 0.72, 0.12, 24);
    const basque = new THREE.Mesh(basqueGeo, princessPinkMat);
    basque.position.y = 0.13;
    tutuGroup.add(basque);

    // Golden trim wire along outer tutu perimeter
    const tutuTrim = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.016, 8, 36).rotateX(Math.PI / 2),
      materials.goldMat
    );
    tutuTrim.position.y = 0.02;
    tutuGroup.add(tutuTrim);

    // Pearl droplets around tutu rim
    for (let p = 0; p < 12; p++) {
      const theta = (p * Math.PI * 2) / 12;
      const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 8),
        materials.whiteClothMat
      );
      pearl.position.set(Math.cos(theta) * 1.05, 0.02, Math.sin(theta) * 1.05);
      tutuGroup.add(pearl);
    }

    // Corset Sweetheart Stomacher & Golden criss-cross lacing
    const stomacher = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.62, 0.03),
      materials.whiteClothMat
    );
    stomacher.position.set(0, 0.68, 0.49);
    torsoHead.add(stomacher);

    // Criss-cross gold corset lacing
    for (let c = 0; c < 4; c++) {
      const laceBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.02, 0.02),
        materials.goldMat
      );
      laceBar.position.set(0, 0.48 + c * 0.12, 0.51);
      torsoHead.add(laceBar);
    }

    // Neckline sweetheart scallop & rose crystal brooch
    const sweetheartBrooch = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 12, 10),
      roseGemMat
    );
    sweetheartBrooch.position.set(0, 0.98, 0.52);
    torsoHead.add(sweetheartBrooch);

    // Off-shoulder tulle armlet puffs
    for (const side of [-1, 1]) {
      const puffArmlet = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 10),
        tutuFrillMat
      );
      puffArmlet.scale.set(1.2, 0.9, 1.1);
      puffArmlet.position.set(side * 0.58, 0.98, 0.05);
      torsoHead.add(puffArmlet);
    }
  } else if (isPrince) {
    // --- 芭蕾王子皇家礼服 (Royal Ballet Prince Doublet, Peplum & Regal Sash) ---
    // Flared peplum at tunic base with golden braid
    const peplumGeo = new THREE.CylinderGeometry(0.48, 0.62, 0.18, 20);
    const peplum = new THREE.Mesh(peplumGeo, princeBlueMat);
    peplum.position.y = 0.08;
    peplum.castShadow = true;
    torsoHead.add(peplum);

    const peplumTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.61, 0.016, 8, 28).rotateX(Math.PI / 2),
      materials.goldMat
    );
    peplumTrim.position.y = -0.01;
    torsoHead.add(peplumTrim);

    // Regal gold ceremonial diagonal sash
    const sash = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.95, 0.035),
      materials.goldMat
    );
    sash.position.set(0.04, 0.68, 0.49);
    sash.rotation.z = -0.42;
    torsoHead.add(sash);

    // Royal Star Order with Sapphire Gem on sash
    const orderStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      materials.goldMat
    );
    orderStar.scale.set(1.2, 1.2, 0.3);
    orderStar.position.set(-0.06, 0.62, 0.52);
    torsoHead.add(orderStar);

    const sapphireHeart = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      sapphireGemMat
    );
    sapphireHeart.position.set(-0.06, 0.62, 0.54);
    torsoHead.add(sapphireHeart);

    // Gold bullion frogging cords across chest
    for (let f = 0; f < 3; f++) {
      const cordY = 0.52 + f * 0.16;
      const cord = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.024, 0.02),
        materials.goldMat
      );
      cord.position.set(0, cordY, 0.505);
      torsoHead.add(cord);

      const fBtn = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 8, 8),
        materials.goldMat
      );
      fBtn.position.set(0, cordY, 0.52);
      torsoHead.add(fBtn);
    }

    // Royal Velvet Mini-Cape in the back
    const capeGeo = new THREE.PlaneGeometry(0.78, 1.05, 4, 8);
    capeGeo.rotateX(-0.1);
    capeMesh = new THREE.Mesh(capeGeo, princeCapeMat);
    capeMesh.position.set(0, 0.62, -0.49);
    capeMesh.castShadow = true;
    torsoHead.add(capeMesh);

    // Gold cape chain clasp across shoulders
    const capeClasp = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.016, 8, 20, Math.PI),
      materials.goldMat
    );
    capeClasp.position.set(0, 1.15, -0.2);
    capeClasp.rotation.x = -Math.PI / 2;
    torsoHead.add(capeClasp);
  } else if (isTuxedo) {
    // Elegant Tuxedo Swallowtails in the back
    const tailGeo = new THREE.BoxGeometry(0.18, 0.72, 0.025);
    const tailL = new THREE.Mesh(tailGeo, tunicMat);
    tailL.position.set(-0.16, -0.15, -0.46);
    tailL.rotation.x = 0.16;
    tailL.rotation.y = -0.06;
    tailL.castShadow = true;
    torsoHead.add(tailL);

    const tailR = new THREE.Mesh(tailGeo, tunicMat);
    tailR.position.set(0.16, -0.15, -0.46);
    tailR.rotation.x = 0.16;
    tailR.rotation.y = 0.06;
    tailR.castShadow = true;
    torsoHead.add(tailR);

    // Two gold tail buttons on back waist
    const tBtnL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), materials.goldMat);
    tBtnL.position.set(-0.16, 0.22, -0.47);
    torsoHead.add(tBtnL);
    const tBtnR = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), materials.goldMat);
    tBtnR.position.set(0.16, 0.22, -0.47);
    torsoHead.add(tBtnR);

    // Pleated White Shirt Bib in front
    const shirtBib = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.03), materials.whiteClothMat);
    shirtBib.position.set(0, 0.68, 0.49);
    torsoHead.add(shirtBib);

    // Black studs on shirt bib
    for (let s = 0; s < 3; s++) {
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8).rotateX(Math.PI / 2), materials.blackLacquerMat);
      stud.position.set(0, 0.52 + s * 0.14, 0.51);
      torsoHead.add(stud);
    }

    // Peaked Tuxedo Lapels
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.64, 0.03), materials.blackLacquerMat);
    lapelL.position.set(-0.18, 0.7, 0.51);
    lapelL.rotation.z = -0.3;
    torsoHead.add(lapelL);

    const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.64, 0.03), materials.blackLacquerMat);
    lapelR.position.set(0.18, 0.7, 0.51);
    lapelR.rotation.z = 0.3;
    torsoHead.add(lapelR);

    // Silk Bowtie at collar
    const bowtieGroup = new THREE.Group();
    bowtieGroup.position.set(0, 1.15, 0.5);
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), materials.blackLacquerMat);
    bowtieGroup.add(knot);
    const bowL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 6).rotateZ(Math.PI / 2), materials.blackLacquerMat);
    bowL.position.set(-0.07, 0, 0);
    bowtieGroup.add(bowL);
    const bowR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 6).rotateZ(-Math.PI / 2), materials.blackLacquerMat);
    bowR.position.set(0.07, 0, 0);
    bowtieGroup.add(bowR);
    torsoHead.add(bowtieGroup);
  } else {
    // Classic military crossed baldric straps
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.03), materials.whiteClothMat);
    strapL.position.set(0, 0.68, 0.48);
    strapL.rotation.z = 0.42;
    torsoHead.add(strapL);

    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.03), materials.whiteClothMat);
    strapR.position.set(0, 0.68, 0.485);
    strapR.rotation.z = -0.42;
    torsoHead.add(strapR);

    for (let r = 0; r < 3; r++) {
      const btnY = 0.48 + r * 0.18;
      const btnL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), materials.goldMat);
      btnL.position.set(-0.16, btnY, 0.5);
      torsoHead.add(btnL);

      const btnR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), materials.goldMat);
      btnR.position.set(0.16, btnY, 0.5);
      torsoHead.add(btnR);
    }
  }

  // Collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.18, 16), materials.whiteClothMat);
  collar.position.y = 1.18;
  torsoHead.add(collar);

  const collarGold = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.015, 8, 24).rotateX(Math.PI / 2), materials.goldMat);
  collarGold.position.y = 1.25;
  torsoHead.add(collarGold);

  // Epaulettes (or shoulder braiding)
  const epauletteL = createEpaulette(materials.goldMat);
  epauletteL.position.set(-0.56, 1.1, 0);
  epauletteL.rotation.z = 0.15;
  torsoHead.add(epauletteL);

  const epauletteR = createEpaulette(materials.goldMat);
  epauletteR.position.set(0.56, 1.1, 0);
  epauletteR.rotation.z = -0.15;
  torsoHead.add(epauletteR);

  // Back Winding Key
  const windingKey = new THREE.Group();
  windingKey.position.set(0, 0.72, -0.56);
  torsoHead.add(windingKey);

  const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 12).rotateX(Math.PI / 2), materials.goldMat);
  stemMesh.position.z = -0.1;
  windingKey.add(stemMesh);

  const keyWingL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.038, 12, 24), materials.goldMat);
  keyWingL.position.set(-0.16, 0, -0.22);
  windingKey.add(keyWingL);

  const keyWingR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.038, 12, 24), materials.goldMat);
  keyWingR.position.set(0.16, 0, -0.22);
  windingKey.add(keyWingR);

  // C. HEAD & JAW
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.28, 0);
  torsoHead.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.75, 20), faceMat);
  headMesh.position.y = 0.38;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Nose
  const noseGeo = new THREE.ConeGeometry(isPrincess ? 0.06 : 0.075, isPrincess ? 0.24 : 0.3, 12);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, faceMat);
  nose.position.set(0, isPrincess ? 0.42 : 0.44, 0.44);
  headGroup.add(nose);

  // Eyes & Cheeks
  for (const side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 8), materials.whiteClothMat);
    eyeWhite.scale.set(1.2, 1, 0.5);
    eyeWhite.position.set(side * 0.16, 0.48, 0.36);
    headGroup.add(eyeWhite);

    const irisColor = isPrincess
      ? 0x6366F1
      : isPrince
      ? 0x1D4ED8
      : isTuxedo
      ? 0xD4AF37
      : isDrummer
      ? 0x0E7490
      : 0x1A5BB8;
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.032, 12), new THREE.MeshBasicMaterial({ color: irisColor }));
    iris.position.set(side * 0.16, 0.48, 0.388);
    headGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), materials.blackLacquerMat);
    pupil.position.set(side * 0.16, 0.48, 0.392);
    headGroup.add(pupil);

    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, isPrincess ? 0.018 : 0.024, 0.02),
      new THREE.MeshBasicMaterial({ color: isPrincess ? 0x8B5A2B : (isPrince ? 0x5D4037 : 0x222222) })
    );
    brow.position.set(side * 0.16, 0.55, 0.37);
    brow.rotation.z = side * (isPrincess ? -0.08 : -0.15);
    headGroup.add(brow);

    const blush = new THREE.Mesh(
      new THREE.CircleGeometry(isPrincess ? 0.085 : 0.07, 12),
      new THREE.MeshBasicMaterial({ color: isPrincess ? 0xF472B6 : 0xEB6B56, transparent: true, opacity: isPrincess ? 0.65 : 0.55 })
    );
    blush.position.set(side * 0.24, 0.36, 0.35);
    blush.rotation.y = side * 0.35;
    headGroup.add(blush);
  }

  // Facial Hair (Mustache)
  if (!isPrincess) {
    const mustacheMat = new THREE.MeshStandardMaterial({
      color: isPrince ? 0xD4A373 : 0xFAF6EF,
      roughness: 0.35,
    });
    const stacheL = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.038, 8, 16, Math.PI * 0.8), mustacheMat);
    stacheL.position.set(-0.1, 0.32, 0.38);
    stacheL.rotation.z = -0.3;
    headGroup.add(stacheL);

    const stacheR = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.038, 8, 16, Math.PI * 0.8), mustacheMat);
    stacheR.scale.x = -1;
    stacheR.position.set(0.1, 0.32, 0.38);
    stacheR.rotation.z = 0.3;
    headGroup.add(stacheR);
  }

  // Upper Teeth & Mouth cavity
  const mouthCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.16, 0.14),
    new THREE.MeshBasicMaterial({ color: isPrincess ? 0x881337 : 0x1A0808 })
  );
  mouthCavity.position.set(0, 0.22, 0.33);
  headGroup.add(mouthCavity);

  if (isPrincess) {
    // Gentle smiling wooden doll lips
    const lips = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xF43F5E })
    );
    lips.position.set(0, 0.23, 0.39);
    headGroup.add(lips);
  } else {
    for (let t = 0; t < 4; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.03), materials.whiteClothMat);
      tooth.position.set(-0.075 + t * 0.05, 0.26, 0.385);
      headGroup.add(tooth);
    }
  }

  // Hair Styling
  const hairMat = isPrincess
    ? goldenHairMat
    : isPrince
    ? new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.65 })
    : new THREE.MeshStandardMaterial({ color: 0xF2ECE1, roughness: 0.7 });

  if (isPrincess) {
    // --- 糖果公主高雅发髻 (Ballerina High Chignon & Pearl Hairnet) ---
    // High Ballet Bun on top
    const chignon = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 14),
      goldenHairMat
    );
    chignon.position.set(0, 0.84, -0.08);
    chignon.scale.set(1.2, 0.85, 1.05);
    chignon.castShadow = true;
    headGroup.add(chignon);

    // Pearl Filigree Hairnet around bun
    const bunNet = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.016, 8, 24).rotateX(Math.PI / 2),
      materials.goldMat
    );
    bunNet.position.set(0, 0.82, -0.08);
    headGroup.add(bunNet);

    for (let b = 0; b < 8; b++) {
      const theta = (b * Math.PI * 2) / 8;
      const pearlPin = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 8, 8),
        roseGemMat
      );
      pearlPin.position.set(Math.cos(theta) * 0.22, 0.84, -0.08 + Math.sin(theta) * 0.22);
      headGroup.add(pearlPin);
    }

    // Side and back graceful locks
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.38), goldenHairMat);
    hairL.position.set(-0.38, 0.32, -0.06);
    headGroup.add(hairL);

    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.38), goldenHairMat);
    hairR.position.set(0.38, 0.32, -0.06);
    headGroup.add(hairR);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.76, 0.12), goldenHairMat);
    hairBack.position.set(0, 0.35, -0.34);
    headGroup.add(hairBack);
  } else if (isPrince) {
    // --- 王子贵族卷发 (Noble Prince Romantic Curls) ---
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.68, 0.38), hairMat);
    hairL.position.set(-0.38, 0.32, -0.05);
    headGroup.add(hairL);

    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.68, 0.38), hairMat);
    hairR.position.set(0.38, 0.32, -0.05);
    headGroup.add(hairR);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.75, 0.12), hairMat);
    hairBack.position.set(0, 0.35, -0.34);
    headGroup.add(hairBack);

    // Forehead swept curls
    const curlF = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI), hairMat);
    curlF.position.set(0, 0.72, 0.34);
    curlF.rotation.x = 0.4;
    headGroup.add(curlF);
  } else {
    // Classic Nutcracker Hair
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.36), hairMat);
    hairL.position.set(-0.38, 0.32, -0.05);
    headGroup.add(hairL);

    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.36), hairMat);
    hairR.position.set(0.38, 0.32, -0.05);
    headGroup.add(hairR);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.75, 0.1), hairMat);
    hairBack.position.set(0, 0.35, -0.34);
    headGroup.add(hairBack);
  }

  // Movable Jaw
  const jaw = new THREE.Group();
  jaw.position.set(0, 0.19, 0.34);
  headGroup.add(jaw);

  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.11, 0.14), faceMat);
  chin.position.set(0, -0.055, 0);
  chin.castShadow = true;
  jaw.add(chin);

  if (!isPrincess) {
    for (let t = 0; t < 4; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.03), materials.whiteClothMat);
      tooth.position.set(-0.075 + t * 0.05, 0.02, 0.05);
      jaw.add(tooth);
    }

    if (!isPrince) {
      // Classic beard for military and tuxedo nutcrackers
      const chinBeard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.1), hairMat);
      chinBeard.position.set(0, -0.22, 0.02);
      chinBeard.castShadow = true;
      jaw.add(chinBeard);
    }
  }

  // Headwear: Princess Ballerina Tiara / Prince Royal Coronet / Tuxedo Top Hat / Military Shako Cap
  if (isPrincess) {
    // --- 芭蕾珍珠水晶皇冠 (Ballerina Tiara / Royal Coronet) ---
    const tiaraGroup = new THREE.Group();
    tiaraGroup.position.set(0, 0.74, 0.08);
    headGroup.add(tiaraGroup);

    // Tiara Base Arc Band
    const baseBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.022, 8, 24, Math.PI * 0.95),
      materials.goldMat
    );
    baseBand.rotation.x = Math.PI / 2;
    tiaraGroup.add(baseBand);

    // 5 Spires of the Ballerina Coronet
    const spireHeights = [0.18, 0.28, 0.36, 0.28, 0.18];
    const spireAngles = [-0.45, -0.22, 0, 0.22, 0.45];
    spireAngles.forEach((angle, idx) => {
      const h = spireHeights[idx];
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.038, h, 8),
        materials.goldMat
      );
      const rad = 0.38;
      spire.position.set(Math.sin(angle) * rad, h / 2, Math.cos(angle) * rad - 0.02);
      spire.rotation.z = -angle * 0.45;
      tiaraGroup.add(spire);

      // Pearl / Gem topping each spire
      const gemTip = new THREE.Mesh(
        new THREE.SphereGeometry(idx === 2 ? 0.045 : 0.032, 10, 8),
        idx === 2 ? roseGemMat : materials.whiteClothMat
      );
      gemTip.position.set(Math.sin(angle) * rad, h + 0.02, Math.cos(angle) * rad - 0.02);
      tiaraGroup.add(gemTip);
    });

    // Center faceted ruby crystal star on tiara base
    const centerGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.065, 0),
      roseGemMat
    );
    centerGem.position.set(0, 0.09, 0.39);
    tiaraGroup.add(centerGem);
  } else if (isPrince) {
    // --- 胡桃夹子王子王冠 (Prince Royal Coronet / Crown) ---
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.75, 0);
    headGroup.add(crownGroup);

    // Royal Gold Circlet Base
    const circlet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.42, 0.14, 24, 1, true),
      materials.goldMat
    );
    circlet.position.y = 0.07;
    crownGroup.add(circlet);

    // Inner Royal Blue Velvet Cap
    const velvetCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.41, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      princeCapeMat
    );
    velvetCap.scale.set(1, 0.65, 1);
    velvetCap.position.y = 0.08;
    crownGroup.add(velvetCap);

    // 8 Fleur-de-lis / Crown Spires with Jewels
    for (let c = 0; c < 8; c++) {
      const angle = (c * Math.PI * 2) / 8;
      const point = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.22, 6),
        materials.goldMat
      );
      point.position.set(Math.sin(angle) * 0.43, 0.22, Math.cos(angle) * 0.43);
      crownGroup.add(point);

      const jewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        c % 2 === 0 ? roseGemMat : sapphireGemMat
      );
      jewel.position.set(Math.sin(angle) * 0.43, 0.34, Math.cos(angle) * 0.43);
      crownGroup.add(jewel);
    }

    // Imperial Cross on Crown Apex
    const crossBarH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.035), materials.goldMat);
    crossBarH.position.set(0, 0.46, 0);
    crownGroup.add(crossBarH);

    const crossBarV = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.035), materials.goldMat);
    crossBarV.position.set(0, 0.46, 0);
    crownGroup.add(crossBarV);
  } else if (isTuxedo) {
    // Tall Black Top Hat (黑色大礼帽)
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.76, 0);
    headGroup.add(hatGroup);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.038, 28), materials.blackLacquerMat);
    brim.scale.set(1.15, 1, 1.05);
    brim.position.y = 0.02;
    hatGroup.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.43, 1.05, 24), materials.blackLacquerMat);
    crown.position.y = 0.54;
    crown.castShadow = true;
    hatGroup.add(crown);

    const hatband = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.44, 0.14, 24), materials.goldMat);
    hatband.position.y = 0.1;
    hatGroup.add(hatband);

    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), materials.goldMat);
    clasp.position.set(0, 0.1, 0.45);
    hatGroup.add(clasp);
  } else {
    // Classic Military Shako Cap
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.76, 0);
    headGroup.add(hatGroup);

    const shako = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.39, 0.95, 20), materials.blackLacquerMat);
    shako.position.y = 0.475;
    shako.castShadow = true;
    hatGroup.add(shako);

    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 20, 1, false, 0, Math.PI), materials.blackLacquerMat);
    visor.position.set(0, 0.02, 0.05);
    visor.rotation.x = 0.25;
    hatGroup.add(visor);

    const visorTrim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.02, 8, 20, Math.PI), materials.goldMat);
    visorTrim.position.set(0, 0.02, 0.05);
    visorTrim.rotation.x = 0.25;
    hatGroup.add(visorTrim);

    const chainMesh = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.02, 8, 24, Math.PI * 0.8), materials.goldMat);
    chainMesh.position.set(0, 0.14, 0.05);
    chainMesh.rotation.x = 0.35;
    hatGroup.add(chainMesh);

    const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), materials.goldMat);
    badge.scale.set(1.2, 1.4, 0.3);
    badge.position.set(0, 0.58, 0.42);
    hatGroup.add(badge);

    const plumeHex = isDrummer ? 0x2563EB : 0xC82320;
    const plumeGeo = new THREE.ConeGeometry(0.08, 0.55, 12);
    const plumeMat = new THREE.MeshStandardMaterial({ color: plumeHex, roughness: 0.3 });
    const plume = new THREE.Mesh(plumeGeo, plumeMat);
    plume.position.set(0, 1.15, 0.32);
    plume.rotation.x = -0.1;
    plume.castShadow = true;
    hatGroup.add(plume);

    const plumeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), materials.goldMat);
    plumeRing.position.set(0, 0.95, 0.35);
    hatGroup.add(plumeRing);
  }

  // D. ARMS & INSTRUMENT ATTACHMENTS
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.62, 1.02, 0);
  torsoHead.add(leftArm);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.45, 12), tunicMat);
  armL.position.y = -0.225;
  armL.castShadow = true;
  leftArm.add(armL);

  const foreArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 12), tunicMat);
  foreArmL.position.y = -0.62;
  foreArmL.castShadow = true;
  leftArm.add(foreArmL);

  const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.1, 12), materials.whiteClothMat);
  cuffL.position.y = -0.78;
  leftArm.add(cuffL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), faceMat);
  handL.position.y = -0.88;
  leftArm.add(handL);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.62, 1.02, 0);
  torsoHead.add(rightArm);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.45, 12), tunicMat);
  armR.position.y = -0.225;
  armR.castShadow = true;
  rightArm.add(armR);

  const foreArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 12), tunicMat);
  foreArmR.position.y = -0.62;
  foreArmR.castShadow = true;
  rightArm.add(foreArmR);

  const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.1, 12), materials.whiteClothMat);
  cuffR.position.y = -0.78;
  rightArm.add(cuffR);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), faceMat);
  handR.position.y = -0.88;
  rightArm.add(handR);

  // Attach instruments according to puppet.instrument with authentic playing poses:
  let instrumentGroup: THREE.Group | undefined;
  const valves: THREE.Mesh[] = [];
  const keys: THREE.Mesh[] = [];
  const strings: THREE.Mesh[] = [];
  let acousticFlash: THREE.Mesh | undefined;

  // 1. 小号 (Trumpet - 吹奏小号)
  if (puppet.instrument === 'trumpet') {
    instrumentGroup = new THREE.Group();
    // Mouthpiece positioned directly at the lips in headGroup (y=0.22, z=0.36)
    instrumentGroup.position.set(0, 0.22, 0.36);
    instrumentGroup.rotation.x = -0.16; // Tilted proudly forward/upward ~9 degrees
    headGroup.add(instrumentGroup);

    // Cup mouthpiece at lips
    const mouthpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.05, 12).rotateX(Math.PI / 2), materials.goldMat);
    mouthpiece.position.set(0, 0, 0.025);
    instrumentGroup.add(mouthpiece);

    // Leadpipe extending forward
    const leadpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.44, 12).rotateX(Math.PI / 2), materials.goldMat);
    leadpipe.position.set(0, 0.01, 0.26);
    instrumentGroup.add(leadpipe);

    // Valve casing block
    const casingBlock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.18), materials.goldMat);
    casingBlock.position.set(0.02, 0.01, 0.52);
    instrumentGroup.add(casingBlock);

    // 3 Valves with pressable pistons
    for (let v = 0; v < 3; v++) {
      const valveMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12), materials.goldMat);
      valveMesh.position.set(0.02, 0.04, 0.46 + v * 0.06);
      instrumentGroup.add(valveMesh);
      valves.push(valveMesh);

      // Pearl valve finger button on top
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.015, 12), materials.whiteClothMat);
      cap.position.y = 0.08;
      valveMesh.add(cap);
    }

    // Upper tuning slides loops
    const upperLoop = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 16, Math.PI), materials.goldMat);
    upperLoop.position.set(0.02, 0.06, 0.42);
    upperLoop.rotation.y = Math.PI / 2;
    instrumentGroup.add(upperLoop);

    // Main forward bell pipe
    const bellPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.36, 12).rotateX(Math.PI / 2), materials.goldMat);
    bellPipe.position.set(0, 0.01, 0.76);
    instrumentGroup.add(bellPipe);

    // Flared bell cone
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.26, 24, 1, true).rotateX(-Math.PI / 2), materials.goldMat);
    bell.position.set(0, 0.01, 1.02);
    instrumentGroup.add(bell);

    // Bell rim
    const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.014, 8, 28), materials.goldMat);
    bellRim.position.set(0, 0.01, 1.15);
    instrumentGroup.add(bellRim);

    // Emissive acoustic sound pulse ring
    const aRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.182, 0.016, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xFFE082, emissive: 0xFFB300, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 })
    );
    aRing.position.set(0, 0.01, 1.16);
    instrumentGroup.add(aRing);
    acousticFlash = aRing;
  }

  // 2. 大号 (Tuba - 吹奏大号)
  else if (puppet.instrument === 'tuba') {
    instrumentGroup = new THREE.Group();
    torsoHead.add(instrumentGroup);

    // Coiled giant brass loops wrapping chest and left shoulder
    const coil1 = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 16, 32), materials.goldMat);
    coil1.position.set(-0.05, 0.72, 0.12);
    coil1.rotation.y = 0.25;
    coil1.rotation.z = 0.28;
    instrumentGroup.add(coil1);

    const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 16, 28), materials.goldMat);
    coil2.position.set(-0.05, 0.75, 0.22);
    coil2.rotation.y = 0.25;
    instrumentGroup.add(coil2);

    // Upward flared giant bell towering over left shoulder
    const tubaBell = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.7, 24, 1, true), materials.goldMat);
    tubaBell.position.set(-0.32, 1.45, -0.05);
    tubaBell.rotation.z = -0.3;
    tubaBell.rotation.x = -0.15;
    instrumentGroup.add(tubaBell);

    const tubaRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.028, 12, 32), materials.goldMat);
    tubaRim.position.set(-0.43, 1.76, -0.09);
    tubaRim.rotation.z = -0.3;
    instrumentGroup.add(tubaRim);

    // Acoustic pulse ring at tuba bell
    const tFlash = new THREE.Mesh(
      new THREE.TorusGeometry(0.365, 0.026, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xFFD54F, emissive: 0xFF8F00, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 })
    );
    tFlash.position.set(-0.43, 1.78, -0.09);
    tFlash.rotation.z = -0.3;
    instrumentGroup.add(tFlash);
    acousticFlash = tFlash;

    // Curved leadpipe reaching up to lips at (0, 1.50, 0.37)
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 12), materials.goldMat);
    pipe1.position.set(0.08, 1.15, 0.32);
    pipe1.rotation.z = 0.25;
    instrumentGroup.add(pipe1);

    const mouthpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.016, 0.06, 12).rotateX(Math.PI / 2), materials.goldMat);
    mouthpiece.position.set(0, 1.50, 0.37);
    instrumentGroup.add(mouthpiece);

    // 4 Valve pistons on front tube
    for (let v = 0; v < 4; v++) {
      const vMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 10), materials.goldMat);
      vMesh.position.set(0.18, 0.88 - v * 0.06, 0.36);
      instrumentGroup.add(vMesh);
      valves.push(vMesh);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 10), materials.whiteClothMat);
      cap.position.y = 0.07;
      vMesh.add(cap);
    }
  }

  // 3. 单簧管 (Clarinet - 吹奏单簧管)
  else if (puppet.instrument === 'clarinet') {
    instrumentGroup = new THREE.Group();
    instrumentGroup.position.set(0, 0.22, 0.36);
    instrumentGroup.rotation.x = 0.82; // Downward clarinet angle
    headGroup.add(instrumentGroup);

    // Beak mouthpiece in mouth
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.1, 8).rotateX(Math.PI), materials.blackLacquerMat);
    beak.position.y = -0.04;
    instrumentGroup.add(beak);

    // Silver ligature band
    const ligature = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.03, 12), materials.silverKeyMat);
    ligature.position.y = -0.08;
    instrumentGroup.add(ligature);

    // African blackwood body tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.88, 16), materials.ebonyWoodMat);
    tube.position.y = -0.52;
    instrumentGroup.add(tube);

    // Flared lower bell
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.22, 16, 1, true), materials.ebonyWoodMat);
    bell.position.y = -1.02;
    bell.rotation.x = Math.PI;
    instrumentGroup.add(bell);

    // Silver bell ring
    const bellRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 8, 20).rotateX(Math.PI / 2), materials.silverKeyMat);
    bellRing.position.y = -1.13;
    instrumentGroup.add(bellRing);

    // Acoustic pulse ring at clarinet bell
    const cFlash = new THREE.Mesh(
      new THREE.TorusGeometry(0.096, 0.014, 8, 20).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xE0E0E0, emissive: 0xFFF9C4, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 })
    );
    cFlash.position.y = -1.14;
    instrumentGroup.add(cFlash);
    acousticFlash = cFlash;

    // 6 silver interactive keys along the tube
    for (let k = 0; k < 6; k++) {
      const keyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8).rotateX(Math.PI / 2), materials.silverKeyMat);
      keyMesh.position.set(0, -0.22 - k * 0.1, 0.034);
      instrumentGroup.add(keyMesh);
      keys.push(keyMesh);
    }
  }

  // 4. 双簧管 (Oboe - 吹奏双簧管)
  else if (puppet.instrument === 'oboe') {
    instrumentGroup = new THREE.Group();
    instrumentGroup.position.set(0, 0.22, 0.36);
    instrumentGroup.rotation.x = 0.76;
    headGroup.add(instrumentGroup);

    // Double reed cane between lips
    const staple = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.07, 8), materials.goldMat);
    staple.position.y = -0.02;
    instrumentGroup.add(staple);
    const reed = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.05, 0.005), materials.birchFaceMat);
    reed.position.y = 0.03;
    instrumentGroup.add(reed);

    // Slender conical body
    const oboeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.038, 0.88, 16), materials.ebonyWoodMat);
    oboeTube.position.y = -0.48;
    instrumentGroup.add(oboeTube);

    // Flared bell with silver rim
    const oboeBell = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.072, 0.16, 16), materials.ebonyWoodMat);
    oboeBell.position.y = -0.96;
    instrumentGroup.add(oboeBell);

    const oRing = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.01, 8, 20).rotateX(Math.PI / 2), materials.silverKeyMat);
    oRing.position.y = -1.04;
    instrumentGroup.add(oRing);

    // Acoustic pulse ring
    const oFlash = new THREE.Mesh(
      new THREE.TorusGeometry(0.074, 0.012, 8, 20).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xFFF9C4, emissive: 0xFFD54F, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 })
    );
    oFlash.position.y = -1.05;
    instrumentGroup.add(oFlash);
    acousticFlash = oFlash;

    // 7 French conservatory silver keys
    for (let k = 0; k < 7; k++) {
      const keyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.036, 0.018), materials.silverKeyMat);
      keyMesh.position.set(0, -0.2 - k * 0.09, 0.032);
      instrumentGroup.add(keyMesh);
      keys.push(keyMesh);
    }
  }

  // 5. 竖琴 (Harp - 弹竖琴)
  else if (puppet.instrument === 'harp') {
    instrumentGroup = new THREE.Group();
    instrumentGroup.position.set(0.56, 0.06, 0.22);
    instrumentGroup.rotation.y = -0.32;
    nutcrackerRoot.add(instrumentGroup);

    // Base pedestal
    const hPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.65), materials.goldMat);
    hPedestal.position.set(0, 0.06, 0);
    instrumentGroup.add(hPedestal);

    // Golden fluted pillar
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 1.85, 16), materials.goldMat);
    pillar.position.set(0, 0.98, 0.32);
    instrumentGroup.add(pillar);

    // Roman capital
    const capital = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), materials.goldMat);
    capital.position.set(0, 1.95, 0.32);
    instrumentGroup.add(capital);

    // Resonant soundboard (body)
    const soundboard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 1.8, 16), materials.darkWoodMat);
    soundboard.position.set(0, 0.94, -0.22);
    soundboard.rotation.x = 0.32;
    instrumentGroup.add(soundboard);

    // Curved harmonic neck
    const neck = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 12, 24, Math.PI * 0.9), materials.goldMat);
    neck.rotation.y = Math.PI / 2;
    neck.position.set(0, 1.85, 0.04);
    instrumentGroup.add(neck);

    // 10 golden strings that vibrate and glow when plucked
    for (let s = 0; s < 10; s++) {
      const t = s / 9;
      const strZTop = 0.26 - t * 0.44;
      const strYTop = 1.9 - t * 0.24;
      const strZBot = 0.18 - t * 0.36;
      const strYBot = 0.2 + t * 0.35;
      const strLen = Math.hypot(strZTop - strZBot, strYTop - strYBot);

      const strMat = new THREE.MeshStandardMaterial({
        color: 0xE8B84B,
        emissive: 0xF59E0B,
        emissiveIntensity: 0.2,
        roughness: 0.3,
      });
      const strMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, strLen, 6), strMat);
      strMesh.position.set(0, (strYTop + strYBot) / 2, (strZTop + strZBot) / 2);
      strMesh.rotation.x = Math.atan2(strZBot - strZTop, strYTop - strYBot);
      instrumentGroup.add(strMesh);
      strings.push(strMesh);
    }
  }

  // 6. 鼓 (Drum - 打鼓)
  else if (puppet.instrument === 'drum') {
    instrumentGroup = new THREE.Group();
    instrumentGroup.position.set(0, 0.52, 0.52);
    torsoHead.add(instrumentGroup);

    // Drum shell
    const drumShell = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.36, 24), materials.darkWoodMat);
    instrumentGroup.add(drumShell);

    // Drumhead top
    const topHead = new THREE.Mesh(new THREE.CylinderGeometry(0.342, 0.342, 0.02, 24), materials.whiteClothMat);
    topHead.position.y = 0.18;
    instrumentGroup.add(topHead);

    // Bottom head
    const botHead = new THREE.Mesh(new THREE.CylinderGeometry(0.342, 0.342, 0.02, 24), materials.whiteClothMat);
    botHead.position.y = -0.18;
    instrumentGroup.add(botHead);

    // Gold rims
    const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.02, 8, 24).rotateX(Math.PI / 2), materials.goldMat);
    rimTop.position.y = 0.19;
    instrumentGroup.add(rimTop);

    const rimBot = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.02, 8, 24).rotateX(Math.PI / 2), materials.goldMat);
    rimBot.position.y = -0.19;
    instrumentGroup.add(rimBot);

    // Tension rods
    for (let r = 0; r < 6; r++) {
      const angle = (r * Math.PI * 2) / 6;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 6), materials.goldMat);
      rod.position.set(Math.cos(angle) * 0.348, 0, Math.sin(angle) * 0.348);
      instrumentGroup.add(rod);
    }

    // Drumhead acoustic impact ripple ring
    const dFlash = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.02, 8, 24).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xFFEB3B, emissive: 0xFFC107, emissiveIntensity: 0.2, transparent: true, opacity: 0.8 })
    );
    dFlash.position.y = 0.20;
    instrumentGroup.add(dFlash);
    acousticFlash = dFlash;

    // Drumsticks attached to hands:
    const stickL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.75, 8), materials.goldMat);
    stickL.position.set(0, -0.88, 0.32);
    stickL.rotation.x = Math.PI / 2.3;
    leftArm.add(stickL);
    const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), materials.goldMat);
    tipL.position.set(0, -0.72, 0.65);
    leftArm.add(tipL);

    const stickR = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.75, 8), materials.goldMat);
    stickR.position.set(0, -0.88, 0.32);
    stickR.rotation.x = Math.PI / 2.3;
    rightArm.add(stickR);
    const tipR = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), materials.goldMat);
    tipR.position.set(0, -0.72, 0.65);
    rightArm.add(tipR);
  }

  // 7. 八音钟琴 (Bell / Lead: Fairy Star Wand for Princess, Royal Rapier for Prince, Officer Sword for Guard)
  let starWandMesh: THREE.Mesh | undefined;

  if (puppet.instrument === 'bell' || (!puppet.instrument && isPrincess)) {
    if (isPrincess) {
      // --- 糖果公主：仙子金星魔杖与迷你金钟 (Sugar Plum Princess Star Wand & Chime) ---
      // Left hand golden chime bell
      const bellGroup = new THREE.Group();
      bellGroup.position.set(0, -0.88, 0);
      leftArm.add(bellGroup);

      const chimeBody = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 12), materials.goldMat);
      chimeBody.position.y = -0.12;
      chimeBody.rotation.x = Math.PI;
      chimeBody.castShadow = true;
      bellGroup.add(chimeBody);

      const chimeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), materials.goldMat);
      chimeHandle.position.y = 0.05;
      bellGroup.add(chimeHandle);

      // Right hand Magic Fairy Star Wand (仙子星光魔杖)
      const wandGroup = new THREE.Group();
      wandGroup.position.set(0, -0.88, 0);
      wandGroup.rotation.x = Math.PI / 2.2;
      rightArm.add(wandGroup);

      const wandShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.88, 10), materials.goldMat);
      wandShaft.position.y = -0.42;
      wandShaft.castShadow = true;
      wandGroup.add(wandShaft);

      // 5-pointed Star Head
      const starHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), materials.goldMat);
      starHead.position.y = -0.88;
      starHead.scale.set(1.2, 1.2, 0.4);
      starHead.castShadow = true;
      wandGroup.add(starHead);
      starWandMesh = starHead;

      // Glowing heart crystal in star
      const starGlow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), roseGemMat);
      starGlow.position.y = -0.88;
      wandGroup.add(starGlow);
    } else if (isPrince) {
      // --- 胡桃夹子王子：皇家仪仗利剑与纯金音槌 (Prince Royal Rapier & Gold Chime Mallet) ---
      // Left hand royal rapier
      const rapierGroup = new THREE.Group();
      rapierGroup.position.set(0, -0.88, 0);
      rapierGroup.rotation.x = Math.PI / 2;
      leftArm.add(rapierGroup);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.92, 0.01), materials.steelBladeMat);
      blade.position.y = -0.46;
      blade.castShadow = true;
      rapierGroup.add(blade);

      const basketGuard = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), materials.goldMat);
      basketGuard.position.set(0, 0.02, 0.04);
      basketGuard.rotation.y = Math.PI / 2;
      rapierGroup.add(basketGuard);

      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8), materials.goldMat);
      hilt.position.y = 0.09;
      rapierGroup.add(hilt);

      const sapphirePommel = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), sapphireGemMat);
      sapphirePommel.position.y = 0.18;
      rapierGroup.add(sapphirePommel);

      // Right hand pure gold chime mallet
      const malletGroup = new THREE.Group();
      malletGroup.position.set(0, -0.88, 0);
      malletGroup.rotation.x = Math.PI / 2;
      rightArm.add(malletGroup);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.92, 10), materials.goldMat);
      shaft.position.y = -0.46;
      shaft.castShadow = true;
      malletGroup.add(shaft);

      const malletHead = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), materials.goldMat);
      malletHead.position.y = -0.92;
      malletHead.castShadow = true;
      malletGroup.add(malletHead);
    } else {
      // Classic officer sword & chime mallet
      const swordGroup = new THREE.Group();
      swordGroup.position.set(0, -0.88, 0);
      swordGroup.rotation.x = Math.PI / 2;
      leftArm.add(swordGroup);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.85, 0.012), materials.steelBladeMat);
      blade.position.y = -0.42;
      blade.castShadow = true;
      swordGroup.add(blade);

      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.06), materials.goldMat);
      swordGroup.add(guard);

      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 8), materials.blackLacquerMat);
      hilt.position.y = 0.08;
      swordGroup.add(hilt);

      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.goldMat);
      pommel.position.y = 0.16;
      swordGroup.add(pommel);

      // Right hand chime mallet
      const malletGroup = new THREE.Group();
      malletGroup.position.set(0, -0.88, 0);
      malletGroup.rotation.x = Math.PI / 2;
      rightArm.add(malletGroup);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.92, 10), materials.darkWoodMat);
      shaft.position.y = -0.46;
      shaft.castShadow = true;
      malletGroup.add(shaft);

      const malletHead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), materials.goldMat);
      malletHead.position.y = -0.92;
      malletHead.castShadow = true;
      malletGroup.add(malletHead);
    }
  }

  return {
    nutcrackerRoot,
    torsoHead,
    headGroup,
    jaw,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    windingKey,
    instrumentGroup,
    valves,
    keys,
    strings,
    acousticFlash,
    tutuGroup,
    capeMesh,
    starWandMesh,
  };
}

// ------------------------------------------------------------------
// HELPER FOOTWEAR BUILDERS (Pointe Shoe, Prince Slipper, Officer Boot)
// ------------------------------------------------------------------

function createBallerinaPointeShoe(pinkMat: THREE.Material, roseGemMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
  const shoeGroup = new THREE.Group();

  // Ankle Leg Extension with wrapped satin ribbon
  const ankleGeo = new THREE.CylinderGeometry(0.13, 0.115, 0.55, 16);
  const ankle = new THREE.Mesh(ankleGeo, pinkMat);
  ankle.position.y = 0.42;
  ankle.castShadow = true;
  shoeGroup.add(ankle);

  // Crossed Ankle Ribbons
  for (let r = 0; r < 3; r++) {
    const ribbonL = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.012, 6, 16).rotateX(Math.PI / 2.3), goldMat);
    ribbonL.position.y = 0.28 + r * 0.14;
    shoeGroup.add(ribbonL);
  }

  // Ballerina Pointe Box (足尖鞋盒)
  const shoeGeo = new THREE.BoxGeometry(0.2, 0.13, 0.36);
  const shoe = new THREE.Mesh(shoeGeo, pinkMat);
  shoe.position.set(0, 0.065, 0.07);
  shoe.castShadow = true;
  shoeGroup.add(shoe);

  // Front curved satin toe cap with flat pointe block
  const toeBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), pinkMat);
  toeBlock.position.set(0, 0.065, 0.24);
  toeBlock.castShadow = true;
  shoeGroup.add(toeBlock);

  // Little rosette crystal on the vamp
  const rosette = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), roseGemMat);
  rosette.position.set(0, 0.13, 0.14);
  shoeGroup.add(rosette);

  return shoeGroup;
}

function createPrinceBalletSlipper(whiteMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
  const slipperGroup = new THREE.Group();

  // Ankle
  const ankleGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.55, 16);
  const ankle = new THREE.Mesh(ankleGeo, whiteMat);
  ankle.position.y = 0.42;
  ankle.castShadow = true;
  slipperGroup.add(ankle);

  // Gold cuff braid at top of slipper
  const cuffBraid = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.014, 8, 20).rotateX(Math.PI / 2), goldMat);
  cuffBraid.position.y = 0.69;
  slipperGroup.add(cuffBraid);

  // Slipper body
  const footGeo = new THREE.BoxGeometry(0.22, 0.14, 0.36);
  const foot = new THREE.Mesh(footGeo, whiteMat);
  foot.position.set(0, 0.07, 0.07);
  foot.castShadow = true;
  slipperGroup.add(foot);

  // Curved toe
  const toeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.14, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);
  const toe = new THREE.Mesh(toeGeo, whiteMat);
  toe.position.set(0, 0.07, 0.25);
  toe.castShadow = true;
  slipperGroup.add(toe);

  // Crossed instep elastic band
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.16), goldMat);
  band.position.set(0, 0.13, 0.1);
  slipperGroup.add(band);

  return slipperGroup;
}

function createNutcrackerBoot(bootMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
  const bootGroup = new THREE.Group();

  const shaftGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.55, 16);
  const shaft = new THREE.Mesh(shaftGeo, bootMat);
  shaft.position.y = 0.42;
  shaft.castShadow = true;
  bootGroup.add(shaft);

  const cuffTrim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.015, 8, 20).rotateX(Math.PI / 2), goldMat);
  cuffTrim.position.y = 0.69;
  bootGroup.add(cuffTrim);

  const footGeo = new THREE.BoxGeometry(0.24, 0.16, 0.38);
  const foot = new THREE.Mesh(footGeo, bootMat);
  foot.position.set(0, 0.08, 0.08);
  foot.castShadow = true;
  bootGroup.add(foot);

  const toeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12, 1, false, 0, Math.PI);
  toeGeo.rotateZ(Math.PI / 2);
  const toe = new THREE.Mesh(toeGeo, bootMat);
  toe.position.set(0, 0.08, 0.27);
  toe.castShadow = true;
  bootGroup.add(toe);

  const spur = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8).rotateX(Math.PI / 2), goldMat);
  spur.position.set(0, 0.08, -0.15);
  bootGroup.add(spur);

  const spurWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 8).rotateZ(Math.PI / 2), goldMat);
  spurWheel.position.set(0, 0.08, -0.21);
  bootGroup.add(spurWheel);

  return bootGroup;
}

function createEpaulette(goldMat: THREE.Material): THREE.Group {
  const epGroup = new THREE.Group();

  const padGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16);
  padGeo.scale(1.2, 1, 0.8);
  const pad = new THREE.Mesh(padGeo, goldMat);
  pad.castShadow = true;
  epGroup.add(pad);

  for (let f = 0; f < 8; f++) {
    const angle = (f * Math.PI) / 7;
    const fringeGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.18, 6);
    const fringe = new THREE.Mesh(fringeGeo, goldMat);
    fringe.position.set(-0.12 + Math.cos(angle) * 0.08, -0.1, Math.sin(angle) * 0.12 - 0.06);
    fringe.castShadow = true;
    epGroup.add(fringe);
  }

  return epGroup;
}
