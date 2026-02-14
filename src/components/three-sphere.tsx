'use dom';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeSphereProps {
  width: number;
  height: number;
}

export default function ThreeSphere({ width, height }: ThreeSphereProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const sphereGroupRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Create sphere group
    const sphereGroup = new THREE.Group();
    sphereGroupRef.current = sphereGroup;
    scene.add(sphereGroup);

    // Main wireframe sphere
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 16);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0096ff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    sphereGroup.add(wireframeSphere);

    // Inner wireframe spheres
    const innerSphere1 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 24, 12),
      new THREE.MeshBasicMaterial({
        color: 0x0096ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
    );
    sphereGroup.add(innerSphere1);

    const innerSphere2 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 8),
      new THREE.MeshBasicMaterial({
        color: 0x0096ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      })
    );
    sphereGroup.add(innerSphere2);

    // Create slice planes
    const slicePlanes: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const planeGeometry = new THREE.PlaneGeometry(4, 4);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);

      // Position and rotate the slice planes
      plane.position.set(
        Math.cos(angle) * 1.5,
        Math.sin(angle) * 0.2,
        Math.sin(angle) * 1.5
      );
      plane.rotation.set(0, angle, Math.PI / 4);

      sphereGroup.add(plane);
      slicePlanes.push(plane);
    }

    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0x00ff88, 0.8, 100);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Animation variables
    let time = 0;
    let slicePhase = 0;
    const sliceDuration = 6000; // 6 seconds per cycle

    // Animation loop
    const animate = () => {
      time += 0.01;
      slicePhase = (Date.now() % sliceDuration) / sliceDuration;

      if (sphereGroup) {
        // Continuous rotation
        sphereGroup.rotation.y = time * 0.5;
        sphereGroup.rotation.x = Math.sin(time * 0.3) * 0.2;

        // Pulse effect
        const pulseScale = 1 + Math.sin(time * 2) * 0.05;
        sphereGroup.scale.setScalar(pulseScale);

        // Animate slice effect
        slicePlanes.forEach((plane, index) => {
          const material = plane.material as THREE.MeshBasicMaterial;

          if (slicePhase > 0.2 && slicePhase < 0.7) {
            // Show slices
            const sliceProgress = Math.min(1, Math.max(0, (slicePhase - 0.2) / 0.3));
            material.opacity = sliceProgress * 0.8;

            // Animate slice position
            const baseAngle = (index / 8) * Math.PI * 2;
            const offset = Math.sin(time * 3 + index) * 0.3;
            plane.position.set(
              Math.cos(baseAngle) * (1.5 + offset),
              Math.sin(baseAngle) * (0.2 + offset * 0.5),
              Math.sin(baseAngle) * (1.5 + offset)
            );
          } else {
            // Hide slices
            material.opacity = Math.max(0, material.opacity - 0.02);
          }
        });

        // Animate wireframe opacity during slicing
        const wireframeMaterial = wireframeSphere.material as THREE.MeshBasicMaterial;
        if (slicePhase > 0.2 && slicePhase < 0.7) {
          wireframeMaterial.opacity = 0.3;
        } else {
          wireframeMaterial.opacity = Math.min(0.8, wireframeMaterial.opacity + 0.02);
        }
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();
    setIsInitialized(true);

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [width, height, isInitialized]);

  // Handle resize
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [width, height]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle, rgba(0,150,255,0.1) 0%, rgba(0,0,0,1) 70%)',
      }}
    />
  );
}