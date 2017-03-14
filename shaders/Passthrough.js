module.exports = {
  uniforms: {
    tDiffuse: { type: 't', value: null }
  },
  vertexShader: `
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    attribute vec4 position;
    attribute vec2 uv;
    varying vec2 vUv;

    void main() {
    	vUv = uv;
    	gl_Position = projectionMatrix * modelViewMatrix * position;
    }
  `,
  fragmentShader: `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `
}