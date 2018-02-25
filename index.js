var loadSvg = require('load-svg')
var parsePath = require('extract-svg-path').parse
var svgMesh3d = require('svg-mesh-3d')

var input = document.getElementById("file");
var output = document.getElementById("output");


input.onchange = function() {
  if (input.files.length === 1) {
    var svgPath = parsePath(input.files[0]);
    var mesh = svgMesh3d(svgPath)

    console.log(mesh);
  }
}