(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */

THREE.CopyShader = {

	uniforms: {

		"tDiffuse": { value: null },
		"opacity":  { value: 1.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform float opacity;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D( tDiffuse, vUv );",
			"gl_FragColor = opacity * texel;",

		"}"

	].join( "\n" )

};

},{}],2:[function(require,module,exports){

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.EffectComposer = function ( renderer, renderTarget ) {

	this.renderer = renderer;

	if ( renderTarget === undefined ) {

		var parameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
		};
		var size = renderer.getSize();
		renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, parameters );

	}

	this.renderTarget1 = renderTarget;
	this.renderTarget2 = renderTarget.clone();

	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;

	this.passes = [];

	if ( THREE.CopyShader === undefined )
		console.error( "THREE.EffectComposer relies on THREE.CopyShader" );

	this.copyPass = new THREE.ShaderPass( THREE.CopyShader );

};

Object.assign( THREE.EffectComposer.prototype, {

	swapBuffers: function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	},

	addPass: function ( pass ) {

		this.passes.push( pass );

		var size = this.renderer.getSize();
		pass.setSize( size.width, size.height );

	},

	insertPass: function ( pass, index ) {

		this.passes.splice( index, 0, pass );

	},

	render: function ( delta ) {

		var maskActive = false;

		var pass, i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

			pass = this.passes[ i ];

			if ( pass.enabled === false ) continue;

			pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

			if ( pass.needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.context;

					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

					context.stencilFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

			if ( THREE.MaskPass !== undefined ) {

				if ( pass instanceof THREE.MaskPass ) {

					maskActive = true;

				} else if ( pass instanceof THREE.ClearMaskPass ) {

					maskActive = false;

				}

			}

		}

	},

	reset: function ( renderTarget ) {

		if ( renderTarget === undefined ) {

			var size = this.renderer.getSize();

			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize( size.width, size.height );

		}

		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

	},

	setSize: function ( width, height ) {

		this.renderTarget1.setSize( width, height );
		this.renderTarget2.setSize( width, height );

		for ( var i = 0; i < this.passes.length; i ++ ) {

			this.passes[i].setSize( width, height );

		}

	}

} );


THREE.Pass = function () {

	// if set to true, the pass is processed by the composer
	this.enabled = true;

	// if set to true, the pass indicates to swap read and write buffer after rendering
	this.needsSwap = true;

	// if set to true, the pass clears its buffer before rendering
	this.clear = false;

	// if set to true, the result of the pass is rendered to screen
	this.renderToScreen = false;

};

Object.assign( THREE.Pass.prototype, {

	setSize: function( width, height ) {},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		console.error( "THREE.Pass: .render() must be implemented in derived pass." );

	}

} );


require('./RenderPass')
require('./ShaderPass')
require('./CopyShader')
require('./MaskPass')


},{"./CopyShader":1,"./MaskPass":3,"./RenderPass":4,"./ShaderPass":5}],3:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.MaskPass = function ( scene, camera ) {

	THREE.Pass.call( this );

	this.scene = scene;
	this.camera = camera;

	this.clear = true;
	this.needsSwap = false;

	this.inverse = false;

};

THREE.MaskPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.MaskPass,

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		var context = renderer.context;
		var state = renderer.state;

		// don't update color or depth

		state.buffers.color.setMask( false );
		state.buffers.depth.setMask( false );

		// lock buffers

		state.buffers.color.setLocked( true );
		state.buffers.depth.setLocked( true );

		// set up stencil

		var writeValue, clearValue;

		if ( this.inverse ) {

			writeValue = 0;
			clearValue = 1;

		} else {

			writeValue = 1;
			clearValue = 0;

		}

		state.buffers.stencil.setTest( true );
		state.buffers.stencil.setOp( context.REPLACE, context.REPLACE, context.REPLACE );
		state.buffers.stencil.setFunc( context.ALWAYS, writeValue, 0xffffffff );
		state.buffers.stencil.setClear( clearValue );

		// draw into the stencil buffer

		renderer.render( this.scene, this.camera, readBuffer, this.clear );
		renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		// unlock color and depth buffer for subsequent rendering

		state.buffers.color.setLocked( false );
		state.buffers.depth.setLocked( false );

		// only render where stencil is set to 1

		state.buffers.stencil.setFunc( context.EQUAL, 1, 0xffffffff );  // draw if == 1
		state.buffers.stencil.setOp( context.KEEP, context.KEEP, context.KEEP );

	}

} );


THREE.ClearMaskPass = function () {

	THREE.Pass.call( this );

	this.needsSwap = false;

};

THREE.ClearMaskPass.prototype = Object.create( THREE.Pass.prototype );

