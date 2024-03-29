let cacheName = 'df';

self.addEventListener('install',function(event){

event.waitUntil(
    caches.open(cacheName).then(function(cache) {
        return cache.addAll(
            [
                'index.html',
                'stylesheet.css',
                'texture.js',
                'render.vert',
                'render.glsl',
                'ShaderLoader.js',
                'render.js'
            ]
         );
    })
);


}); 


self.addEventListener('fetch',function(event) {
    event.respondWith(
        caches.match(event.request)  
            .then(function(response) {
                if(response) { 
                    return response;
                } 
                return fetch(event.request);  
            } 
            ) 
    );
});
 

self.addEventListener('activate',function(event){

});
