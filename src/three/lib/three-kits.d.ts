declare module '../three/lib/rigs/camera-orbit-follow.js' {
  import * as THREE from 'three';
  export interface CameraView {
    position: [number, number, number];
    target: [number, number, number];
  }
  export interface CameraRig {
    controls: any;
    focus: (
      position: [number, number, number],
      distance?: number,
      viewDirection?: [number, number, number] | null,
      followFn?: (() => [number, number, number]) | null
    ) => void;
    setView: (name: string) => boolean;
    reset: () => boolean;
    update: (dt: number) => boolean;
    dispose: () => void;
  }
  export function createCameraRig(options: {
    camera: THREE.PerspectiveCamera;
    canvas: HTMLElement;
    limits: { minPolarDeg: number; maxPolarDeg: number; minDist: number; maxDist: number };
    views: Record<string, CameraView>;
    invalidate?: () => void;
  }): CameraRig;
}

declare module '../three/lib/rigs/lighting-night-lantern.js' {
  import * as THREE from 'three';
  export function createNightLanternRig(
    scene: THREE.Scene,
    options?: Record<string, unknown>
  ): {
    moon: THREE.DirectionalLight;
    fill: THREE.HemisphereLight;
    lanterns: Array<{ mesh: THREE.Mesh; light: THREE.PointLight | null }>;
    createLantern: (position: [number, number, number]) => { mesh: THREE.Mesh; light: THREE.PointLight | null };
    settings: Record<string, any>;
    dispose: () => void;
  };
}

declare module '../three/lib/rigs/lighting-sun.js' {
  import * as THREE from 'three';
  export function createSunRig(
    scene: THREE.Scene,
    options?: Record<string, unknown>
  ): {
    key: THREE.DirectionalLight;
    fill: THREE.HemisphereLight;
    rim: THREE.DirectionalLight | null;
    settings: Record<string, any>;
    dispose: () => void;
  };
}

declare module '../three/lib/rigs/post-stack.js' {
  import * as THREE from 'three';
  export function createPostStack(options: {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    bloom?: { threshold: number; strength: number; radius: number };
    vignette?: number;
    dof?: { focusDistance: number; focusRange: number; bokehScale: number } | null;
    toneMapping?: { mode: 'ACESFilmic' | 'AgX' | 'Neutral'; exposure: number } | null;
  }): {
    composer: any;
    effects: Record<string, any>;
    render: (dt: number) => void;
    setSize: (width: number, height: number) => void;
    dispose: () => void;
  };
}

declare module '../three/lib/viewer-contract.js' {
  import * as THREE from 'three';
  export function installViewer(options: {
    camera: THREE.Camera;
    controls: any;
    views: Record<string, { position: [number, number, number]; target: [number, number, number] }>;
    setView?: (name: string) => void;
    invalidate?: () => void;
  }): { markReady: () => void };
}

declare module '../three/lib/kits/kit-core.js' {
  import * as THREE from 'three';
  export { THREE };
  export function materialFor(color: string, options?: Record<string, any>): THREE.MeshStandardMaterial;
  export function seeded(seed: number): () => number;
  export function bevelledBox(options: {
    width: number;
    height: number;
    depth: number;
    bevel?: number;
    segments?: number;
  }): THREE.ExtrudeGeometry;
  export function part(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position?: [number, number, number],
    rotation?: [number, number, number]
  ): THREE.Mesh;
  export function scatterInstances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    placements: Array<{
      position: [number, number, number];
      rotation?: [number, number, number];
      scale?: number | [number, number, number];
      hue?: number;
    }>
  ): THREE.InstancedMesh;
  export function socket(name: string, position_m: [number, number, number], normal?: [number, number, number]): any;
  export function attach(parentGroup: THREE.Group, sockets: any[], name: string, child: any): THREE.Object3D;
}

declare module '../three/lib/kits/buildings/*.js' {
  import * as THREE from 'three';
  export function create(options?: Record<string, any>): {
    group: THREE.Group;
    sockets: any[];
    colliders: any[];
    animate?: (dt: number) => boolean;
  };
}

declare module '../three/lib/kits/props/*.js' {
  import * as THREE from 'three';
  export function create(options?: Record<string, any>): {
    group: THREE.Group;
    sockets: any[];
    colliders: any[];
    animate?: (dt: number, speed?: number) => boolean;
  };
}

declare module '../three/lib/kits/nature/*.js' {
  import * as THREE from 'three';
  export function create(options?: Record<string, any>): {
    group: THREE.Group;
    sockets: any[];
    colliders: any[];
    animate?: (dt: number) => boolean;
    sway?: (dt: number) => boolean;
    instancing: { geometry: THREE.BufferGeometry; material: THREE.Material; hueJitter: number };
  };
}

declare module '../three/lib/kits/creatures/*.js' {
  import * as THREE from 'three';
  export function create(options?: Record<string, any>): {
    group: THREE.Group;
    sockets: any[];
    colliders: any[];
    animate: (dt: number, override?: number | null) => boolean;
    setRoute: (points: number[][], loop?: boolean) => any;
    state: any;
  };
}
