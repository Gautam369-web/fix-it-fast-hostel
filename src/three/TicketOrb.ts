import * as THREE from 'three';
import type { TicketCategory, TicketPriority } from '../types/domain';

/**
 * TicketOrb: signature glowing liquid-glass orb representing a complaint
 * travelling across The Hostel Quarter. Includes outer refractive glass shell,
 * inner emissive core (category-tinted), and a priority ring.
 */
export class TicketOrb {
  public readonly group = new THREE.Group();
  private shellMesh: THREE.Mesh;
  private coreMesh: THREE.Mesh;
  private ringMesh: THREE.Mesh;
  private toolGroup = new THREE.Group();
  private light: THREE.PointLight;

  constructor() {
    const shellGeo = new THREE.SphereGeometry(0.42, 24, 18);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.72,
      thickness: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.88,
    });
    this.shellMesh = new THREE.Mesh(shellGeo, shellMat);
    this.group.add(this.shellMesh);

    const coreGeo = new THREE.OctahedronGeometry(0.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: '#ffd28a',
      emissive: '#f5b04c',
      emissiveIntensity: 2.4,
      roughness: 0.2,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreMesh);

    const ringGeo = new THREE.TorusGeometry(0.56, 0.035, 10, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#e5e7eb',
      emissive: '#f5b04c',
      emissiveIntensity: 1.4,
      roughness: 0.25,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.rotation.x = Math.PI / 2.4;
    this.group.add(this.ringMesh);

    // Subtle orbiting tool icon (wrench bar) shown during In progress
    const wrenchBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', emissive: '#ffd28a', emissiveIntensity: 1.1 })
    );
    wrenchBar.position.set(0, 0.78, 0);
    this.toolGroup.add(wrenchBar);
    this.toolGroup.visible = false;
    this.group.add(this.toolGroup);

    this.light = new THREE.PointLight('#ffb86b', 10, 7, 2);
    this.group.add(this.light);
  }

  public configure(category: TicketCategory, priority: TicketPriority, isWorking: boolean, isOverdue: boolean): void {
    const coreMat = this.coreMesh.material as THREE.MeshStandardMaterial;
    const ringMat = this.ringMesh.material as THREE.MeshStandardMaterial;

    const catColor =
      category === 'Plumbing'
        ? '#8ecae6'
        : category === 'Electrical'
          ? '#ffd166'
          : category === 'Cleaning'
            ? '#a8dadc'
            : '#e5e7eb';

    coreMat.color.set(catColor);
    coreMat.emissive.set(isOverdue ? '#ff9d3b' : catColor);
    coreMat.emissiveIntensity = isOverdue ? 3.2 : 2.3;

    const ringScale = priority === 'Urgent' ? 1.25 : priority === 'High' ? 1.1 : 0.95;
    this.ringMesh.scale.setScalar(ringScale);
    ringMat.emissive.set(priority === 'Urgent' || isOverdue ? '#ff9d3b' : '#cbd5e1');
    this.toolGroup.visible = isWorking;
  }

  public update(time: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    this.coreMesh.rotation.y = time * 1.4;
    this.coreMesh.rotation.x = Math.sin(time * 0.9) * 0.3;
    this.ringMesh.rotation.z = time * 0.85;
    this.shellMesh.position.y = Math.sin(time * 2.2) * 0.08;
    this.coreMesh.position.y = this.shellMesh.position.y;
    if (this.toolGroup.visible) {
      this.toolGroup.rotation.y = time * 2.6;
    }
  }

  public dispose(): void {
    this.shellMesh.geometry.dispose();
    (this.shellMesh.material as THREE.Material).dispose();
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();
    this.ringMesh.geometry.dispose();
    (this.ringMesh.material as THREE.Material).dispose();
    this.toolGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) ((obj as THREE.Mesh).material as THREE.Material).dispose();
    });
    this.light.dispose();
  }
}
