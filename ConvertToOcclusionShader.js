module.exports = function(materialDef) {
  console.log(materialDef)
  materialDef.uniforms.isLightSource = {type: 'f', value: 0}
  materialDef.fragmentShader = materialDef.fragmentShader.replace(/gl_FragColor/g, 'gl_FragData[1]')
  var lines = materialDef.fragmentShader.split('\n')
  var index = lines.findIndex((l) => console.log(l) && l.indexOf('gl_FragData') != -1)
  console.log("index", index)
  lines.splice(index, 0, 'gl_FragData[0] = vec4(isLightSource, isLightSource, isLightSource, 1.0);')
  materialDef.fragmentShader = lines.join('\n')
}