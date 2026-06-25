import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 300;

    // Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Core Sphere (Dark Semi-transparent)
    const sphereGeo = new THREE.SphereGeometry(5, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x050816,
      transparent: true,
      opacity: 0.85,
      shininess: 30,
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(coreSphere);

    // 2. Globe Grid wireframe
    const wireGeo = new THREE.SphereGeometry(5.05, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // 3. Atmospheric Particles Cloud
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Position particles on a slightly larger shell
      const r = 5.2 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color coding (various shades of cyan/violet)
      const mix = Math.random();
      colors[i * 3] = mix * 0.1 + 0.05; // R
      colors[i * 3 + 1] = mix * 0.7 + 0.3; // G
      colors[i * 3 + 2] = 0.9; // B (highly blue-cyan)
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particles);

    // 4. Glowing Hotspots (e.g. key city coordinates)
    const hotspots = [
      { lat: 19.0760, lng: 72.8777, label: 'Mumbai' },
      { lat: 28.6139, lng: 77.2090, label: 'Delhi' },
      { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
      { lat: 40.7128, lng: -74.0060, label: 'New York' },
      { lat: 51.5074, lng: -0.1278, label: 'London' },
      { lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
    ];

    const convertLatLngToVector3 = (lat: number, lng: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.sin(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      return new THREE.Vector3(x, y, z);
    };

    hotspots.forEach((spot) => {
      const pos = convertLatLngToVector3(spot.lat, spot.lng, 5.08);
      
      // Pin Glow Base
      const pinGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const pinMat = new THREE.MeshBasicMaterial({
        color: spot.lat > 0 && spot.lng > 60 && spot.lng < 90 ? 0x10b981 : 0xec4899, // Green for India, Pink for others
        transparent: true,
        opacity: 0.9,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      globeGroup.add(pinMesh);

      // Connecting Ray line (origin to shell)
      const linePoints = [];
      linePoints.push(new THREE.Vector3(0, 0, 0));
      linePoints.push(pos.clone().multiplyScalar(1.2));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.15
      });
      const connectingLine = new THREE.Line(lineGeo, lineMat);
      globeGroup.add(connectingLine);
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0ea5e9, 2.5);
    dirLight1.position.set(10, 10, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 1.5);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Interaction, Velocities & Frame Loop States
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocityY = 0;
    let dragVelocityX = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      // Set instantaneous drag velocities
      dragVelocityY = deltaMove.x * 0.004;
      dragVelocityX = deltaMove.y * 0.004;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Mobile / Tablet Touch Support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y,
      };

      dragVelocityY = deltaMove.x * 0.004;
      dragVelocityX = deltaMove.y * 0.004;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Resize Observer using clientWidth/clientHeight with safety checks
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    // High Performance Animation Loop (Conceptually identical to R3F's useFrame)
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. Continuous auto-rotation on the Y-axis (runs regardless of interaction)
      globeGroup.rotation.y += 0.0025;

      // 2. Apply drag velocity overlays
      globeGroup.rotation.y += dragVelocityY;
      globeGroup.rotation.x += dragVelocityX;

      // 3. Smoothly decay interaction velocities
      if (isDragging) {
        // Faster decay when mouse is held down but static
        dragVelocityY *= 0.85;
        dragVelocityX *= 0.85;
      } else {
        // Slow buttery decay (inertia) when released
        dragVelocityY *= 0.95;
        dragVelocityX *= 0.95;
      }

      // Keep rotation X within reasonable limits (optional, to avoid flipping upside down)
      globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));

      // 4. Atmospheric particles continuous rotation
      particles.rotation.y -= 0.001;

      // Render Scene
      renderer.render(scene, camera);
    };
    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (containerRef.current && dom.parentNode === containerRef.current) {
        containerRef.current.removeChild(dom);
      }
      // dispose WebGL resources
      sphereGeo.dispose();
      sphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      
      {/* Legend details HUD overlay */}
      <div className="absolute bottom-2 left-4 z-10 pointer-events-none font-mono text-[9px] text-slate-400 space-y-1 bg-slate-950/40 p-2 rounded border border-white/5 backdrop-blur-sm text-left">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>INDIAN ACTIVE CELL WATCH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500 inline-block"></span>
          <span>GLOBAL FEED SYNCED</span>
        </div>
      </div>
    </div>
  );
};
