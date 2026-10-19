import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { takeSnapshot } from './shatter'

// The print look, in one pass after tone mapping: inks slightly out of
// register, a dot screen in the shadows, grain, a vignette; and the shot's
// moments, a shockwave from the muzzle, an inverted impact frame with radial
// lines, a white frame. The bloom before it lifts the tracer and the flash.

const InkShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uAberr: { value: 0.001 },
    uHalftone: { value: 0.5 },
    uGrain: { value: 0.035 },
    uVignette: { value: 0.55 },
    uShock: { value: 0 },
    uShockCenter: { value: new THREE.Vector2(0.5, 0.45) },
    uImpact: { value: 0 },
    uWhite: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAspect, uAberr, uHalftone, uGrain, uVignette, uShock, uImpact, uWhite;
    uniform vec2 uShockCenter;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      vec2 d = uv - uShockCenter;
      d.x *= uAspect;
      float dist = length(d);

      // Shockwave: a ring that widens and fades. Only while a shot runs: at
      // rest the ring would sit on its centre and warp the muzzle.
      float radius = uShock * 0.9;
      float band = 0.07 + uShock * 0.05;
      float wave = smoothstep(radius - band, radius, dist) * (1.0 - smoothstep(radius, radius + band, dist));
      wave *= step(0.02, uShock) * (1.0 - uShock);
      uv += (dist > 0.0001 ? d / dist : vec2(0.0)) * wave * 0.035 * vec2(1.0 / uAspect, 1.0);

      // Inks out of register: red pulled one way, blue the other, a touch diagonal
      vec2 off = vec2(uAberr, uAberr * 0.45);
      float r = texture2D(tDiffuse, uv + off).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - off).b;
      vec3 col = vec3(r, g, b);

      // Dot screen in the shadows, rotated like a print
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      float a = 0.26;
      vec2 p = mat2(cos(a), -sin(a), sin(a), cos(a)) * gl_FragCoord.xy;
      vec2 cell = fract(p / 7.0) - 0.5;
      float shade = 1.0 - smoothstep(0.02, 0.25, luma);
      float dots = 1.0 - smoothstep(shade * 0.42 - 0.08, shade * 0.42, length(cell));
      col *= 1.0 - 0.32 * dots * uHalftone;

      // Grain, moving
      float n = hash(gl_FragCoord.xy + fract(uTime) * 100.0);
      col += (n - 0.5) * uGrain;

      // Vignette
      vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
      col *= mix(1.0, smoothstep(1.05, 0.3, length(q)), uVignette);

      // Impact frame: flat, inverted, with ink lines radiating from the hit
      if (uImpact > 0.001) {
        float ang = atan(d.y, d.x);
        float rays = step(0.55, fract(ang * 14.0 / 6.28318 + uTime)) * smoothstep(0.04, 0.35, dist);
        vec3 posterized = floor((vec3(1.0) - col) * 3.0) / 3.0;
        vec3 ink = mix(vec3(0.05, 0.06, 0.09), vec3(0.97, 0.94, 0.88), rays);
        col = mix(col, mix(posterized, ink, 0.55), uImpact);
      }

      col = mix(col, vec3(1.0), uWhite);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

export const Post = ({ rig, lowPerf }) => {
  const get = useThree((state) => state.get)
  const composerRef = useRef(null)

  useEffect(() => {
    const { gl, scene, camera } = get()
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: lowPerf ? 0 : 4,
    })
    const composer = new EffectComposer(gl, target)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = lowPerf ? null : new UnrealBloomPass(new THREE.Vector2(1, 1), 0.0, 0.4, 1.2)
    if (bloom) composer.addPass(bloom)
    composer.addPass(new OutputPass())
    const ink = new ShaderPass(InkShader)
    ink.uniforms.uHalftone.value = lowPerf ? 0 : 0.35
    composer.addPass(ink)
    composerRef.current = { composer, bloom, ink, width: 0, height: 0, ratio: 0 }
    return () => {
      composer.dispose()
      composerRef.current = null
    }
  }, [get, lowPerf])

  useFrame((state, delta) => {
    const c = composerRef.current
    if (!c) return
    const { width, height } = state.size
    const ratio = state.gl.getPixelRatio()
    if (c.width !== width || c.height !== height || c.ratio !== ratio) {
      c.width = width
      c.height = height
      c.ratio = ratio
      c.composer.setPixelRatio(ratio)
      c.composer.setSize(width, height)
      c.ink.uniforms.uAspect.value = width / height
    }
    const u = c.ink.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uAberr.value = 0.0012 + rig.aberr * 0.012
    u.uShock.value = rig.shock
    // The rig's screen positions count from the top; the shader from the bottom
    u.uShockCenter.value.set(rig.screen.muzzle.x, 1 - rig.screen.muzzle.y)
    u.uImpact.value = rig.impact
    u.uWhite.value = rig.white
    // No bloom at rest: polished brass under the key light would haze the whole frame
    if (c.bloom) c.bloom.strength = rig.bloom * 2.6 + rig.flash * 0.8
    c.composer.render(delta)
    // The screen-level shatter wants this very frame, before anything else paints
    if (rig.snapshot === 'request') takeSnapshot(rig, state.gl.domElement)
  }, 1)

  return null
}
