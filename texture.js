class Texture {

constructor(w,h) {

this.w = w;
this.h = h;

}

update() {

    let size = this.w * this.h;
    let tex = new Uint8Array(3 * size);

        for(let i = 0; i < size; ++i) {
                           
                let s =  i * 3;

                tex[s]     = Math.floor( 255 * nhash()    );
                tex[s+1]   = Math.floor( 255 * nhash()    );
                tex[s+2]   = Math.floor( 255 * nhash()    );   
                
            }
               
     texture = new THREE.DataTexture(tex,this.w,this.h,THREE.RGBFormat);
     texture.magFilter = THREE.LinearFilter;

     return texture;
}
