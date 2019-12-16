//Sine wave interpolation
//Signed Distance using raymarching
//Dan Olson 2019

precision mediump float;

varying vec2 vUv;
varying vec2 vtc;

uniform float u_hash;
uniform vec2 u_mouse;
uniform int u_swipe_dir;
uniform vec2 u_resolution;
uniform vec3 u_cam_target;
uniform float u_time;
uniform float u_angle;
uniform float u_df;
uniform float u_df2;
uniform vec3 u_diffuse_col;
uniform vec3 u_diffuse_b;
uniform vec3 u_diffuse_c;
uniform vec3 u_diffuse_d;
uniform int u_diffuse_noise;

const float PI  =  3.1415926;
const float PI_2 = 2.0 * PI;
const float PI6 = 6.0 * PI;
const float PI_6 = 6.0/PI;
const float PHI =  1.6180339;
const float PHI_INV = 1.0/PHI;
const float PHI_SPHERE = 1.0 - PHI/6.0;

const int MARCH_STEPS = 128;

const float EPSILON = 0.0001;
const float TRACE_DIST = 1000.0;

float hash(float h) { return fract(sin(h) * u_hash *  43758.5453 ); }

//float hash(float h) { 
//return fract(PHI/log(23324.0 ) * h  * 981123324.0  );
//}

vec3 hash3(vec3 x) {
 
    x = vec3(dot(x,vec3(45.0,325.0,2121.455)), 
             dot(x,vec3(122.34,109.0,592.0)),
             dot(x,vec3(67.0,322.4364,1235.0)));

    return fract(sin(x) * 92352.3635 * u_hash);
}
 
float cell(vec3 x,int type) {
 
    x *= 35.0;

    vec3 p = floor(x);
    vec3 f = fract(x);
 
    float min_dist = 1.0;
    
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            for(int k = -1; k <= 1; k++) { 

                vec3 b = vec3(float(k),float(j),float(i));
                vec3 r = hash3(p + b);
                vec3 diff = (b + r - f);

                float d = length(diff);

                    if(type == 0) { 
                        min_dist = min(min_dist,d);
                    }
 
                    if(type == 1) {
                        min_dist = min(min_dist,abs(diff.x)+abs(diff.y)+abs(diff.z));
                    }

                    if(type == 2) {
                        min_dist = min(min_dist,max(abs(diff.x),max(abs(diff.y),abs(diff.z))));
                    }

            }
        }
    }
 
    return min_dist;  

}

float noise3d(vec3 x) {

    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f * f * (3.0 - 2.0 * f);
 
    float n = p.x + p.y * 157.0 + 113.0 * p.z;

    return mix(mix(mix(hash(n + 0.0),hash(n + 1.0),f.x), 
                   mix(hash(n + 157.0),hash(n + 158.0),f.x),f.y),
               mix(mix(hash(n + 113.0),hash(n + 114.0),f.x),
                   mix(hash(n + 270.0),hash(n + 271.0),f.x),f.y),f.z);
} 

float fractal312(vec3 x,int octaves) {

    float value = 0.0;
    float h  = .5;
    float g = exp2(-h); 
    float amp = 0.5;
    float freq = 1.0;

    if(octaves >= 1)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 2)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 3)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 4)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 5)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 6)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; } 
    if(octaves >= 7)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 8)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; } 
    if(octaves >= 9)  { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 10) { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 11) { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }
    if(octaves >= 12) { value += amp * noise3d(freq * x); freq *= 2.0; amp *= g; }

    return value;
}

float distortFractal(vec3 p,float f,int octaves) {
    
    vec3 q = vec3(fractal312(p + vec3(0.0,0.0,1.0),octaves),      
                  fractal312(p + vec3(4.5,1.8,6.3),octaves),
                  fractal312(p + vec3(1.1,7.2,2.4),octaves)
    );

    vec3 r = vec3(fractal312(p + f*q + vec3(2.1,9.4,5.1),octaves),
                  fractal312(p + f*q + vec3(5.6,3.7,8.9),octaves),
                  fractal312(p + f*q + vec3(4.3,0.0,3.1),octaves) 
    ); 

    return fractal312(p + f * r,octaves);
} 

float linear(float x) {

    return x;
}

float power(float x,float f) {

    return pow(x,f);
}

float envImpulse(float x,float k) {

    float h = k * x;
    return h * exp(1.0 - h);
}

