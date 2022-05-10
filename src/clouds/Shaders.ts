export let defaultVSText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    attribute vec4 aNorm;
    
    varying vec4 lightDir;
    varying vec4 normal;   
 
    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
	uniform mat4 mProj;

    void main () {
		//  Convert vertex to camera coordinates and the NDC
        gl_Position = mProj * mView * mWorld * vec4 (vertPosition, 1.0);
        
        //  Compute light direction (world coordinates)
        lightDir = lightPosition - vec4(vertPosition, 1.0);
		
        //  Pass along the vertex normal (world coordinates)
        normal = aNorm;
    }
`;

// TODO: Write the fragment shader

export let defaultFSText = `
    precision mediump float;

    varying vec4 lightDir;
    varying vec4 normal;
	
    void main () {
        float light = clamp(dot(normalize(lightDir), normal), 0.0, 1.0);
        gl_FragColor = abs(vec4(light * normal.x, light * normal.y, light * normal.z, 1.0));
    }
`;

export let terrainVSText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    attribute vec4 aNorm;
    
    varying vec4 lightDir;
    varying vec4 normal;   
    varying vec3 position;

    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
	uniform mat4 mProj;

    void main () {

		//  Convert vertex to camera coordinates and the NDC
        gl_Position = mProj * mView * mWorld * vec4 (vertPosition, 1.0);
        
        //  Compute light direction (world coordinates)
        lightDir = lightPosition - vec4(vertPosition, 1.0);
		
        position = vertPosition;
        //  Pass along the vertex normal (world coordinates)
        normal = aNorm;
    }       
`;

export let terrainFSText = `
    precision mediump float;

    varying vec3 position;
    varying vec4 normal;   
    varying vec4 lightDir;

    vec2 smoothstepd( float a, float b, float x) {
        if( x<a ) return vec2( 0.0, 0.0 );
        if( x>b ) return vec2( 1.0, 0.0 );
        float ir = 1.0/(b-a);
        x = (x-a)*ir;
        return vec2( x*x*(3.0-2.0*x), 6.0*x*(1.0-x)*ir );
    }

    void main () {
        vec4 lightdir_norm = normalize(lightDir);
        float light =  dot(normalize(lightDir), normalize(normal));
        
        vec4 color = vec4(0.48, 0.294, 0.0, 1.0); // base brown

        float grass = smoothstepd(0.5, 1.0, normalize(normal).y).x;
        color = color * (1.0 - grass) +  vec4(0.486, 0.552, 0.298, 1.0) * grass;

        float snow = exp(0.02 * position.y); 
        // float snow = smoothstepd(-5.0, 6.0, position.y).x;
        color = vec4(1.0, 1.0, 1.0, 1.0) * snow + color * (1.0 - snow);

        // float atmos = exp(-0.01 * position.z);
        float atmos = smoothstepd(80.0, 500.0, position.z).x;
        // color = color * atmos + vec4(170.0/255.0, 190.0/255.0, 199.0/255.0, 1.0) * (1.0 - atmos);
        color = color * (1.0 - atmos) + vec4(0.66, 0.66, 0.66, 1.0) * atmos;

        gl_FragColor = abs(vec4(light * color.x, light * color.y, light * color.z, 1.0));
    }
`;


export let skyVSText = `
precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    attribute vec4 aNorm;
    
    varying vec4 lightDir;
    varying vec4 normal;   
    varying vec3 position;

    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
	uniform mat4 mProj;

    attribute vec2 a_texcoord;
    varying vec2 v_texcoord;

    void main () {
		//  Convert vertex to camera coordinates and the NDC
        gl_Position = mProj * mView * mWorld * vec4 (vertPosition, 1.0);
        
        //  Compute light direction (world coordinates)
        lightDir = lightPosition - vec4(vertPosition, 1.0);
		
        position = vertPosition;
        //  Pass along the vertex normal (world coordinates)
        normal = aNorm;
        v_texcoord = a_texcoord;
    }       
`;
export let skyFSText = `
    precision mediump float;

    varying vec3 position;
    varying vec4 normal;   
    varying vec4 lightDir;

    varying vec2 v_texcoord;
    uniform sampler2D u_texture;

    vec2 smoothstepd( float a, float b, float x) {
        if( x<a ) return vec2( 0.0, 0.0 );
        if( x>b ) return vec2( 1.0, 0.0 );
        float ir = 1.0/(b-a);
        x = (x-a)*ir;
        return vec2( x*x*(3.0-2.0*x), 6.0*x*(1.0-x)*ir );
    }

    void main () {
        float pos_x = position.x * 0.2;
        float pos_y = position.y * 0.2;
        vec4 lightdir_norm = normalize(lightDir);
        float light = dot(normalize(lightDir), normal);
        gl_FragColor = texture2D(u_texture, v_texcoord);
        float lambda = smoothstepd(0.3, 0.7, gl_FragColor.x).x;
        vec4 blue = vec4(144.0/255.0, 193.0/255.0, 252.0/255.0, 1.0);
        vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
        gl_FragColor = white * lambda + blue * (1.0 - lambda);
    }
`;
