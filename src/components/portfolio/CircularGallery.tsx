/**
 * CircularGallery — React Bits (https://reactbits.dev/circular-gallery)
 *
 * Ported from the React Bits source to this app's stack: no "use client",
 * typed throughout, and ogl's WebGL renderer rather than raw three.js.
 *
 * How it works: every item is a subdivided Plane in a shared scene. Each
 * frame lerps `scroll.current` toward `scroll.target`, then each Media places
 * itself along a circular arc derived from its own x-offset and `bend`, so the
 * whole band curves like a section of a ring. The vertex shader adds a small
 * sine-driven z displacement scaled by scroll speed, which is what makes the
 * planes ripple as the gallery travels.
 *
 * TWO DELIBERATE DEVIATIONS from upstream, both required by this portfolio:
 *
 * 1. TRANSPARENT BACKGROUNDS. Upstream samples the image and discards nothing:
 *    `gl_FragColor = vec4(color.rgb, alpha)` where `alpha` comes only from the
 *    rounded-box SDF. Any pixel that is transparent in the source (which is
 *    most of a Simple Icons glyph) would therefore render as opaque BLACK,
 *    because `rgb` of a fully transparent texel is undefined/black. We
 *    multiply the SDF alpha by the texture's own alpha so genuinely
 *    transparent areas stay transparent — which is what lets the brand marks
 *    sit directly on the page with no tile behind them.
 *
 * 2. REDUCED MOTION. The rAF loop only runs when the user has not asked for
 *    reduced motion; otherwise the gallery renders a single static frame and
 *    the wheel/drag handlers are inert, so the band never fights the OS
 *    setting.
 */
import {
  Camera,
  Mesh,
  type OGLRenderingContext,
  Plane,
  Program,
  Renderer,
  Texture,
  Transform,
} from "ogl";
import { useEffect, useRef } from "react";

type GL = OGLRenderingContext;

export type CircularGalleryItem = {
  image: string;
  text: string;
};

export type CircularGalleryProps = {
  items?: CircularGalleryItem[];
  /** Curvature. Negative bends one way, positive the other. */
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  fontUrl?: string;
  scrollSpeed?: number;
  scrollEase?: number;
};

type ScreenSize = { width: number; height: number };
type Viewport = { width: number; height: number };
type Scroll = { current: number; target: number; last: number; position?: number };

