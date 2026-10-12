/**
 * Lanyard — a physics-simulated ID card on a band.
 *
 * From React Bits (https://reactbits.dev), adapted for this
 * portfolio in three ways, all deliberate:
 *
 * 1. The model and band texture are fetched from `public/lanyard/`
 *    rather than imported from `src/assets`. React Bits' own setup
 *    needs a `vite.config` entry to treat .glb as an asset; serving
 *    the files from `public` means this project needs no build-config
 *    change at all.
 * 2. The root wrapper is `h-full` instead of `h-screen`, so the card
 *    can live inside a column of the About section and take its
 *    height from that container.
 * 3. `prefers-reduced-motion` pauses the physics, so the card hangs
 *    still instead of swinging.
 * 4. The rig can be pinned to a point on the canvas (`anchorX` /
 *    `anchorY`) instead of the exact centre. The About section sizes
 *    this canvas to the whole section so the card can be dragged
 *    across all of it, while the card itself still hangs over the
 *    right-hand column.
 * 5. The camera distance scales with the canvas height
 *    (`referenceHeight`), so a taller canvas shows the card at the
 *    same apparent size rather than magnifying it.
 *
 * The physics, rope joints, meshline band, lighting and drag
 * behaviour are otherwise unchanged.
 */
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import {
  Canvas,
  extend,
  useFrame,
  useThree,
  type ThreeElement,
  type ThreeEvent,
} from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

/* Served from public/ — see the note at the top of this file. */
const CARD_GLB = `${import.meta.env.BASE_URL}lanyard/card.glb`;
const LANYARD_PNG = `${import.meta.env.BASE_URL}lanyard/lanyard.png`;

/* 1x1 transparent pixel, so useTexture can be called unconditionally
   when a front/back image isn't supplied. */
const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/* The card model's front face is UV-mapped to the LEFT half of the
   texture atlas and the back face to the RIGHT half. Each custom
   image is composited into its own half, aspect-preserving. */
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export type LanyardProps = {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: "cover" | "contain";
  /** Painted behind a custom face image, so a cut-out photo reads as
      a printed card rather than floating on the original atlas. */
  faceFill?: string | null;
  lanyardImage?: string | null;
  lanyardWidth?: number;
  /** 0..1 — where the band's fixed end sits across the canvas. 0.5 is
      centred; the About section passes the right-hand column's centre
      so the card hangs over that column on a full-width canvas. */
  anchorX?: number;
  /** 0..1 — how far down the canvas that same point sits. */
  anchorY?: number;
  /** Canvas height in px at which the shipped framing is exact. The
      camera is pushed back proportionally on a taller canvas so the
      card keeps its apparent size. */
  referenceHeight?: number;
  /** True when the visitor prefers reduced motion. */
  paused?: boolean;
};

/* The framing the scene shipped with, measured against a 500px-tall
   canvas: that is the height `referenceHeight` defaults to, and the
   camera distance that fills it. */
const REFERENCE_HEIGHT = 500;
const REFERENCE_CAMERA_Z = 26;

/* Where the band's fixed end sits on the canvas the scene shipped
   with — 10.4% down from the top of a 500px frame. */
const REFERENCE_ANCHOR_Y = 0.1042;
const BAND_ANCHOR_Y = 4;

type LanyardModel = {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.MeshStandardMaterial>;
};

/** Rapier's body, plus the smoothed position we lerp toward. */
type LanyardRigidBody = RapierRigidBody & { lerped?: THREE.Vector3 };

