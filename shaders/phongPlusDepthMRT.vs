#extension GL_EXT_draw_buffers : require
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;

attribute vec4 position;
attribute vec3 normal;
varying vec3 vNormal;

void main() {
  // get smooth normals
  vec4 mvPosition = modelViewMatrix * position;

  vec3 transformedNormal = normalMatrix * normal;
  vNormal = normalize(transformedNormal);
  gl_Position = projectionMatrix * mvPosition;
}