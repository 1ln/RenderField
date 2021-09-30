let w,h;

let canvas,context;

let renderer;
let render;
let uniforms;

let hash;  
let cam,scene,geometry,mesh,shader_material,fov;
let material,field;
let controls;

function init() {

canvas = $('#canvas')[0];
context = canvas.getContext('webgl2');

w = window.innerWidth;
h = window.innerHeight; 

renderer = new THREE.WebGLRenderer({canvas:canvas,context:context });

hash = 10095;

cam = new THREE.PerspectiveCamera(45.,w/h,0.,1.);

$('#hash').val(hash.toFixed(8));

controls = new THREE.OrbitControls(cam,canvas);
    controls.minDistance = 1.5;
    controls.maxDistance = 25.0;
    controls.enableDamping = true;
    controls.enablePan = false; 
    controls.enabled = true; 

scene = new THREE.Scene();
geometry = new THREE.PlaneBufferGeometry(2,2);

uniforms = {

    "time"                : { value : 1.0 },
    "resolution"          : new THREE.Uniform(new THREE.Vector2(w,h)),
    "seed"                : { value: hash }, 
    "field"               : { value: field },
    "material"            : { value: material }
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
      
        requestAnimationFrame(render);
    
        uniforms["time"                ].value = performance.now();
        uniforms["field"               ].value = field;
        uniforms["material"            ].value = material;

        controls.update();
        renderer.render(scene,cam);
    
        }
        render();
    })

$('#update_hash').click(function() {
    hash = parseInt($('#hash').val());
}); 

$('#field').change(function() {
    field = $('#field').val();
});

$('#material').change(function() {
    material = $('#material').val();
});