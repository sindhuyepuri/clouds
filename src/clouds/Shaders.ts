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

    void main () {
        vec4 lightdir_norm = normalize(lightDir);
        float light = dot(normalize(lightDir), normalize(normal));

        vec4 color = vec4(0.588, 0.294, 0.0, 1.0);
        if (position.y < -9.0) {
            color = vec4(0.486274509803922, 0.552941176470588, 0.298039215686275, 1.0);
        }
        else if (position.y < -7.5) {
            color = vec4(0.709803921568627, 0.729411764705882, 0.380392156862745, 1.0);
        }
        else if (position.y < -5.0) {
            color = vec4(0.447058823529412, 0.329411764705882, 0.156862745098039, 1.0);
        }
        else if (position.y < -3.5) {
            color = vec4(0.898039215686275, 0.850980392156863, 0.76078431372549, 1.0);
        }
        else {
            color = vec4(1.0, 1.0, 1.0, 1.0);
        }
        // gl_FragColor = abs(vec4(light * color.x, light * color.y, light * color.z, 1.0));
        // gl_FragColor = abs(vec4(normalize(normal).x * color.x, normalize(normal).y * color.y, normalize(normal).z * color.z, 1.0));
        // gl_FragColor = vec3((normalize(normal).x + 1.0) / 2.0, (normalize(normal).y + 1.0) / 2.0, (normalize(normal).z + 1.0) / 2.0);
        gl_FragColor = abs(normalize(normal));
        // gl_FragColor = vec4(light, light, light, 1.0);
        // gl_FragColor = lightdir_norm;
        // gl_FragColor = abs(vec4(color.x, color.y, color.z, 1.0));
    }
`;

