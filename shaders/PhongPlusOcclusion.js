module.exports = {
  uniforms: {
    color: {type: 'v3', value: [0.0, 0.0, 0.0]},
    isLightSource: {type: 'f', value: 1.0}
  },
  vertexShader: `
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
  `,
  fragmentShader: `
    #extension GL_EXT_draw_buffers : require
    precision mediump float;

    uniform vec3 color;
    uniform float isLightSource;
    varying vec3 vNormal;

    void main() {
      // write color to G-Buffer
      gl_FragData[0] = vec4(isLightSource, isLightSource, isLightSource, 1.0);

      // write normals to G-Buffer
      vec3 lightPos = vec3(0.0, 0.0, 1.0);
      float lightPower = dot(lightPos, vNormal);
      gl_FragData[1] = vec4(lightPower * color, 0.0);
    }
  `
}