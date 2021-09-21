let w,h;

let canvas,context;

let renderer;
let render;
let uniforms;

let reset;

let hash;  
let mouse, mouse_pressed;

let epsilon;
let trace_distance;
let aa;

let eps;
let dist;
let steps;

let cam,scene,geometry,mesh,shader_material,fov;
let material,field;

let uniforms;
let render;

function init() {

canvas = $('#canvas')[0];
w = window.innerWidth;
h = window.innerHeight; 

canvas.width  = w;
canvas.height = h;

renderer = new THREE.WebGLRenderer({canvas:canvas});

aa = 2;
aspect = w/h;
fov = 45.0;
trace_distance = 500.0;
epsilon = 0.0001;
hash = 10095;

cam = new THREE.PerspectiveCamera(fov,aspect,1,trace_distance);

cam.position.set(0.0,2.0,-5.0);
cam_target  = new THREE.Vector3(0.0);

$('#epsilon').val(epsilon);
$('#hash').val(hash.toFixed(8));
$('#trace_distance').val(trace_distance);

controls = new THREE.OrbitControls(cam,canvas);
    controls.minDistance = 1.5;
    controls.maxDistance = 25.0;
    controls.target = cam_target;
    controls.enableDamping = true;
    controls.enablePan = false; 
    controls.enabled = true; 

scene = new THREE.Scene();
geometry = new THREE.PlaneBufferGeometry(2,2);

uniforms = {

    "time"                : { value : 1.0 },
    "resolution"          : new THREE.Uniform(new THREE.Vector2(w,h)),
    "mouse"               : new THREE.Uniform(new THREE.Vector2()),
    "aa"                  : { value : aa },
    "camPos"              : new THREE.Uniform(new THREE.Vector3(cam_target)),
    "seed"                : { value: hash }, 
    "eps"                 : { value: epsilon },
    "trace_distance"      : { value: trace_distance },
    "field"               : { value: field },
    "material"            : { value: material },
    "texture"             : { type : "t", value: texture }

};   

}

init();

ShaderLoader("render.vert","render.glsl",

    function(vertex,fragment) {
        shader_material = new THREE.ShaderMaterial({

        uniforms : uniforms,
        vertexShader : vertex,
        fragmentShader : fragment
        
        });

    mesh = new THREE.Mesh(geometry,shader_material);

        scene.add(mesh);
       
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w,h);

        render = function(timestamp) {
      
        raycaster.setFromCamera(mouse,cam);

        requestAnimationFrame(render);
    
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
    });

$('#update_hash').click(function() {
    hash = parseFloat($('#hash').val());
}); 

$('#field').change(function() {
    field = $('#field').val();
});

$('#material').change(function() {
    material = $('#material').val();
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