Object.assign( THREE.ClearMaskPass.prototype, {

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		renderer.state.buffers.stencil.setTest( false );

	}

} );

},{}],4:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

	THREE.Pass.call( this );

	this.scene = scene;
	this.camera = camera;

	this.overrideMaterial = overrideMaterial;

	this.clearColor = clearColor;
	this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 0;

	this.clear = true;
	this.clearDepth = false;
	this.needsSwap = false;

};

THREE.RenderPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.RenderPass,

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		this.scene.overrideMaterial = this.overrideMaterial;

		var oldClearColor, oldClearAlpha;

		if ( this.clearColor ) {

			oldClearColor = renderer.getClearColor().getHex();
			oldClearAlpha = renderer.getClearAlpha();

			renderer.setClearColor( this.clearColor, this.clearAlpha );

		}

		if ( this.clearDepth ) {

			renderer.clearDepth();

		}

		renderer.render( this.scene, this.camera, this.renderToScreen ? null : readBuffer, this.clear );

		if ( this.clearColor ) {

			renderer.setClearColor( oldClearColor, oldClearAlpha );

		}

		this.scene.overrideMaterial = null;
		renderer.autoClear = oldAutoClear;
	}

} );

},{}],5:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.ShaderPass = function ( shader, textureID ) {

	THREE.Pass.call( this );

	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

	if ( shader instanceof THREE.ShaderMaterial ) {

		this.uniforms = shader.uniforms;

		this.material = shader;

	} else if ( shader ) {

		this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

		this.material = new THREE.ShaderMaterial( {

			defines: shader.defines || {},
			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader

		} );

	}

	this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene = new THREE.Scene();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.quad.frustumCulled = false; // Avoid getting clipped
	this.scene.add( this.quad );

};

THREE.ShaderPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.ShaderPass,

	render: function( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer.texture;

		}

		this.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera );

		} else {

			renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		}

	}

} );

},{}],6:[function(require,module,exports){
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
},{"./effects/EffectComposer":2,"./shaders/Additive":7,"./shaders/DirectionalBlur":8,"./shaders/Godrays":9,"./shaders/Passthrough":10,"./shaders/PhongPlusOcclusion":11}],7:[function(require,module,exports){
module.exports = {
  uniforms: {
    tDiffuse: { type: "t", value: 0, texture: null },
    tAdd: { type: "t", value: 1, texture: null },
    fCoeff: { type: "f", value: 1.0 }
  },
  
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tAdd;
    uniform float fCoeff;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D( tDiffuse, vUv );
      vec4 add = texture2D( tAdd, vUv );
      gl_FragColor = texel + add * fCoeff;
    }
  `
}
},{}],8:[function(require,module,exports){
/**
 * Adapted from:
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Two pass Gaussian blur filter (horizontal and vertical blur shaders)
 * - described in http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
 *   and used in http://www.cake23.de/traveling-wavefronts-lit-up.html
 *
 * - 9 samples per pass
 * - standard deviation 2.7
 * - "h" and "v" parameters should be set to "1 / width" and "1 / height"
 */
module.exports = {
  uniforms: {
    tDiffuse: {value: null},
    // Horizontal blur amount
    h: {type: 'f', value: 0},
    // Vertical blur amount
    v: {type: 'f', value: 0}
  },
  
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float h;
    uniform float v;
    varying vec2 vUv;
    void main() {
    vec4 sum = vec4( 0.0 );
    sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y + 1.0 * v) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y + 2.0 * v) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y + 3.0 * v) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y + 4.0 * v) ) * 0.051;
    gl_FragColor = sum;
    }
  `
}

},{}],9:[function(require,module,exports){
module.exports = {
  uniforms: {
    tDiffuse: {type: "t", value:0, texture:null},
    centerX: {type: "f", value: 0.5},
    centerY: {type: "f", value: 0.5},
    fExposure: {type: "f", value: 0.6},
    fDecay: {type: "f", value: 0.93},
    fDensity: {type: "f", value: 0.96},
    fWeight: {type: "f", value: 0.4},
    fClamp: {type: "f", value: 1.0}
  },
  
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float centerX;
    uniform float centerY;
    uniform float fExposure;
    uniform float fDecay;
    uniform float fDensity;
    uniform float fWeight;
    uniform float fClamp;
    const int iSamples = 20;
    void main() {
      vec2 deltaTextCoord = vec2(vUv - vec2(centerX, centerY));
      deltaTextCoord *= 1.0 /  float(iSamples) * fDensity;
      vec2 coord = vUv;
      float illuminationDecay = 1.0;
      vec4 FragColor = vec4(0.0);
      for(int i=0; i < iSamples ; i++) {
        coord -= deltaTextCoord;
        vec4 texel = texture2D(tDiffuse, coord);
        texel *= illuminationDecay * fWeight;
        FragColor += texel;
        illuminationDecay *= fDecay;
      }
      FragColor *= fExposure;
      FragColor = clamp(FragColor, 0.0, fClamp);
      gl_FragColor = FragColor;
    }
  `  
}
},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{}]},{},[6]);
