import * as THREE from 'three';
import { BUILDINGS } from './campusData';

/**
 * JourneyPath builds the 3D CatmullRomCurve3 spline across the Hostel Quarter
 * stations (Hostel Block -> Warden's Office -> Workshop -> Utility Yard ->
 * Hostel Block -> Feedback Gazebo) plus a dotted preview path and TubeGeometry trail.
 */
export class JourneyPath {
  public readonly group = new THREE.Group();
  public readonly mainCurve: THREE.CatmullRomCurve3;
  private trailMesh: THREE.Mesh | null = null;
  private trailMat: THREE.MeshStandardMaterial;
  private dottedLine: THREE.Line;
  private lastTrailProgress = -1;

  constructor() {
    const pts = [
      new THREE.Vector3(...BUILDINGS.hostel_block.position).add(new THREE.Vector3(0, 1.5, 1.2)),
      new THREE.Vector3(...BUILDINGS.wardens_office.position).add(new THREE.Vector3(0, 1.8, 0.6)),
      new THREE.Vector3(...BUILDINGS.workshop.position).add(new THREE.Vector3(0, 1.6, 0)),
      new THREE.Vector3(...BUILDINGS.utility_yard.position).add(new THREE.Vector3(0, 1.5, 0)),
      new THREE.Vector3(...BUILDINGS.hostel_block.position).add(new THREE.Vector3(1.2, 2.2, 1.8)),
      new THREE.Vector3(...BUILDINGS.feedback_gazebo.position).add(new THREE.Vector3(0, 1.6, 0)),
    ];
    this.mainCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.45);

    this.trailMat = new THREE.MeshStandardMaterial({
      color: '#ffd28a',
      emissive: '#f5b04c',
      emissiveIntensity: 1.9,
      roughness: 0.25,
      transparent: true,
      opacity: 0.72,
    });

    const sampled = this.mainCurve.getPoints(90);
    const dottedGeo = new THREE.BufferGeometry().setFromPoints(sampled);
    const dottedMat = new THREE.LineDashedMaterial({
      color: '#cbd5e1',
      dashSize: 0.45,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.35,
    });
    this.dottedLine = new THREE.Line(dottedGeo, dottedMat);
    this.dottedLine.computeLineDistances();
    this.group.add(this.dottedLine);
  }

  public getPointAt(t: number): THREE.Vector3 {
    const clamped = Math.max(0.001, Math.min(0.999, t));
    return this.mainCurve.getPointAt(clamped);
  }

  public updateTrail(progress: number, isOverdue: boolean): void {
    const clamped = Math.max(0.02, Math.min(1, progress));
    if (Math.abs(clamped - this.lastTrailProgress) < 0.015 && this.trailMesh) {
      this.trailMat.emissive.set(isOverdue ? '#ff9d3b' : '#f5b04c');
      return;
    }
    this.lastTrailProgress = clamped;

    if (this.trailMesh) {
      this.trailMesh.geometry.dispose();
      this.group.remove(this.trailMesh);
      this.trailMesh = null;
    }

    const subPoints: THREE.Vector3[] = [];
    const steps = Math.max(8, Math.round(clamped * 42));
    for (let i = 0; i <= steps; i++) {
      subPoints.push(this.mainCurve.getPointAt((i / steps) * clamped));
    }
    const subCurve = new THREE.CatmullRomCurve3(subPoints);
    const geo = new THREE.TubeGeometry(subCurve, steps * 2, 0.06, 8, false);
    this.trailMat.emissive.set(isOverdue ? '#ff9d3b' : '#f5b04c');
    this.trailMesh = new THREE.Mesh(geo, this.trailMat);
    this.group.add(this.trailMesh);
  }

  public dispose(): void {
    if (this.trailMesh) this.trailMesh.geometry.dispose();
    this.trailMat.dispose();
    this.dottedLine.geometry.dispose();
    (this.dottedLine.material as THREE.Material).dispose();
  }
}
