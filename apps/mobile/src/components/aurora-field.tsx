import { Canvas, Fill, Shader, Skia, type Uniforms } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated'

export type AuroraTone = 'dark' | 'light'

interface AuroraFieldProps {
  tone: AuroraTone
}

const AURORA_SHADER_SOURCE = `
uniform float2 resolution;
uniform float time;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 skyTop;
uniform vec3 skyBottom;
uniform float speed;
uniform float intensity;
uniform float verticalScale;
uniform float2 waveDirection;

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i.x + hash(i.y)), hash(i.x + 1.0 + hash(i.y)), u.x),
    mix(hash(i.x + hash(i.y + 1.0)), hash(i.x + 1.0 + hash(i.y + 1.0)), u.x),
    u.y
  );
}

vec3 auroraLayer(float2 uv, float layerSpeed, float layerIntensity, vec3 color) {
  float t = time * layerSpeed * speed;
  float2 p = uv * 2.0 + t * waveDirection;
  float n = noise(p + noise(color.xy + p + t));
  float ribbon = max(n - uv.y * 0.48, 0.0);
  float upperFade = 1.0 - smoothstep(0.58, 1.0, uv.y);
  return color * ribbon * upperFade * layerIntensity * intensity * 2.0;
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / resolution;
  uv.x *= resolution.x / resolution.y;
  uv.y *= verticalScale;

  vec3 color = mix(skyTop, skyBottom, smoothstep(0.0, 1.0, uv.y));
  color += auroraLayer(uv, 0.05, 0.34, color1);
  color += auroraLayer(uv, 0.10, 0.42, color2);
  color += auroraLayer(uv, 0.16, 0.26, color3);
  color += auroraLayer(uv, 0.24, 0.28, color1 * 0.55 + color3 * 0.22);

  return half4(color, 1.0);
}`

const AURORA_SHADER = Skia.RuntimeEffect.Make(AURORA_SHADER_SOURCE)

const palettes = {
  dark: {
    aurora: ['#20e3a1', '#54efe0', '#718dff'] as const,
    intensity: 0.7,
    sky: ['#071b16', '#020706'] as const,
    verticalScale: 3.25,
  },
  light: {
    aurora: ['#42c997', '#6bdad4', '#b8dc65'] as const,
    intensity: 0.46,
    sky: ['#e6f5ed', '#f7faf8'] as const,
    verticalScale: 1,
  },
} as const

function hexToRgb(hex: string): [number, number, number] {
  const value = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!value) return [0, 0, 0]
  return [
    Number.parseInt(value[1]!, 16) / 255,
    Number.parseInt(value[2]!, 16) / 255,
    Number.parseInt(value[3]!, 16) / 255,
  ]
}

export function AuroraField({ tone }: AuroraFieldProps) {
  const { height, width } = useWindowDimensions()
  const reduceMotion = useReducedMotion()
  const time = useSharedValue(0)
  const palette = palettes[tone]
  const colors = useMemo(
    () =>
      [
        hexToRgb(palette.aurora[0]),
        hexToRgb(palette.aurora[1]),
        hexToRgb(palette.aurora[2]),
      ] as const,
    [palette.aurora],
  )
  const sky = useMemo(
    () => [hexToRgb(palette.sky[0]), hexToRgb(palette.sky[1])] as const,
    [palette.sky],
  )

  useFrameCallback((frame) => {
    if (reduceMotion || frame.timeSincePreviousFrame === null) return
    time.value += frame.timeSincePreviousFrame / 1000
  })

  const uniforms = useDerivedValue<Uniforms>(
    () => ({
      color1: colors[0],
      color2: colors[1],
      color3: colors[2],
      intensity: palette.intensity,
      resolution: [width, height],
      skyBottom: sky[1],
      skyTop: sky[0],
      speed: 0.48,
      time: time.value,
      verticalScale: palette.verticalScale,
      waveDirection: [7, -5],
    }),
    [colors, height, palette.intensity, palette.verticalScale, sky, width],
  )

  if (!AURORA_SHADER) {
    return <View style={[styles.fill, { backgroundColor: palette.sky[0] }]} />
  }

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Canvas style={{ height, width }}>
        <Fill>
          <Shader source={AURORA_SHADER} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
})
