"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface ThreeLotusProps {
  className?: string;
  size?: number;
  speed?: number;
  autoBloom?: boolean;
  showParticles?: boolean;
}

export function ThreeLotus({
  className = "",
  size = 360,
  speed = 1.0,
  autoBloom = true,
  showParticles = true,
}: ThreeLotusProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene, Camera, Renderer ---
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    const scene = new THREE.Scene();

    // 3/4 perspective camera angle (elevation ~24 degrees)
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 1.9, 5.2);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. Studio Lighting Rig ---
    // Warm sunlight key light
    const keyLight = new THREE.DirectionalLight(0xfffaee, 3.6);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    // Cool blush fill light
    const fillLight = new THREE.DirectionalLight(0xffd5dc, 2.2);
    fillLight.position.set(-5, 4, 2);
    scene.add(fillLight);

    // Rim backlight for specular highlights on gold rims
    const rimLight = new THREE.DirectionalLight(0xfff7ea, 3.5);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    // Golden underlight for core glow
    const coreLight = new THREE.PointLight(0xffd700, 2.4, 5);
    coreLight.position.set(0, 0.4, 0);
    scene.add(coreLight);

    // Soft ambient fill
    const ambientLight = new THREE.AmbientLight(0xffedf0, 1.2);
    scene.add(ambientLight);

    // --- 3. Materials ---
    // Solid 24K Polished Gold Material
    const goldRimMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5cf66,
      roughness: 0.18,
      metalness: 0.92,
      emissive: 0x3d2700,
    });

    const goldCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb038,
      roughness: 0.28,
      metalness: 0.8,
      emissive: 0x422d05,
    });

    // High-Resolution Smooth Blush Gradient Texture for Petals (Opaque)
    function createPorcelainGradient(): THREE.CanvasTexture {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;

      // Vertical smooth luxury gradient
      const grad = ctx.createLinearGradient(0, 512, 0, 0);
      grad.addColorStop(0.0, "#FFFFFF"); // Pure ivory root
      grad.addColorStop(0.2, "#FDE4EB"); // Softest blush
      grad.addColorStop(0.55, "#F799AE"); // Radiant lotus pink
      grad.addColorStop(0.85, "#E26482"); // Rich rose petal
      grad.addColorStop(1.0, "#D04868"); // Deep tip blush
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 512);

      // Subtle center spine highlight
      const spineGrad = ctx.createLinearGradient(128, 512, 128, 0);
      spineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.5)");
      spineGrad.addColorStop(0.7, "rgba(255, 255, 255, 0.15)");
      spineGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = spineGrad;
      ctx.fillRect(116, 0, 24, 512);

      const tex = new THREE.CanvasTexture(canvas);
      tex.generateMipmaps = true;
      return tex;
    }

    const porcelainMap = createPorcelainGradient();

    // Solid Opaque Porcelain Material (NO transparency artifacts!)
    const petalPorcelainMaterial = new THREE.MeshPhysicalMaterial({
      map: porcelainMap,
      roughness: 0.26,
      metalness: 0.08,
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
      reflectivity: 0.75,
      side: THREE.DoubleSide,
    });

    // --- 4. Parametric 3D Solid Petal Geometry with True 3D Gold Rim Tube ---
    function createSolidPetal(width: number, height: number, cupDepth: number, archBack: number) {
      const group = new THREE.Group();

      // Define 2D Lotus Petal Contour Shape
      const halfW = width * 0.5;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0); // Root base
      // Left contour curve: expands wide in the middle, then tapers to pointed apex
      shape.bezierCurveTo(-halfW * 0.8, height * 0.2, -halfW, height * 0.55, 0, height);
      // Right contour curve: from apex back down to root base
      shape.bezierCurveTo(halfW, height * 0.55, halfW * 0.8, height * 0.2, 0, 0);

      // Create Mesh from shape with high subdivision
      const shapeGeo = new THREE.ShapeGeometry(shape, 32);
      const pos = shapeGeo.attributes.position;

      // Deform flat 2D shape vertices into 3D curved bowl cup
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const v = Math.max(0, Math.min(1, y / height)); // 0 to 1

        // Horizontal cup curvature: deep hollow bowl
        const maxSpanAtY = halfW * Math.sin(Math.PI * Math.min(1, v * 1.05));
        const normX = maxSpanAtY > 0.01 ? Math.max(-1, Math.min(1, x / maxSpanAtY)) : 0;
        const zCup = -cupDepth * Math.sin(Math.PI * v) * (1 - normX * normX);

        // Longitudinal spine arch: curves outward, tips curl gently backward
        const zArch = Math.sin(v * Math.PI * 0.85) * archBack - Math.pow(v, 2.2) * (archBack * 0.45);

        pos.setZ(i, zCup + zArch);
      }
      shapeGeo.computeVertexNormals();

      // UV mapping for vertical gradient
      const uvs = shapeGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        uvs.setXY(i, (x / width) + 0.5, y / height);
      }
      shapeGeo.uvsNeedUpdate = true;

      const petalMesh = new THREE.Mesh(shapeGeo, petalPorcelainMaterial);
      petalMesh.castShadow = true;
      petalMesh.receiveShadow = true;
      group.add(petalMesh);

      // --- Build 3D Solid Gold Rim Tube along the perimeter ---
      const rimPoints2D = shape.getPoints(54);
      const rimPoints3D: THREE.Vector3[] = [];

      for (let p of rimPoints2D) {
        const v = Math.max(0, Math.min(1, p.y / height));
        const maxSpanAtY = halfW * Math.sin(Math.PI * Math.min(1, v * 1.05));
        const normX = maxSpanAtY > 0.01 ? Math.max(-1, Math.min(1, p.x / maxSpanAtY)) : 0;
        const zCup = -cupDepth * Math.sin(Math.PI * v) * (1 - normX * normX);
        const zArch = Math.sin(v * Math.PI * 0.85) * archBack - Math.pow(v, 2.2) * (archBack * 0.45);

        // Slightly offset rim in Z so it sits boldly on the edge
        rimPoints3D.push(new THREE.Vector3(p.x, p.y, zCup + zArch + 0.01));
      }

      const rimCurve = new THREE.CatmullRomCurve3(rimPoints3D, true);
      const tubeGeo = new THREE.TubeGeometry(rimCurve, 64, 0.024, 8, true);
      const tubeMesh = new THREE.Mesh(tubeGeo, goldRimMaterial);
      group.add(tubeMesh);

      return group;
    }

    // --- 5. Lotus Structure Assembly ---
    const lotusGroup = new THREE.Group();
    scene.add(lotusGroup);

    // Golden Receptacle Seed Pod
    const podGroup = new THREE.Group();
    const podGeo = new THREE.CylinderGeometry(0.38, 0.22, 0.26, 32);
    const podMesh = new THREE.Mesh(podGeo, goldCoreMaterial);
    podMesh.position.y = 0.16;
    podGroup.add(podMesh);

    // Domed top of seed pod
    const domeGeo = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.35);
    const domeMesh = new THREE.Mesh(domeGeo, goldCoreMaterial);
    domeMesh.position.y = 0.19;
    podGroup.add(domeMesh);

    // Golden Seeds
    const seedGeo = new THREE.SphereGeometry(0.045, 12, 12);
    for (let s = 0; s < 9; s++) {
      const angle = (s / 9) * Math.PI * 2;
      const rad = 0.23;
      const seed = new THREE.Mesh(seedGeo, goldRimMaterial);
      seed.position.set(Math.cos(angle) * rad, 0.34, Math.sin(angle) * rad);
      podGroup.add(seed);
    }
    const centerSeed = new THREE.Mesh(seedGeo, goldRimMaterial);
    centerSeed.position.set(0, 0.36, 0);
    podGroup.add(centerSeed);

    // Golden Stamens Ring
    const stamenCount = 28;
    const stamenGroup = new THREE.Group();
    for (let st = 0; st < stamenCount; st++) {
      const stAngle = (st / stamenCount) * Math.PI * 2;
      const rInner = 0.44;
      const rOuter = 0.58;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(stAngle) * rInner, 0.12, Math.sin(stAngle) * rInner),
        new THREE.Vector3(Math.cos(stAngle) * (rInner + 0.08), 0.32, Math.sin(stAngle) * (rInner + 0.08)),
        new THREE.Vector3(Math.cos(stAngle) * rOuter, 0.44, Math.sin(stAngle) * rOuter),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.018, 6, false);
      const stMesh = new THREE.Mesh(tubeGeo, goldRimMaterial);
      stamenGroup.add(stMesh);

      // Golden Tip Anther
      const anther = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), goldRimMaterial);
      anther.position.set(Math.cos(stAngle) * rOuter, 0.46, Math.sin(stAngle) * rOuter);
      stamenGroup.add(anther);
    }
    podGroup.add(stamenGroup);
    lotusGroup.add(podGroup);

    // --- Petal Layers Configuration ---
    // Concentric chalice layers matching lotus-bloom.png
    interface PetalAnimInfo {
      hinge: THREE.Group;
      baseAngle: number;
      targetAngle: number;
      currentAngle: number;
    }

    const petalAnimList: PetalAnimInfo[] = [];

    const layerDefs = [
      // Layer 0: Inner Core Petals (tight chalice, upright, 4 petals)
      { count: 4, w: 1.1, h: 1.5, cup: 0.4, arch: 0.3, angleDeg: 26, rad: 0.28, y: 0.1 },
      // Layer 1: Mid-Inner Petals (cupped gracefully, 5 petals)
      { count: 5, w: 1.35, h: 1.85, cup: 0.46, arch: 0.45, angleDeg: 42, rad: 0.38, y: 0.06 },
      // Layer 2: Main Blooming Petals (broad lotus petals, 6 petals)
      { count: 6, w: 1.55, h: 2.2, cup: 0.52, arch: 0.6, angleDeg: 58, rad: 0.48, y: 0.02 },
      // Layer 3: Outer Supporting Petals (gracefully flared, 6 petals)
      { count: 6, w: 1.65, h: 2.3, cup: 0.54, arch: 0.75, angleDeg: 74, rad: 0.56, y: -0.04 },
    ];

    layerDefs.forEach((def, layerIdx) => {
      for (let p = 0; p < def.count; p++) {
        const solidPetal = createSolidPetal(def.w, def.h, def.cup, def.arch);

        // Staggered rotational placement around Y axis
        const azimuth = (p / def.count) * Math.PI * 2 + (layerIdx * Math.PI) / def.count;

        const pivot = new THREE.Group();
        pivot.rotation.y = azimuth;
        pivot.position.y = def.y;

        const hinge = new THREE.Group();
        hinge.position.z = def.rad;

        hinge.add(solidPetal);
        pivot.add(hinge);
        lotusGroup.add(pivot);

        const targetRad = THREE.MathUtils.degToRad(def.angleDeg);
        const startRad = THREE.MathUtils.degToRad(14); // bud

        hinge.rotation.x = startRad;

        petalAnimList.push({
          hinge,
          baseAngle: startRad,
          targetAngle: targetRad,
          currentAngle: startRad,
        });
      }
    });

    // --- 6. Soft Floating Golden Sparkles ---
    let particles: THREE.Points | null = null;
    if (showParticles) {
      const pCount = 38;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const rad = 1.4 + Math.random() * 2.0;
        const theta = Math.random() * Math.PI * 2;
        const py = -0.3 + Math.random() * 2.4;
        pPos[i * 3] = Math.cos(theta) * rad;
        pPos[i * 3 + 1] = py;
        pPos[i * 3 + 2] = Math.sin(theta) * rad;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));

      const pMat = new THREE.PointsMaterial({
        color: 0xfbd38d,
        size: 0.055,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });

      particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);
    }

    // --- 7. Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const t = clock.getElapsedTime() * speed;

      // Smooth continuous 360 degree rotation around Y
      lotusGroup.rotation.y = t * 0.42;

      // Gentle organic floating on sacred water (bob & welcoming tilt)
      lotusGroup.position.y = Math.sin(t * 1.5) * 0.1 - 0.06;
      lotusGroup.rotation.x = Math.sin(t * 0.8) * 0.04 + 0.14; // 3D tilt towards viewer
      lotusGroup.rotation.z = Math.cos(t * 1.0) * 0.03;

      // Blossom and living breath cycle
      if (autoBloom) {
        // Initial bloom in first 2.4 seconds
        const bloomT = Math.min(1, t / 2.2);
        const bloomEase = 1 - Math.pow(1 - bloomT, 3);
        const breath = Math.sin(t * 1.3) * 0.035;

        for (const item of petalAnimList) {
          const target = item.baseAngle + (item.targetAngle - item.baseAngle) * bloomEase + breath;
          item.currentAngle += (target - item.currentAngle) * 0.085;
          item.hinge.rotation.x = item.currentAngle;
        }
      }

      if (particles) {
        particles.rotation.y = -t * 0.12;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- 8. Resize Listener ---
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || size;
      const newH = container.clientHeight || size;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      porcelainMap.dispose();
      petalPorcelainMaterial.dispose();
      goldRimMaterial.dispose();
      goldCoreMaterial.dispose();
    };
  }, [size, speed, autoBloom, showParticles]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-visible select-none pointer-events-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