float envStep(float x,float k,float n) {

    return exp(-k * pow(x,n));
}

float cubicImpulse(float x,float c,float w) {

    x = abs(x - c);
    if( x > w) { return 0.0; }
    x /= w;
    return 1.0 - x * x  * (3.0 - 2.0 * x);

}

float sincPhase(float x,float k) {

    float a = PI * (k * x - 1.0);
    return sin(a)/a;
}

vec3 fmCol(float t,vec3 a,vec3 b,vec3 c,vec3 d) {
    
    return a + b * cos(PI_2*(c*t+d));
}

//Rotation,translation,scale

mat4 rotAxis(vec3 axis,float theta) {

axis = normalize(axis);

    float c = cos(theta);
    float s = sin(theta);

    float oc = 1.0 - c;

    return mat4( 
        oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
        0.0,0.0,0.0,1.0);

}

mat4 translate(vec3 p) {
 
    return mat4(
        vec4(1,0,0,p.x),
        vec4(0,1,0,p.y),
        vec4(0,0,1,p.z),
        vec4(0,0,0,1)  
);
}

vec3 repeatLimit(vec3 p,float c,vec3 l) {
  
    vec3 q = p - c * clamp( floor((p/c)+0.5) ,-l,l);
    return q; 
}

vec3 repeat(vec3 p,vec3 s) {
   
    vec3 q = mod(p,s) - 0.5 * s;
    return q;
}

float reflectx(vec3 p) {
    
   return p.x = abs(p.x);
} 

vec2 opU(vec2 d1,vec2 d2) {

    return (d1.x < d2.x) ? d1 : d2;
} 

float opIf(float d1,float d2) {

    return max(d1,d2);
}

float opSf(float d1,float d2) {

    return max(-d1,d2);
}

float smou(float d1,float d2,float k) {

    float h = clamp(0.5 + 0.5 * (d2-d1)/k,0.0,1.0);
    return mix(d2,d1,h) - k * h * (1.0 - h);
}

float smoD(float d1,float d2,float k) {

    float h = clamp(0.5 - 0.5 * (d2+d1)/k,0.0,1.0);
    return mix(d2,-d1,h) + k * h * (1.0 - h);
}

float smoI(float d1,float d2,float k) {

    float h = clamp(0.5 + 0.5 * (d2-d1)/k,0.0,1.0);
    return mix(d2,d1,h) + k * h * (1.0 - h);
}

//Entire scene can be rounded by increasing epsilon const
float rounding(float d,float h) { 

    return d - h;
}

float concentric(float d,float h) {

    return abs(d) - h;
}

//3d Distance Field Geometry

float sphere(vec3 p,float r) { 
     
    return length(p) - r;
}

float sphereNegativeInterior(vec3 p,float r) {

    return abs(length(p)-r);
}