type BandProps = {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: "cover" | "contain";
  faceFill?: string | null;
  lanyardImage?: string | null;
  lanyardWidth?: number;
  anchorX?: number;
  anchorY?: number;
  fov?: number;
  cameraZ?: number;
};

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  faceFill = null,
  lanyardImage = null,
  lanyardWidth = 1,
  anchorX = 0.5,
  anchorY = REFERENCE_ANCHOR_Y,
  fov = 20,
  cameraZ = REFERENCE_CAMERA_Z,
}: BandProps) {
  const size = useThree((state) => state.size);

  /* World units the canvas spans, derived from the camera rather than
     read from R3F's `viewport`, which is only recomputed on resize.
     Used to place the rig at (anchorX, anchorY). */
  const worldHeight = 2 * Math.tan((fov / 2) * (Math.PI / 180)) * cameraZ;
  const worldWidth =
    size.height > 0 ? worldHeight * (size.width / size.height) : worldHeight;
  const band = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>>>(null!);
  const fixed = useRef<LanyardRigidBody>(null!);
  const j1 = useRef<LanyardRigidBody>(null!);
  const j2 = useRef<LanyardRigidBody>(null!);
  const j3 = useRef<LanyardRigidBody>(null!);
  const card = useRef<LanyardRigidBody>(null!);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = {
    type: "dynamic" as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  const getLerped = (body: LanyardRigidBody): THREE.Vector3 => {
    if (!body.lerped) body.lerped = new THREE.Vector3().copy(body.translation());
    return body.lerped;
  };

  const { nodes, materials } = useGLTF(CARD_GLB) as unknown as LanyardModel;
  const bandTexture = useTexture(lanyardImage || LANYARD_PNG);
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  /* Configured on a clone: the texture from the hook is shared, so
     it is never mutated in place. */
  const texture = useMemo(() => {
    const next = bandTexture.clone();
    next.wrapS = next.wrapT = THREE.RepeatWrapping;
    next.needsUpdate = true;
    return next;
  }, [bandTexture]);

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image as HTMLImageElement;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return baseMap;

    /* Keep the original atlas for the card edges. */
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img: HTMLImageElement, rect: typeof FRONT_UV_RECT) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const pick = imageFit === "contain" ? Math.min : Math.max;
      const scale = pick(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      /* A cut-out photo has transparent pixels; without a panel
         behind it the original atlas artwork shows through. */
      if (faceFill) {
        ctx.fillStyle = faceFill;
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (frontImage && frontTex.image) {
      drawFitted(frontTex.image as HTMLImageElement, FRONT_UV_RECT);
    }
    if (backImage && backTex.image) {
      drawFitted(backTex.image as HTMLImageElement, BACK_UV_RECT);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, imageFit, faceFill, frontTex, backTex, materials.base.map]);

  const [curve] = useState(() => {
    const line = new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    line.curveType = "chordal";
    return line;
  });
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useRopeJoint(j1, j2, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useRopeJoint(j2, j3, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== "boolean") {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, lerped.distanceTo(ref.current.translation())),
        );
        lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      card.current.setAngvel(
        { x: ang.x, y: ang.y - card.current.rotation().y * 0.25, z: ang.z },
        true,
      );
    }
  });

  /* The whole rig — card, rope joints and the band mesh — is shifted
     as one group. The band draws its points from the physics
     positions, so moving only the card would leave the band behind. */
  const offsetX = (anchorX - 0.5) * worldWidth;
  const offsetY = (0.5 - anchorY) * worldHeight - BAND_ANCHOR_Y;

  return (
    <group position={[offsetX, offsetY, 0]}>
      <group position={[0, BAND_ANCHOR_Y, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(event: ThreeEvent<PointerEvent>) => {
              (event.target as Element).releasePointerCapture(event.pointerId);
              drag(false);
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              (event.target as Element).setPointerCapture(event.pointerId);
              drag(
                new THREE.Vector3().copy(event.point).sub(vec.copy(card.current.translation())),
              );
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      <mesh ref={band}>
        <meshLineGeometry args={[]} />
        {/* The band is drawn from a texture, so the material is
            configured through its constructor rather than as props. */}
        <meshLineMaterial
          args={[
            {
              color: "white",
              resolution: isMobile
                ? new THREE.Vector2(1000, 2000)
                : new THREE.Vector2(1000, 1000),
              useMap: 1,
              map: texture,
              repeat: new THREE.Vector2(-4, 1),
              lineWidth: lanyardWidth,
            },
          ]}
          transparent
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

/* The Canvas builds its camera once and never re-applies the
   `camera` prop, so a distance that depends on the measured canvas
   height has to be moved into place imperatively. Only z changes,
   and the camera already looks straight down -z, so the framing
   stays square to the card. */
function CameraDistance({ z }: { z: number }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, z]);

  return null;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  faceFill = null,
  lanyardImage = null,
  lanyardWidth = 1,
  anchorX = 0.5,
  anchorY = REFERENCE_ANCHOR_Y,
  referenceHeight = REFERENCE_HEIGHT,
  paused = false,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* The canvas is as tall as the About section, which is far taller
     than the 500px frame this scene was framed against. Pushing the
     camera back by the same factor keeps the card at its familiar
     apparent size instead of magnifying it. The height is measured
     here rather than inside the canvas so the camera is created at
     the right distance.

     The world extents are then derived from `fov` and this distance
     rather than read from R3F's cached `viewport`, which is only
     recomputed on resize — after the camera moved it would be stale,
     and the anchor would drift. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState(0);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;

    const read = () => setBoxHeight(element.clientHeight);
    read();

    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const baseZ = position[2] ?? REFERENCE_CAMERA_Z;
  const cameraZ = boxHeight > 0 ? baseZ * (boxHeight / referenceHeight) : baseZ;

  return (
    <div
      ref={wrapRef}
      className="relative z-0 flex h-full w-full items-center justify-center"
    >
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        /* The drag surface covers the whole About section. Leaving the
           default `touch-action: none` would swallow vertical
           scrolling on a phone, so the canvas yields vertical pans to
           the page and keeps horizontal ones for the card. */
        style={{ touchAction: "pan-y" }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        <CameraDistance z={cameraZ} />
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60} paused={paused}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            faceFill={faceFill}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            anchorX={anchorX}
            anchorY={anchorY}
            fov={fov}
            cameraZ={cameraZ}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
