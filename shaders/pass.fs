precision mediump float;

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform int showAttachment;

void main() {
  vec3 tex = texture2D(tDiffuse, vUv).rgb;

  gl_FragColor.rgb = tex;
  gl_FragColor.a = 1.0;
}