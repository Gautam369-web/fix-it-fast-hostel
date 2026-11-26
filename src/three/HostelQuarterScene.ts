import * as THREE from 'three';
import { createCameraRig } from './lib/rigs/camera-orbit-follow.js';
type CameraRig = ReturnType<typeof createCameraRig>;
import { createNightLanternRig } from './lib/rigs/lighting-night-lantern.js';
import { createSunRig } from './lib/rigs/lighting-sun.js';
import { createPostStack } from './lib/rigs/post-stack.js';
import { installViewer } from './lib/viewer-contract.js';
import { materialFor, part, scatterInstances, seeded } from './lib/kits/kit-core.js';
import { create as createLongHall } from './lib/kits/buildings/long-hall.js';
import { create as createTimberCottage } from './lib/kits/buildings/timber-cottage.js';
import { create as createRoundTower } from './lib/kits/buildings/round-tower.js';
import { create as createMarketStall } from './lib/kits/buildings/market-stall.js';
import { create as createStoneBridge } from './lib/kits/buildings/stone-bridge.js';
import { create as createLanternPost } from './lib/kits/props/lantern-post.js';
import { create as createSignboard } from './lib/kits/props/signboard.js';
import { create as createWell } from './lib/kits/props/well.js';
import { create as createTreeRound } from './lib/kits/nature/tree-round.js';
import { create as createTreeConifer } from './lib/kits/nature/tree-conifer.js';
import { create as createRockCluster } from './lib/kits/nature/rock-cluster.js';
import { create as createQuadruped } from './lib/kits/creatures/quadruped-walker.js';
import { BUILDINGS, CAMPUS_VIEWS } from './campusData';
import { JourneyPath } from './JourneyPath';
import { TicketOrb } from './TicketOrb';
import type { BuildingId, OrbJourneyState, ThemeMode, Ticket } from '../types/domain';
import { isTicketOverdue } from '../data/mockApi';
import { stationIndexToNormalizedProgress } from '../controllers/AnimationController';

interface BuildingBinding {
  id: BuildingId;
  group: THREE.Group;
  ring: THREE.Mesh;
}

