var loadSvg = require('load-svg')
var parsePath = require('extract-svg-path').parse
var svgMesh3d = require('svg-mesh-3d')
var drawTriangles = require('draw-triangles-2d')

function zip(a, b) {
  return a.map(function (it, i) {
    [it, b[i]];
  });
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  zip(a, b).reduce(function (d, v) {
    return d + v[0] * v[1];
  });
}

function subtract(a, b) {
  return a.map(function (it, i) {
    it - b[i];
  });
}

function sameSide(p1, p2, a, b) {
  cp1 = cross(subtract(b, a), subtract(p1, a));
  cp2 = cross(subtract(b, a), subtract(p2, a));
  return dot(cp1, cp2) >= 0;
}

function pointInTriangle(p, a, b, c) {
  return sameSide(p, a, b, c) && sameSide(p, b, a, c) && sameSide(p, c, a, b)
}

function shadertoy_svg() {
  var input = document.getElementById("file");
  var parse = document.getElementById("parse");
  var options = document.getElementById("options");
  var output = document.getElementById("output");
  var canvas = document.getElementById("canvas");

  new ClipboardJS("#copy");

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

          var positions = "const vec3 positions[" + mesh.positions.length + "] = ";
          positions += "vec3[" + mesh.positions.length + "](" +
            mesh.positions.map(function (it) {
              return "vec3(" + it.join(", ") + ")";
            }).join(", ") +
            ");";

          var triangles = "const ivec3 triangles[" + mesh.cells.length + "] = ";
          triangles += "ivec3[" + mesh.cells.length + "](" +
            mesh.cells.map(function (it) {
              return "ivec3(" + it.join(", ") + ")";
            }).join(", ") +
            ");";

          output.value = positions + "\n" + triangles;

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

  parse.onclick = function () {
    parseSVG();
  }
}

shadertoy_svg();