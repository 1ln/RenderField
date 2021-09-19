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

    "u_time"                : { value : 1.0 },
    "u_resolution"          : new THREE.Uniform(new THREE.Vector2(w,h)),
    "u_mouse"               : new THREE.Uniform(new THREE.Vector2()),
    "u_mouse_pressed"       : { value : mouse_pressed },
"u_cam_target"          : new THREE.Uniform(new THREE.Vector3(cam_target)),
    "u_hash"                : { value: hash }, 
    "u_epsilon"             : { value: epsilon },
    "u_trace_distance"      : { value: trace_distance },
    "u_texture"             : { type : "t", value: texture }


};   

defines = {

    FIELD : field,
    COLOR : color,
    LIGHT : light

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

        uniforms["u_time"                ].value = performance.now();
        uniforms["u_mouse"               ].value = mouse;
        uniforms["u_mouse_pressed"       ].value = mouse_pressed;
        uniforms["u_cam_target"          ].value = cam_target;
        uniforms["u_hash"                ].value = hash;
        uniforms["u_epsilon"             ].value = epsilon;
        uniforms["u_trace_distance"      ].value = trace_distance;
        uniforms["u_texture"             ].value = texture;         

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

$('#color').change(function() {
    color = $('#color').val();
});

$('#light').change(function() {
    light = $('#light').val();
});

$('#eps').change(function() {
    epsilon = parseFloat($('#eps').val());
});

$('#d').change(function() {
    trace_distance = parseFloat($('#d').val());
});

$('#ta').click(function() {
        
         cam_target.position.set( 
         parseFloat($('#x').val()),
         parseFloat($('#y').val()),
         parseFloat($('#z').val())
         ); 


}); 

window.addEventListener('mousemove',onMouseMove,false);

function onMouseMove(event) {
    mouse.x = (event.clientX / w) * 2.0 - 1.0; 
    mouse.y = -(event.clientY / h) * 2.0 + 1.0;
}
