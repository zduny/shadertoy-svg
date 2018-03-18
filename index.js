var loadSvg = require('load-svg')
var parsePath = require('extract-svg-path').parse
var svgMesh3d = require('svg-mesh-3d')
var drawTriangles = require('draw-triangles-2d')

function shadertoy_svg() {
  var input = document.getElementById("file");
  var parse = document.getElementById("parse");
  var options = document.getElementById("options");
  var output = document.getElementById("output");
  var canvas = document.getElementById("canvas");

  function draw(mesh) {
    var c = canvas.getContext("2d");

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    c.clearRect(0, 0, canvas.width, canvas.height);
    var mx = canvas.width / 2;
    var my = canvas.height / 2;
    var m = canvas.height / 2;

    c.save();

    c.translate(mx, my);
    c.scale(m, -m);

    c.beginPath();
    drawTriangles(c, mesh.positions, mesh.cells);
    c.fillStyle = 'black';
    c.fill();

    c.restore();
  }

  function parseSVG() {
    if (input.files.length === 1) {
      var reader = new FileReader();

      reader.onload = function () {
        try {
          var svg = reader.result;
          var svgPath = parsePath(svg);
          var mesh = svgMesh3d(svgPath, JSON.parse(options.value));

          draw(mesh);
        } catch (e) {
          output.value = "Error occured:\n"
          output.value += e;
        }
      }

      reader.readAsText(input.files[0]);
    }
  }

  input.onchange = function () {
    parseSVG();
  }

  parse.onclick = function() {
    parseSVG();
  }
}

shadertoy_svg();