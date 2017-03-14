// Using edan kwans custom threejs build for MultiRenderTargets: https://github.com/mrdoob/three.js/pull/9358/commits/9b4824fd2753ba8a214c40d39a378dc43004d129
require('./effects/EffectComposer')

const AdditiveShaderDef = require('./shaders/Additive')
const GodraysShaderDef = require('./shaders/Godrays')
const PassthroughShaderDef = require('./shaders/Passthrough')
const PhongPlusOcclusionShaderDef = require('./shaders/PhongPlusOcclusion')
const DirectionalBlurShaderDef = require('./shaders/DirectionalBlur')

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const renderer = new THREE.WebGLRenderer({
  canvas
})
if ( !renderer.extensions.get('WEBGL_draw_buffers') ) {
  alert("WEBGL_draw_buffers unsupported")
}

const target = new THREE.WebGLMultiRenderTarget(window.innerWidth, window.innerHeight)
target.texture.format = THREE.RGBFormat;
target.texture.minFilter = THREE.NearestFilter;
target.texture.magFilter = THREE.NearestFilter;
target.texture.type = THREE.FloatType;
target.texture.generateMipmaps = false;
target.stencilBuffer = false;
target.depthBuffer = true;

// Add an attachment for normals
target.attachments.push( target.texture.clone() );

// Name our G-Buffer attachments for debugging
target.attachments[0].name = 'diffuse';
target.attachments[1].name = 'normal';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  45, canvas.width / canvas.height, 1, 1000)
camera.position.z = 10
camera.lookAt(new THREE.Vector3())


var material = new THREE.RawShaderMaterial(PhongPlusOcclusionShaderDef);


const lightMaterial = material.clone()

lightMaterial.uniforms.isLightSource.value = 1.0
 
const lightSource = new THREE.Mesh(
  new THREE.SphereBufferGeometry(1, 32,32),
  lightMaterial
)
scene.add(lightSource)

const occluderMaterial = material.clone()
occluderMaterial.uniforms.isLightSource.value = 0.0
occluderMaterial.uniforms.color.value = [0.7, 0.1, 0.3]
const occluder = new THREE.Mesh(
  new THREE.TorusBufferGeometry(1.5, .1, 32, 32),
  occluderMaterial
)
scene.add(occluder)
const occluder2 = new THREE.Mesh(
  new THREE.TorusBufferGeometry(1.85, .1, 32, 64),
  occluderMaterial
)
scene.add(occluder2)
const occluder3 = new THREE.Mesh(
  new THREE.TorusBufferGeometry(2.2, .1, 12, 64),
  occluderMaterial
)
scene.add(occluder3)

const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
var postMaterial = new THREE.RawShaderMaterial(PassthroughShaderDef);
postMaterial.uniforms.tDiffuse.value = target.attachments[0]
var postPlane = new THREE.PlaneGeometry(2, 2);
var postQuad = new THREE.Mesh(postPlane, postMaterial);
postScene = new THREE.Scene();
postScene.add(postQuad);

const hblur = new THREE.ShaderPass(DirectionalBlurShaderDef)
const vblur = new THREE.ShaderPass(DirectionalBlurShaderDef)

var bluriness = 2;
hblur.uniforms.h.value = bluriness / window.innerWidth;
vblur.uniforms.v.value = bluriness / window.innerHeight;
var composer = new THREE.EffectComposer(renderer)
composer.addPass(new THREE.RenderPass(postScene, postCamera))
composer.addPass(hblur)
composer.addPass(vblur)
composer.addPass(hblur)
composer.addPass(vblur)
const Godrays = require('./shaders/Godrays')
Godrays.uniforms.fExposure.value = 0.23
Godrays.uniforms.fDecay.value = 0.91
Godrays.uniforms.fDensity.value = 0.9
var grPass = new THREE.ShaderPass( Godrays );

grPass.needsSwap = true;
composer.addPass(grPass)
var additive = new THREE.ShaderPass(AdditiveShaderDef)
additive.uniforms.tAdd.value = target.attachments[1]
additive.uniforms.fCoeff.value = 0.5
additive.renderToScreen = true
additive.needsSwap = true
composer.addPass(additive)

function render(t) {
  requestAnimationFrame(render)
  renderer.render(scene, camera, target)  
  // occluder.position.set(2.2 * Math.cos(t/ 2000), 0, 2.2 * Math.sin(t / 2000))
  occluder.rotation.x += 0.01
  occluder.rotation.y += 0.03
  occluder2.rotation.x -= 0.01
  occluder2.rotation.y += 0.02
  occluder3.rotation.x += 0.01
  occluder3.rotation.y -= 0.02
  composer.render()
}
render()