function debounce<T extends (...args: never[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function debounced(this: unknown, ...args: Parameters<T>) {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

/* Binds every prototype method to the instance, the way three.js classes
   expect `this` inside App/Media/Title callbacks. */
function autoBind(instance: object): void {
  const proto = Object.getPrototypeOf(instance) as Record<string, unknown>;
  const target = instance as unknown as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && typeof target[key] === "function") {
      target[key] = (target[key] as (...a: unknown[]) => unknown).bind(target);
    }
  }
}

const DEFAULT_FONT = "600 30px Inter";
const DEFAULT_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300..600&display=swap";

function deriveFontFamilyFromUrl(url: string): string {
  const fileName = (url.split("/").pop() || "custom-font").split("?")[0];
  const base = fileName.replace(/\.(woff2?|ttf|otf|eot)$/i, "");
  return base.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "CircularGalleryFont";
}

async function loadFontFromStylesheet(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font stylesheet (${response.status})`);
  }
  const cssText = await response.text();
  const faceBlocks = cssText.match(/@font-face\s*{[^}]*}/g) ?? [];
  let family: string | null = null;
  const fontFaces: FontFace[] = [];

  for (const block of faceBlocks) {
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
    const urlMatch = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    if (!familyMatch || !urlMatch) continue;
    family = familyMatch[1].trim();

    const descriptors: FontFaceDescriptors = {};
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    if (weightMatch) descriptors.weight = weightMatch[1].trim();
    if (styleMatch) descriptors.style = styleMatch[1].trim();
    if (rangeMatch) descriptors.unicodeRange = rangeMatch[1].trim();

    fontFaces.push(new FontFace(family, `url(${urlMatch[1]})`, descriptors));
  }

  if (!family) throw new Error("No @font-face rule found in the stylesheet");

  await Promise.allSettled(
    fontFaces.map(async (face) => {
      await face.load();
      document.fonts.add(face);
    }),
  );
  return family;
}

async function loadFontFromFile(url: string): Promise<string> {
  const family = deriveFontFamilyFromUrl(url);
  const fontFace = new FontFace(family, `url(${url})`);
  await fontFace.load();
  document.fonts.add(fontFace);
  return family;
}

async function loadCustomFont(fontUrl: string): Promise<string> {
  const isStylesheet =
    fontUrl.includes("fonts.googleapis.com") || /\.css(\?.*)?$/i.test(fontUrl);
  return isStylesheet ? loadFontFromStylesheet(fontUrl) : loadFontFromFile(fontUrl);
}

/**
 * Returns a canvas-ready font string that keeps the size/weight from `font`
 * but swaps in the freshly loaded family. Falls back to `font` on any error.
 */
async function resolveFont(font: string, fontUrl?: string): Promise<string> {
  const effectiveUrl =
    fontUrl || (font === DEFAULT_FONT ? DEFAULT_FONT_URL : null);

  if (!effectiveUrl) {
    // A custom family with no URL: make sure it is ready before the first
    // canvas paint, otherwise the labels silently fall back to a system font.
    if (document.fonts?.load) {
      try {
        await document.fonts.load(font);
        await document.fonts.ready;
      } catch {
        /* fall back to whatever the browser provides */
      }
    }
    return font;
  }

  try {
    const family = await loadCustomFont(effectiveUrl);
    const sizeMatch = font.match(/^\s*(.*?\d+px)/);
    const prefix = sizeMatch ? sizeMatch[1].trim() : "bold 30px";
    const resolved = `${prefix} "${family}"`;
    if (document.fonts?.load) {
      try {
        await document.fonts.load(resolved);
      } catch {
        /* still attempt to render with the requested font */
      }
    }
    return resolved;
  } catch (error) {
    console.error("CircularGallery: unable to load font from", fontUrl, error);
    return font;
  }
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(
  gl: GL,
  text: string,
  font = "bold 30px monospace",
  color = "black",
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2d context");

  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;

  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

/* ------------------------------------------------------------------ */
/* Title — the label plane that hangs under each card                    */
/* ------------------------------------------------------------------ */

type TitleProps = {
  gl: GL;
  plane: Mesh;
  text: string;
  textColor?: string;
  font?: string;
};

class Title {
  gl: GL;
  plane: Mesh;
  text: string;
  textColor: string;
  font: string;
  mesh!: Mesh;

  constructor({
    gl,
    plane,
    text,
    textColor = "#545050",
    font = "30px sans-serif",
  }: TitleProps) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(
      this.gl,
      this.text,
      this.font,
      this.textColor,
    );

    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });

    this.mesh = new Mesh(this.gl, { geometry, program });

    /* Sized off the measured text box so long labels never get squashed,
       and hung just below the card it belongs to. */
    const aspect = width / height;
    const textHeightScaled = this.plane.scale.y * 0.15;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
    this.mesh.position.y =
      -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

/* ------------------------------------------------------------------ */
/* Media — one card: its shader, its plane, and its label               */
/* ------------------------------------------------------------------ */

type MediaProps = {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius?: number;
  font?: string;
};

class Media {
  extra = 0;
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius: number;
  font?: string;
  program!: Program;
  plane!: Mesh;
  title!: Title;
  scale!: number;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed = 0;
  isBefore = false;
  isAfter = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font,
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });

    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);

          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float boxAlpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);

          /* See the note at the top of the file: the texture's own alpha has
             to participate, otherwise every transparent pixel in the source
             paints solid black. */
          float alpha = color.a * boxAlpha;
          if (alpha < 0.01) discard;

          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [
        img.naturalWidth,
        img.naturalHeight,
      ];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    });
  }

  update(scroll: Scroll, direction: "right" | "left") {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      /* Arc of the circle whose sagitta equals |bend| over half the
         viewport — the larger |bend|, the tighter the ring. */
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);

      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    /* Recycle anything that has left the viewport to the far end, so the
       band is endless in both directions. */
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;

    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;

    this.scale = this.screen.height / 1500;
    this.plane.scale.y =
      (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x =
      (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.program.uniforms.uPlaneSizes.value = [
      this.plane.scale.x,
      this.plane.scale.y,
    ];

    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

/* ------------------------------------------------------------------ */
/* App — the ogl renderer, the input handling and the frame loop       */
/* ------------------------------------------------------------------ */

type AppConfig = {
  items?: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
};

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: Scroll;
  onCheckDebounce: () => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  screen!: ScreenSize;
  viewport!: Viewport;
  raf = 0;

  boundOnResize!: () => void;
  boundOnWheel!: (event: Event) => void;
  boundOnPointerDown!: (event: MouseEvent | TouchEvent) => void;
  boundOnPointerMove!: (event: MouseEvent | TouchEvent) => void;
  boundOnPointerUp!: () => void;
  boundOnKeyDown!: (event: KeyboardEvent) => void;

  isDown = false;
  start = 0;
  private reducedMotion: MediaQueryList;
  private frameHandler: FrameRequestCallback;

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      textColor = "#ffffff",
      borderRadius = 0,
      font = DEFAULT_FONT,
      scrollSpeed = 2,
      scrollEase = 0.05,
    }: AppConfig,
  ) {
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 } as Scroll;
    this.onCheckDebounce = debounce(this.onCheck.bind(this) as () => void, 200);

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.frameHandler = this.update.bind(this);

    if (!this.reducedMotion.matches) {
      this.update(performance.now());
      this.addEventListeners();
    }
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.gl = this.renderer.gl as unknown as GL;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    /* Dense tessellation: the ripple in the vertex shader displaces along z,
       and a coarse plane would facet visibly. */
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    });
  }

  createMedias(
    items: CircularGalleryItem[] | undefined,
    bend: number,
    textColor: string,
    borderRadius: number,
    font: string,
  ) {
    /* Doubled so the ring can wrap in both directions forever. */
    const galleryItems = items?.length ? items : [];
    const doubled = galleryItems.concat(galleryItems);

    this.medias = doubled.map((data, index) =>
      new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: doubled.length,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
      }),
    );
  }

  onPointerDown(event: MouseEvent | TouchEvent) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = "touches" in event ? event.touches[0].clientX : event.clientX;
  }

  onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this.isDown) return;
    const x = "touches" in event ? event.touches[0].clientX : event.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll.position ?? 0) + distance;
  }

  onPointerUp() {
    this.isDown = false;
    this.onCheck();
  }

  onWheel(event: Event) {
    const wheelEvent = event as WheelEvent;
    const delta = wheelEvent.deltaY || wheelEvent.detail || 0;
    this.scroll.target +=
      (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.scroll.target += this.scrollSpeed * 5;
      this.onCheckDebounce();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.scroll.target -= this.scrollSpeed * 5;
      this.onCheckDebounce();
    }
  }

  onCheck() {
    if (!this.medias?.[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    /* Snap to a card boundary so the ring always rests on a whole item. */
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });

    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };

    this.medias?.forEach((media) =>
      media.onResize({ screen: this.screen, viewport: this.viewport }),
    );
  }

  update(time: number) {
    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      (this.scroll as unknown as { ease: number }).ease,
    );
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";

    this.medias?.forEach((media) => media.update(this.scroll, direction));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;

    this.raf = window.requestAnimationFrame(this.frameHandler);
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener("resize", this.boundOnResize);
    /* Wheel on the container only, not on window: this band sits mid-page,
       so hijacking document-level scroll would make the whole site feel
       stuck. Passive, because the page must still scroll past it. */
    this.container.addEventListener("wheel", this.boundOnWheel, { passive: true });
    this.container.addEventListener("mousedown", this.boundOnPointerDown);
    this.container.addEventListener("touchstart", this.boundOnPointerDown, {
      passive: true,
    });

    /* Pointer move/up are bound to window so a drag that leaves the band
       still tracks and releases cleanly. */
    window.addEventListener("mousemove", this.boundOnPointerMove);
    window.addEventListener("touchmove", this.boundOnPointerMove, { passive: true });
    window.addEventListener("mouseup", this.boundOnPointerUp);
    window.addEventListener("touchend", this.boundOnPointerUp);

    this.container.addEventListener("keydown", this.boundOnKeyDown);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize);
    this.container.removeEventListener("wheel", this.boundOnWheel);
    this.container.removeEventListener("mousedown", this.boundOnPointerDown);
    this.container.removeEventListener("touchstart", this.boundOnPointerDown);
    window.removeEventListener("mousemove", this.boundOnPointerMove);
    window.removeEventListener("touchmove", this.boundOnPointerMove);
    window.removeEventListener("mouseup", this.boundOnPointerUp);
    window.removeEventListener("touchend", this.boundOnPointerUp);
    this.container.removeEventListener("keydown", this.boundOnKeyDown);

    const canvas = this.renderer?.gl?.canvas;
    if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
  }
}

export function CircularGallery({
  items,
  bend = 3,
  textColor = "#ffffff",
  borderRadius = 0.05,
  font = DEFAULT_FONT,
  fontUrl,
  scrollSpeed = 2,
  scrollEase = 0.05,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !items?.length) return;

    let app: App | undefined;
    let cancelled = false;

    resolveFont(font, fontUrl).then((resolvedFont) => {
      if (cancelled || !containerRef.current) return;
      app = new App(containerRef.current, {
        items,
        bend,
        textColor,
        borderRadius,
        font: resolvedFont,
        scrollSpeed,
        scrollEase,
      });
    });

    return () => {
      cancelled = true;
      app?.destroy();
    };
  }, [items, bend, textColor, borderRadius, font, fontUrl, scrollSpeed, scrollEase]);

  return (
    <div
      ref={containerRef}
      className="hk-circular-gallery h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      tabIndex={0}
      role="region"
      aria-label="Skills gallery. Use the Left and Right arrow keys to scroll."
    />
  );
}

export default CircularGallery;