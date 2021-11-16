var loadSvg = require('load-svg')
var parseXml = require('xml-parse-from-string')
var svgMesh3d = require('svg-mesh-3d')
var drawTriangles = require('draw-triangles-2d')

function extractSvgPath (svgDoc) {
  // concat all the <path> elements to form an SVG path string
  if (typeof svgDoc === 'string') {
    svgDoc = parseXml(svgDoc)
  }
  if (!svgDoc || typeof svgDoc.getElementsByTagName !== 'function') {
    throw new Error('could not get an XML document from the specified SVG contents')
  }

  var paths = Array.prototype.slice.call(svgDoc.getElementsByTagName('path'))
  return paths.reduce(function (prev, path) {
    var d = path.getAttribute('d') || ''
    return prev + ' ' + d.replace(/\s+/g, ' ').trim()
  }, '').trim()
}

var prefix = `// Created using Shadertoy-SVG: https://zduny.github.io/shadertoy-svg/
// For better performance, consider using buffers, see example: https://www.shadertoy.com/view/7lKGzR

`;

var postfix = `
bool sameSide( vec3 p1, vec3 p2, vec3 a, vec3 b ) {
    vec3 cp1 = cross(b-a, p1-a);
    vec3 cp2 = cross(b-a, p2-a);
      
    return dot(cp1, cp2) >= 0.0;
}

bool pointInTriangle( vec3 p, vec3 a, vec3 b, vec3 c ) {
    return sameSide(p, a, b, c) && sameSide(p, b, a, c) && sameSide(p, c, a, b);
}

bool inPath( vec2 p ) {
    for (int i=0; i<len; i++) {
        ivec3 triangle = triangles[i];
        vec3 a = positions[triangle[0]];
        vec3 b = positions[triangle[1]];
        vec3 c = positions[triangle[2]];
  
        if (pointInTriangle(vec3(p, 0.0), a, b, c)) {
            return true;
        }
    }
  
    return false;
}

vec2 rotate( vec2 v, float a ) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, -s, s, c);
    return m * v;
}
      
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    float step = 1.0 / iResolution.y;
  
    fragColor = vec4(vec3(0.0), 1.0);
    vec2 uv = fragCoord/iResolution.xy;
    uv *= 2.0;
    uv -= vec2(1.0);
    uv.x *= iResolution.x/iResolution.y;
    uv *= 1.4;
    uv = rotate(uv, iTime * 0.2);

    if (inPath(uv)) {
        fragColor = vec4(1.0);
    }
}`;

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
          var path = extractSvgPath(svg);
          var mesh = svgMesh3d(path, JSON.parse(options.value));

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

          var len = "const int len = " + mesh.cells.length + ";";

          output.value = prefix + positions + "\n" + triangles + "\n" + len + "\n" + postfix;

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