export class HostelQuarterScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private cameraRig: CameraRig;
  private postStack: ReturnType<typeof createPostStack> | null = null;
  private lightRig: { dispose: () => void } | null = null;
  private skyTex: THREE.CanvasTexture | null = null;

  private buildings = new Map<BuildingId, BuildingBinding>();
  private hostelWindowPanes: THREE.Mesh[] = [];
  private clockHandHour: THREE.Mesh | null = null;
  private clockHandMin: THREE.Mesh | null = null;
  private clockBeacon: THREE.Mesh | null = null;
  private gazeboStars: THREE.Mesh[] = [];

  private swayers: Array<(dt: number) => boolean> = [];
  private cats: Array<{ animate: (dt: number) => boolean }> = [];
  private birds: THREE.Group[] = [];
  private fireflies: Array<{ mesh: THREE.Mesh; base: THREE.Vector3; phase: number; radius: number }> = [];
  private mountainLayers: THREE.Mesh[] = [];
  private moonMesh: THREE.Mesh | null = null;

  private journeyPath = new JourneyPath();
  private ticketOrb = new TicketOrb();
  private orbCurrentT = 0.05;
  private orbTargetT = 0.05;
  private orbIsWorking = false;
  private orbIsOverdue = false;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hoveredBuilding: BuildingId | null = null;

  private theme: ThemeMode;
  private reducedMotion: boolean;
  private activeBuilding: BuildingId | null = null;
  private onSelectBuilding: (id: BuildingId) => void;
  private onHoverBuilding?: (id: BuildingId | null) => void;

  private rafId: number | null = null;
  private lastTs = 0;
  private elapsed = 0;
  private dirty = true;
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    options: {
      theme: ThemeMode;
      reducedMotion: boolean;
      onSelectBuilding: (id: BuildingId) => void;
      onHoverBuilding?: (id: BuildingId | null) => void;
    }
  ) {
    this.theme = options.theme;
    this.reducedMotion = options.reducedMotion;
    this.onSelectBuilding = options.onSelectBuilding;
    this.onHoverBuilding = options.onHoverBuilding;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.theme === 'obsidian' ? 1.05 : 0.92;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 280);

    const invalidate = () => {
      this.dirty = true;
    };

    this.cameraRig = createCameraRig({
      camera: this.camera,
      canvas,
      limits: { minPolarDeg: 28, maxPolarDeg: 82, minDist: 7, maxDist: 42 },
      views: CAMPUS_VIEWS,
      invalidate,
    });

    installViewer({
      camera: this.camera,
      controls: this.cameraRig.controls,
      views: CAMPUS_VIEWS,
      setView: this.cameraRig.setView,
      invalidate,
    });

    this.buildValleyBackdrop();
    this.buildTerrainAndPaths();
    this.buildBuildings();
    this.buildNatureAndProps();
    this.buildCreatures();

    this.scene.add(this.journeyPath.group);
    this.scene.add(this.ticketOrb.group);
    this.ticketOrb.group.position.copy(this.journeyPath.getPointAt(0.05));

    this.applyThemeLighting(this.theme);

    this.postStack = createPostStack({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      bloom: { threshold: 1.05, strength: 0.34, radius: 0.65 },
      vignette: 0.24,
      toneMapping: { mode: 'ACESFilmic', exposure: this.theme === 'obsidian' ? 1.05 : 0.92 },
    });

    this.cameraRig.reset();
    this.bindEvents();
    this.handleResize();
    this.startLoop();
  }

  private createGradientSky(zenith: string, horizon: string): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, zenith);
    grad.addColorStop(0.7, horizon);
    grad.addColorStop(1, horizon);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildValleyBackdrop(): void {
    const rand = seeded(202611);
    // Layered mountain silhouettes around the Twilight Valley perimeter
    const rings = [
      { radius: 75, count: 16, height: 18, color: '#1a2338' },
      { radius: 96, count: 20, height: 28, color: '#141c2e' },
      { radius: 118, count: 22, height: 38, color: '#0f1625' },
    ];
    rings.forEach((ring, rIdx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: ring.color,
        roughness: 0.95,
        flatShading: true,
      });
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + rIdx * 0.2;
        const h = ring.height * (0.7 + rand() * 0.6);
        const w = 16 + rand() * 14;
        const cone = new THREE.ConeGeometry(w, h, 5);
        const mesh = new THREE.Mesh(cone, mat);
        mesh.position.set(Math.cos(a) * ring.radius, h * 0.35 - 3, Math.sin(a) * ring.radius);
        mesh.rotation.y = rand() * Math.PI;
        this.scene.add(mesh);
        this.mountainLayers.push(mesh);
      }
    });

    // Soft low moon / dawn disc
    const moonGeo = new THREE.SphereGeometry(4.2, 24, 18);
    const moonMat = new THREE.MeshStandardMaterial({
      color: '#eef2ff',
      emissive: '#ffd9a8',
      emissiveIntensity: 1.35,
      roughness: 0.4,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(-28, 22, -68);
    this.scene.add(this.moonMesh);
  }

  private buildTerrainAndPaths(): void {
    const groundGeo = new THREE.CircleGeometry(65, 64);
    const groundMat = materialFor('#1d2433', { roughness: 0.94 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Central twilight stone plaza + radial walkways connecting the 8 buildings
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.5, 0.08, 32),
      materialFor('#343c4d', { roughness: 0.88 })
    );
    plaza.position.set(0, 0.04, 1.5);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    const pathMat = materialFor('#2b3242', { roughness: 0.92 });
    Object.values(BUILDINGS).forEach((b) => {
      const target = new THREE.Vector3(b.position[0], 0, b.position[2]);
      const origin = new THREE.Vector3(0, 0, 1.5);
      const len = origin.distanceTo(target);
      const mid = origin.clone().lerp(target, 0.5);
      const angle = Math.atan2(target.x - origin.x, target.z - origin.z);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, len), pathMat);
      strip.position.set(mid.x, 0.025, mid.z);
      strip.rotation.y = angle;
      strip.receiveShadow = true;
      this.scene.add(strip);
    });
  }

  private registerBuilding(id: BuildingId, group: THREE.Group, ringRadius = 3.2): void {
    const meta = BUILDINGS[id];
    group.position.set(meta.position[0], 0, meta.position[2]);
    group.userData.buildingId = id;
    group.traverse((child) => {
      child.userData.buildingId = id;
    });

    const ringGeo = new THREE.RingGeometry(ringRadius - 0.14, ringRadius, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#e6aa54',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.14,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(meta.position[0], 0.06, meta.position[2]);
    this.scene.add(ring);
    this.scene.add(group);
    this.buildings.set(id, { id, group, ring });
  }

  private buildBuildings(): void {
    // 1. Hostel Block (3dviz-pro-max long-hall + live room window panes)
    const hostel = createLongHall({ width: 10.5, depth: 5.2, wallHeight: 3.2, bayCount: 5, seed: 12 });
    hostel.group.rotation.y = 0.28;
    // Add 6 clickable/live indicator windows along upper facade
    for (let i = 0; i < 6; i++) {
      const paneMat = new THREE.MeshStandardMaterial({
        color: '#2b353b',
        emissive: '#ffb347',
        emissiveIntensity: i < 3 ? 1.8 : 0.08,
        roughness: 0.25,
      });
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.96, 0.12), paneMat);
      pane.position.set(-3.75 + i * 1.5, 2.0, 2.66);
      hostel.group.add(pane);
      this.hostelWindowPanes.push(pane);
    }
    this.registerBuilding('hostel_block', hostel.group, 5.4);

    // 2. Notice Board Tower (signboard + timber plinth)
    const notice = new THREE.Group();
    const boardA = createSignboard({ height: 2.8, boardWidth: 1.35, boardHeight: 0.9, seed: 21 });
    boardA.group.position.set(-0.4, 0, 0);
    const boardB = createSignboard({ height: 2.3, boardWidth: 1.0, boardHeight: 0.65, seed: 22 });
    boardB.group.position.set(0.75, 0, 0.2);
    boardB.group.rotation.y = -0.35;
    notice.add(boardA.group, boardB.group);
    this.registerBuilding('notice_board', notice, 2.2);

    // 3. Warden's Office (3dviz-pro-max timber-cottage 2-storey)
    const warden = createTimberCottage({ width: 5.2, depth: 4.0, storeys: 2, seed: 34 });
    warden.group.rotation.y = -0.45;
    this.registerBuilding('wardens_office', warden.group, 3.8);

    // 4. Workshop (3dviz-pro-max timber-cottage 1-storey)
    const workshop = createTimberCottage({ width: 5.6, depth: 3.8, storeys: 1, seed: 47 });
    workshop.group.rotation.y = -0.6;
    this.registerBuilding('workshop', workshop.group, 3.8);

    // 5. Utility Yard (3dviz-pro-max market-stall with 3 category zone beacons)
    const yard = createMarketStall({ width: 4.0, depth: 2.4, height: 2.5, stripes: 6, seed: 55 });
    const zoneColors = ['#7cc6e8', '#ffd166', '#9ae6b4'];
    zoneColors.forEach((col, i) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 10),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.6 })
      );
      orb.position.set(-1.1 + i * 1.1, 1.35, 0.8);
      yard.group.add(orb);
    });
    this.registerBuilding('utility_yard', yard.group, 2.9);

    // 6. Clock Tower (3dviz-pro-max round-tower + clock face + moving hands + overdue beacon)
    const tower = createRoundTower({ height: 8.4, baseRadius: 2.3, topRadius: 1.8, seed: 68 });
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#fde68a', emissiveIntensity: 0.75 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 6.4, 1.9);
    tower.group.add(clockFace);

    this.clockHandHour = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.42, 0.05),
      materialFor('#1e293b', { roughness: 0.4 })
    );
    this.clockHandHour.position.set(0, 6.4, 2.02);
    tower.group.add(this.clockHandHour);

    this.clockHandMin = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.58, 0.05),
      materialFor('#b45309', { roughness: 0.35 })
    );
    this.clockHandMin.position.set(0, 6.4, 2.05);
    tower.group.add(this.clockHandMin);

    this.clockBeacon = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.09, 10, 32),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#ff9d3b', emissiveIntensity: 2.2 })
    );
    this.clockBeacon.rotation.x = Math.PI / 2;
    this.clockBeacon.position.set(0, 8.85, 0);
    tower.group.add(this.clockBeacon);

    this.registerBuilding('clock_tower', tower.group, 3.6);

    // 7. Feedback Gazebo (3dviz-pro-max well pavilion + 5 floating glass star crystals)
    const gazebo = createWell({ radius: 1.15, postHeight: 1.9, seed: 73 });
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        new THREE.MeshStandardMaterial({ color: '#fde68a', emissive: '#f5b04c', emissiveIntensity: 1.7 })
      );
      const a = (i / 5) * Math.PI * 2;
      star.position.set(Math.cos(a) * 1.45, 2.35, Math.sin(a) * 1.45);
      gazebo.group.add(star);
      this.gazeboStars.push(star);
    }
    this.registerBuilding('feedback_gazebo', gazebo.group, 2.7);

    // 8. Main Gate (3dviz-pro-max stone-bridge arch + lanterns)
    const gate = createStoneBridge({ span: 4.4, width: 2.2, seed: 89 });
    this.registerBuilding('main_gate', gate.group, 3.2);
  }

  private buildNatureAndProps(): void {
    const rand = seeded(904);
    const treePositions: Array<[number, number, boolean]> = [
      [-14, -9, true],
      [-13, 3, false],
      [-12, 11, true],
      [13, -8, false],
      [14, 2, true],
      [12, 11, false],
      [-5, -13, true],
      [6, -13, false],
      [-6, 13, false],
      [7, 13, true],
    ];
    treePositions.forEach(([x, z, conifer], idx) => {
      const tree = conifer
        ? createTreeConifer({ seed: 100 + idx, height: 4.2 + rand() * 1.1, needle: '#374b43' })
        : createTreeRound({ seed: 200 + idx, height: 3.3 + rand() * 0.8, leaf: '#47594a' });
      tree.group.position.set(x, 0, z);
      this.scene.add(tree.group);
      if (tree.animate) this.swayers.push(tree.animate);
    });

    const rocks = createRockCluster({ count: 7, spread: 1.5, seed: 301, rock: '#525866' });
    rocks.group.position.set(-4.8, 0, -9.2);
    this.scene.add(rocks.group);

    // 6 Wrought-iron campus lantern posts
    const lanternSpots: Array<[number, number, number]> = [
      [-4.2, 0, 0.5],
      [4.2, 0, 0.5],
      [-3.5, 0, -5.8],
      [3.5, 0, -5.8],
      [-2.8, 0, 8.5],
      [2.8, 0, 8.5],
    ];
    lanternSpots.forEach((pos, idx) => {
      const post = createLanternPost({ height: 2.8, seed: 400 + idx });
      post.group.position.set(pos[0], 0, pos[2]);
      post.group.rotation.y = pos[0] < 0 ? 0.4 : Math.PI - 0.4;
      this.scene.add(post.group);
    });

    // Fireflies orbiting near the campus buildings
    const flyGeo = new THREE.SphereGeometry(0.07, 8, 6);
    const flyMat = new THREE.MeshStandardMaterial({
      color: '#ffe4a8',
      emissive: '#ffb454',
      emissiveIntensity: 3.0,
    });
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(flyGeo, flyMat);
      const base = new THREE.Vector3((rand() - 0.5) * 18, 1.4 + rand() * 2.2, (rand() - 0.5) * 16);
      mesh.position.copy(base);
      this.scene.add(mesh);
      this.fireflies.push({ mesh, base, phase: rand() * Math.PI * 2, radius: 0.6 + rand() * 1.1 });
    }
  }

  private buildCreatures(): void {
    // Creature 1 & 2: Two campus cats (quadruped-walker scaled down) patrolling paths
    const catA = createQuadruped({ scale: 0.42, strideHz: 1.4, seed: 501, coat: '#c2a684' });
    catA.setRoute(
      [
        [-5, 2],
        [0, 3.5],
        [4.5, 1.5],
        [1, -2.5],
      ],
      true
    );
    this.scene.add(catA.group);
    this.cats.push(catA);

    const catB = createQuadruped({ scale: 0.38, strideHz: 1.3, seed: 502, coat: '#6e7380' });
    catB.setRoute(
      [
        [-6, 6],
        [-2, 8],
        [3.5, 6.5],
        [-1, 4.5],
      ],
      true
    );
    this.scene.add(catB.group);
    this.cats.push(catB);

    // Creature 3: Birds / Maintenance Drone circling the Clock Tower
    const birdMat = materialFor('#cbd5e1', { roughness: 0.4 });
    for (let i = 0; i < 3; i++) {
      const bird = new THREE.Group();
      const body = part(new THREE.ConeGeometry(0.11, 0.38, 6), birdMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
      const wingL = part(new THREE.BoxGeometry(0.45, 0.03, 0.14), birdMat, [-0.22, 0, 0]);
      const wingR = part(new THREE.BoxGeometry(0.45, 0.03, 0.14), birdMat, [0.22, 0, 0]);
      bird.add(body, wingL, wingR);
      bird.userData = { angle: (i / 3) * Math.PI * 2, radius: 3.4 + i * 0.55, y: 9.6 + i * 0.45 };
      this.scene.add(bird);
      this.birds.push(bird);
    }
  }

  public setTheme(theme: ThemeMode): void {
    if (this.theme === theme) return;
    this.theme = theme;
    this.applyThemeLighting(theme);
    this.dirty = true;
  }

  private applyThemeLighting(theme: ThemeMode): void {
    this.lightRig?.dispose();
    this.skyTex?.dispose();

    if (theme === 'obsidian') {
      this.skyTex = this.createGradientSky('#080d1a', '#1c243a');
      this.scene.background = this.skyTex;
      this.scene.fog = new THREE.FogExp2('#151c2e', 0.017);
      const night = createNightLanternRig(this.scene, {
        moonColor: '#9fb4ff',
        moonIntensity: 0.42,
        skyColor: '#1a2744',
        groundColor: '#1f1916',
        fillIntensity: 0.32,
        lanternColor: '#ffb46b',
        lanternIntensity: 55,
      });
      // Place warm lantern practicals around the campus plaza
      night.createLantern([-4.2, 0, 0.5]);
      night.createLantern([4.2, 0, 0.5]);
      night.createLantern([0, 0, -5.5]);
      night.createLantern([0, 0, 7.2]);
      this.lightRig = night;
      this.renderer.toneMappingExposure = 1.05;
      if (this.moonMesh) {
        (this.moonMesh.material as THREE.MeshStandardMaterial).emissive.set('#ffd9a8');
      }
    } else {
      this.skyTex = this.createGradientSky('#c4d2e8', '#f2e8dc');
      this.scene.background = this.skyTex;
      this.scene.fog = new THREE.FogExp2('#dde4ef', 0.015);
      this.lightRig = createSunRig(this.scene, {
        color: '#ffe0bd',
        intensity: 2.3,
        elevationDeg: 18,
        azimuthDeg: 230,
        skyColor: '#dbe6f5',
        groundColor: '#8d877e',
        fillIntensity: 0.85,
      });
      this.renderer.toneMappingExposure = 0.92;
      if (this.moonMesh) {
        (this.moonMesh.material as THREE.MeshStandardMaterial).emissive.set('#fff3db');
      }
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public focusBuilding(id: BuildingId | null): void {
    this.activeBuilding = id;
    if (!id) {
      this.cameraRig.reset();
      return;
    }
    const meta = BUILDINGS[id];
    // JSDoc in camera-orbit-follow.js defaults viewDirection to null, so TS infers null|undefined
    (this.cameraRig.focus as (pos: number[], dist?: number, dir?: number[] | null) => void)(
      meta.position,
      meta.focusDistance,
      meta.viewDirection
    );
    this.dirty = true;
  }

  public syncTickets(tickets: Ticket[]): void {
    const activeCount = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length;
    const overdueCount = tickets.filter((t) => isTicketOverdue(t)).length;

    // Light amber windows proportionally to open tickets; dim when resolved
    this.hostelWindowPanes.forEach((pane, idx) => {
      const mat = pane.material as THREE.MeshStandardMaterial;
      const lit = idx < Math.max(1, Math.min(this.hostelWindowPanes.length, activeCount));
      mat.emissive.set(lit ? '#ffb347' : '#263040');
      mat.emissiveIntensity = lit ? 2.1 : 0.08;
    });

    // Clock Tower overdue beacon
    if (this.clockBeacon) {
      const mat = this.clockBeacon.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = overdueCount > 0 ? 2.6 : 0.35;
      mat.color.set(overdueCount > 0 ? '#ff9d3b' : '#64748b');
    }

    this.dirty = true;
  }

  public syncOrbJourney(journey: OrbJourneyState): void {
    const progress =
      typeof journey.scrubProgress === 'number'
        ? journey.scrubProgress
        : stationIndexToNormalizedProgress(journey.stationIndex);
    this.orbTargetT = progress;
    if (this.reducedMotion || typeof journey.scrubProgress === 'number') {
      this.orbCurrentT = progress;
      this.ticketOrb.group.position.copy(this.journeyPath.getPointAt(progress));
      this.journeyPath.updateTrail(progress, journey.isOverdue);
    }
    this.orbIsWorking = journey.status === 'In progress';
    this.orbIsOverdue = journey.isOverdue;
    this.ticketOrb.configure(journey.category, journey.priority, this.orbIsWorking, this.orbIsOverdue);
    this.dirty = true;
  }

  private bindEvents(): void {
    const onPointerMove = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const groups = Array.from(this.buildings.values()).map((b) => b.group);
      const hits = this.raycaster.intersectObjects(groups, true);
      const hitId = (hits[0]?.object?.userData?.buildingId as BuildingId | undefined) ?? null;

      if (hitId !== this.hoveredBuilding) {
        this.hoveredBuilding = hitId;
        this.canvas.style.cursor = hitId ? 'pointer' : 'grab';
        this.onHoverBuilding?.(hitId);
        this.dirty = true;
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const groups = Array.from(this.buildings.values()).map((b) => b.group);
      const hits = this.raycaster.intersectObjects(groups, true);
      const hitId = (hits[0]?.object?.userData?.buildingId as BuildingId | undefined) ?? null;
      if (hitId) {
        this.onSelectBuilding(hitId);
      }
    };

    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('click', onClick);
    window.addEventListener('resize', this.handleResize);

    (this as any)._unbindEvents = () => {
      this.canvas.removeEventListener('pointermove', onPointerMove);
      this.canvas.removeEventListener('click', onClick);
      window.removeEventListener('resize', this.handleResize);
    };
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const parent = this.canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.postStack?.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  };

  private startLoop(): void {
    const tick = (ts: number) => {
      if (this.disposed) return;
      this.rafId = requestAnimationFrame(tick);

      const dt = this.lastTs ? Math.min((ts - this.lastTs) / 1000, 0.05) : 0.016;
      this.lastTs = ts;

      const activeDt = this.reducedMotion ? 0 : dt;
      this.elapsed += activeDt;

      // Update trees, cats, birds, fireflies, clock hands
      if (activeDt > 0) {
        for (const sway of this.swayers) sway(activeDt);
        for (const cat of this.cats) cat.animate(activeDt);

        this.birds.forEach((bird, idx) => {
          const ud = bird.userData;
          const a = ud.angle + this.elapsed * (0.55 + idx * 0.08);
          const towerPos = BUILDINGS.clock_tower.position;
          bird.position.set(
            towerPos[0] + Math.cos(a) * ud.radius,
            ud.y + Math.sin(this.elapsed * 2 + idx) * 0.25,
            towerPos[2] + Math.sin(a) * ud.radius
          );
          bird.rotation.y = -a;
          const flap = Math.sin(this.elapsed * 9 + idx) * 0.35;
          if (bird.children[1]) bird.children[1].rotation.z = flap;
          if (bird.children[2]) bird.children[2].rotation.z = -flap;
        });

        // Orbit fireflies near active building or campus center
        const anchor = this.activeBuilding ? BUILDINGS[this.activeBuilding].position : [0, 1.5, 0];
        this.fireflies.forEach((f, idx) => {
          const targetBase = idx < 6 ? new THREE.Vector3(anchor[0], 1.8, anchor[2]) : f.base;
          f.mesh.position.set(
            targetBase.x + Math.cos(this.elapsed * 0.8 + f.phase) * f.radius,
            targetBase.y + Math.sin(this.elapsed * 1.3 + f.phase) * 0.35,
            targetBase.z + Math.sin(this.elapsed * 0.7 + f.phase) * f.radius
          );
        });

        if (this.clockHandMin) this.clockHandMin.rotation.z = -this.elapsed * 0.35;
        if (this.clockHandHour) this.clockHandHour.rotation.z = -this.elapsed * 0.04;

        this.gazeboStars.forEach((s, i) => {
          s.rotation.y = this.elapsed * 1.1 + i;
          s.position.y = 2.35 + Math.sin(this.elapsed * 1.8 + i) * 0.08;
        });

        // Smooth TicketOrb CatmullRom path travel
        if (Math.abs(this.orbTargetT - this.orbCurrentT) > 0.002) {
          const diff = this.orbTargetT - this.orbCurrentT;
          this.orbCurrentT += diff * Math.min(1, activeDt * 2.4);
          this.ticketOrb.group.position.copy(this.journeyPath.getPointAt(this.orbCurrentT));
          this.journeyPath.updateTrail(this.orbCurrentT, this.orbIsOverdue);
        }
        this.ticketOrb.update(this.elapsed, false);

        // Building selection/hover highlight rings
        this.buildings.forEach((b, id) => {
          const mat = b.ring.material as THREE.MeshBasicMaterial;
          const highlighted = id === this.activeBuilding || id === this.hoveredBuilding;
          mat.opacity = highlighted ? 0.65 : id === 'clock_tower' && this.orbIsOverdue ? 0.45 : 0.12;
        });
      }

      const camMoved = this.cameraRig.update(dt);
      if (activeDt > 0 || camMoved || this.dirty) {
        this.dirty = false;
        if (this.postStack) this.postStack.render(dt);
        else this.renderer.render(this.scene, this.camera);
        (window as any).__sceneReady = true;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public dispose(): void {
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    (this as any)._unbindEvents?.();
    this.journeyPath.dispose();
    this.ticketOrb.dispose();
    this.postStack?.dispose();
    this.cameraRig.dispose();
    this.lightRig?.dispose();
    this.skyTex?.dispose();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    });
    this.renderer.dispose();
  }
}