float ellipsoid(vec3 p,vec3 r) {

    float k0 = length(p/r); 
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float cone(vec3 p,vec2 c) {

    float q = length(p.xy);
    return dot(c,vec2(q,p.z));
}

float roundedCone(vec3 p,float r1,float r2,float h) {

    vec2 q = vec2(length(vec2(p.x,p.z)),p.y);
    float b = (r1-r2)/h;
    float a = sqrt(1.0 - b*b);
    float k = dot(q,vec2(-b,a));

    if( k < 0.0) return length(q) - r1;
    if( k > a*h) return length(q - vec2(0.0,h)) - r2;

    return dot(q,vec2(a,b)) - r1;
}

float solidAngle(vec3 p,vec2 c,float ra) {
    
    vec2 q = vec2(length(vec2(p.x,p.z)),p.y);
    float l = length(q) - ra;
    float m = length(q - c * clamp(dot(q,c),0.0,ra));
    return max(l,m * sign(c.y * q.x - c.x * q.y));
}

float link(vec3 p,float le,float r1,float r2) {

    vec3 q = vec3(p.x,max(abs(p.y) -le,0.0),p.z);
    return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

float plane(vec3 p,vec4 n) {

    return dot(p,n.xyz) + n.w;
}

float capsule(vec3 p,vec3 a,vec3 b,float r) {

    vec3 pa = p - a;
    vec3 ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
    return length(pa - ba * h) - r;
} 

float prism(vec3 p,vec2 h) {

    vec3 q = abs(p);
    return max(q.z - h.y,max(q.x * 0.866025 + p.y * 0.5,-p.y) - h.x * 0.5); 
}

float box(vec3 p,vec3 b) {

    vec3 d = abs(p) - b;
    return length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0);
}

float roundBox(vec3 p,vec3 b,float r) {

    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float torus(vec3 p,vec2 t) {

    vec2 q = vec2(length(vec2(p.x,p.z)) - t.x,p.y);
    return length(q) - t.y; 
}

float cylinder(vec3 p,float h,float r) {
    
    float d = length(vec2(p.x,p.z)) - r;
    d = max(d, -p.y - h);
    d = max(d, p.y - h);
    return d; 
}

float hexPrism(vec3 p,vec2 h) {
 
    const vec3 k = vec3(-0.8660254,0.5,0.57735);
    p = abs(p); 
    p.xy -= 2.0 * min(dot(k.xy,p.xy),0.0) * k.xy;
 
    vec2 d = vec2(length(p.xy - vec2(clamp(p.x,-k.z * h.x,k.z * h.x),h.x)) * sign(p.y-h.x),p.z-h.y);
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float octahedron(vec3 p,float s) {

    p = abs(p);

    float m = p.x + p.y + p.z - s;
    vec3 q;

    if(3.0 * p.x < m) {
       q = vec3(p.x,p.y,p.z);  
    } else if(3.0 * p.y < m) {
       q = vec3(p.y,p.z,p.x); 
    } else if(3.0 * p.z < m) { 
       q = vec3(p.z,p.x,p.y);
    } else { 
       return m * 0.57735027;
    }

    float k = clamp(0.5 *(q.z-q.y+s),0.0,s);
    return length(vec3(q.x,q.y-s+k,q.z - k)); 
}
   
vec2 scene(vec3 p) { 

vec3 q = vec3(p);

float s  = 0.0001;
float t  = u_time; 
float a  = u_angle;
vec3 rl  = vec3(0.0);

vec2 res   = vec2(0.0);

mat4 r = rotAxis(vec3(1.0,0.0,0.0),a);
p = (vec4(p,1.0) * r).xyz;

rl = repeatLimit(p,1.0, vec3(1.0));

float df  = floor(u_df * 13.0);
//float df = 10.0;

if(df == 0.0)  { res = vec2( sphere(p,1.0),0.0); }
if(df == 1.0)  { res = vec2( torus(p,vec2(1.0,0.5)),1.0); }
if(df == 2.0)  { res = vec2( box(p,vec3(1.0)),2.0); } 
if(df == 3.0)  { res = vec2( hexPrism(p,vec2(1.0,0.5)),3.0); } 
if(df == 4.0)  { res = vec2( prism(p,vec2(1.0,0.5)),4.0); }
if(df == 5.0)  { res = vec2( cylinder(p,1.0,0.5),5.0); }
if(df == 6.0)  { res = vec2( link(p,0.75,1.0,0.75),6.0); }
if(df == 7.0)  { res = vec2( capsule(p,vec3(0.0,1.0,0.0),vec3(0.0,-1.0,0.0),0.25),7.0); }
if(df == 8.0)  { res = vec2( octahedron(p,1.0),8.0); }
if(df == 9.0)  { res = vec2( roundBox(p,vec3(1.0),0.15),9.0); }
if(df == 10.0) { res = vec2( max(-sphere(p,1.0),box(p,vec3(1.0 - PHI/6.0))),10.0); }
if(df == 11.0) { res = vec2( max(-sphere(p,1.0),sphere(p - vec3(0.0,0.0,1.0),1.0)),11.0); }
if(df == 12.0) { res = vec2( box(p * rl,vec3(1.0)),12.0); } 
if(df == 13.0) { res = vec2( smou(box(p-vec3(0.0,1.0,0.0),vec3(1.0)) ,box(p-vec3(0.0,-1.0,0.0),vec3(1.0)),0.25)); }

return res;
}

vec2 rayScene(vec3 ro,vec3 rd) {
    
    float depth = 0.0;
    float d = -1.0;

    for(int i = 0; i < MARCH_STEPS; ++i) {

        vec3 p = ro + depth * rd;
        vec2 dist = scene(p);
   
        if(dist.x < EPSILON || TRACE_DIST < dist.x ) { break; }
        depth += dist.x;
        d = dist.y;

        }
 
        if(TRACE_DIST < depth) { d = -1.0; }
        return vec2(depth,d);

}

vec3 calcNormal(vec3 p) {

    vec2 e = vec2(1.0,-1.0) * EPSILON;

    return normalize(vec3(
    vec3(e.x,e.y,e.y) * scene(p + vec3(e.x,e.y,e.y)).x +
    vec3(e.y,e.x,e.y) * scene(p + vec3(e.y,e.x,e.y)).x +
    vec3(e.y,e.y,e.x) * scene(p + vec3(e.y,e.y,e.x)).x + 
    vec3(e.x,e.x,e.x) * scene(p + vec3(e.x,e.x,e.x)).x

    ));

}

vec3 phongModel(vec3 kd,vec3 ks,float alpha,vec3 p,vec3 cam_ray,vec3 light_pos,vec3 intensity) {  

     vec3 n = calcNormal(p);

     vec3 l = normalize(light_pos - p);

     vec3 v = normalize(cam_ray - p);
     vec3 r = normalize(reflect(-l,n));

     float ln = clamp(dot(l,n),0.0,1.0);
     float rv = dot(r,v);

     if(ln < 0.0) {
         return vec3(0.0);  
     }

     if(rv < 0.0) {
         return intensity * (kd * ln);
     }

     return intensity * (kd * ln + ks * pow(rv,alpha));
}

vec3 phongLight(vec3 ka,vec3 kd,vec3 ks,float alpha,vec3 p,vec3 cam_ray) {

     const vec3 ambient_light = 0.5  * vec3(1.0,1.0,1.0);
     vec3 color = ka * ambient_light;  
     
     vec3 light  = vec3( 0.0,0.0,10.0 ) ;
     vec3 intensity = vec3(1.0);
   
     vec3 light2 = vec3(0.0,10.0,0.0);


     color += phongModel(kd,ks,alpha,p,cam_ray,light2,vec3(1.0));
     color += phongModel(kd,ks,alpha,p,cam_ray,light,intensity); 
    
     return color;
}

vec3 rayCamDir(vec2 uv,vec3 camPosition,vec3 camTarget) {

     vec3 camForward = normalize(camTarget - camPosition);
     vec3 camRight = normalize(cross(vec3(0.0,1.0,0.0),camForward));
     vec3 camUp = normalize(cross(camForward,camRight));

     float fPersp = 1.0;

     vec3 vDir = normalize(uv.x * camRight + uv.y * camUp + camForward * fPersp);  

     return vDir;
}

vec3 render(vec3 ro,vec3 rd) {

    vec3 color = vec3(0.0);

    vec2 d = rayScene(ro, rd);

vec3 p = ro + rd * d.x;

vec3 kd = vec3(0.0);
vec3 ka = vec3(0.0);
vec3 ks = vec3(0.0);

float shininess = 10.0;
float n = 0.0;

    if(d.x > TRACE_DIST - EPSILON) {

        color = vec3(0.0);

    } else {

      if(u_diffuse_noise == 0) {
      n = distortFractal(p,4.0,6);
      }

      if(u_diffuse_noise == 1) {
      n = fractal312(p,6); 
      } 
      
      if(u_diffuse_noise == 2) {
      n = cell(p,1);
      }

      if(u_diffuse_noise == 3) {
      n = cell(p + fractal312(p,6),2);
      }
      
      if(u_diffuse_noise == 4) {
      n = distortFractal(p + cell(p,3),4.0,6);
      }

      if(u_diffuse_noise == 5) {
      n = fractal312(p,4);
      }

      kd = fmCol(p.y+n,vec3(u_diffuse_col),vec3(u_diffuse_b),vec3(u_diffuse_c),vec3(u_diffuse_d));
 
      vec3 ka = vec3(0.0); 
      vec3 ks = vec3(1.0);

      color = phongLight(ka,kd,ks,shininess,p,ro);

}

      return color;
}

void main() {
 
vec3 cam_pos = cameraPosition;
vec3 cam_target = u_cam_target;

mat4 cam_rot = rotAxis(vec3(0.0,1.0,0.0),u_time * 0.0001);
//cam_pos = (vec4(cam_pos,1.0) * cam_rot).xyz;

vec2 uvu = -1.0 + 2.0 * vUv.xy;

uvu.x *= u_resolution.x/u_resolution.y; 

vec3 direction = rayCamDir(uvu,cam_pos,cam_target);

vec3 color = render(cam_pos,direction);

gl_FragColor = vec4(color,1.0);

}
