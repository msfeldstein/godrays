#extension GL_EXT_draw_buffers : require
precision mediump float;

uniform vec3 color;
uniform float isLightSource;
varying vec3 vNormal;

void main() {
  // write color to G-Buffer
  gl_FragData[0] = vec4(isLightSource, isLightSource, isLightSource, 1.0);

  // write normals to G-Buffer
  vec3 lightPos = vec3(1.0, 1.0, 1.0);
  float lightPower = dot(lightPos, vNormal);
  gl_FragData[1] = vec4(lightPower * color, 0.0);
}