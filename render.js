let w,h;
let canvas;

let aspect;
let renderer;

let nhash,hash;  
let mouse, mouse_pressed;

let epsilon;
let trace_distance;

let controls;

let cam,scene,geometry,mesh,material;
let fov;

let delta;
let clock;

let uniforms;
let render;

let defines;

function init() {

canvas = $('#canvas')[0];
w = window.innerWidth;
h = window.innerHeight; 

canvas.width  = w;
canvas.height = h;

renderer = new THREE.WebGLRenderer({canvas:canvas});

aspect = w/h;
fov = 45.0;
trace_distance = 500.0;

cam = new THREE.PerspectiveCamera(fov,aspect,1,trace_distance);

clock = new THREE.Clock(); 
delta = 0.0;

nhash = new Math.seedrandom();
hash = nhash();
$('#hash').val(hash.toFixed(8)); 

cam.position.set(0.0,0.0,-5.);
cam_target  = new THREE.Vector3(0.0);

epsilon = 0.0001;
$('#epsilon').val(epsilon);

controls = new THREE.OrbitControls(cam,canvas);
    controls.minDistance = 1.5;
    controls.maxDistance = 25.;
    controls.target = cam_target;
    controls.enableDamping = true;
    controls.enablePan = false; 
    controls.enabled = true  ; 

scene = new THREE.Scene();
geometry = new THREE.PlaneBufferGeometry(2,2);

uniforms = {

    "time"                : { value : 1.0 },
    "resolution"          : new THREE.Uniform(new THREE.Vector2(w,h)),
    "mouse"               : new THREE.Uniform(new THREE.Vector2()),
    "aa"                  : { value : mouse_pressed },
    "camPos"              : new THREE.Uniform(new THREE.Vector3(cam_target)),
    "seed"                : { value: hash }, 
    "eps"                 : { value: epsilon },
    "trace_distance"      : { value: trace_distance },
    
    "texture"             : { type : "t", value: texture }


};   

}
init();

ShaderLoader("render.vert","render.frag",
    function(vertex,fragment) {
        material = new THREE.ShaderMaterial({

        uniforms : uniforms,
        vertexShader : vertex,
        fragmentShader : fragment
        
        });

    mesh = new THREE.Mesh(geometry,material);

    scene.add(mesh);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w,h);

    render = function(timestamp) {
        requestAnimationFrame(render);
    
        delta = clock.getDelta();

        uniforms["time"                ].value = performance.now();
        uniforms["mouse"               ].value = mouse;
        uniforms["aa"                  ].value = aa;
        uniforms["camPos"              ].value = camPos;
        uniforms["seed"                ].value = hash;
        uniforms["eps"                 ].value = epsilon;
        uniforms["trace_distance"      ].value = trace_distance;
        uniforms["field"               ].value = field;
        uniforms["material"            ].value = material;
        uniforms["texture"             ].value = texture;         

        controls.update();
        renderer.render(scene,cam);
        }
        render();
        }) 

$('#update_hash').click(function() {
    hash = parseFloat($('#hash').val());
}); 

$('#field').change(function() {
    field = $('#field').val();
});

$('#material').change(function() {
    color = $('#material').val();
});

$('#eps').change(function() {
    epsilon = parseFloat($('#eps').val());
});

$('#d').change(function() {
    trace_distance = parseFloat($('#d').val());
});

window.addEventListener('mousemove',onMouseMove,false);

function onMouseMove(event) {
    mouse.x = (event.clientX / w) * 2.0 - 1.0; 
    mouse.y = -(event.clientY / h) * 2.0 + 1.0;
}
