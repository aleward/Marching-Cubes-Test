#version 300 es

precision highp float;
precision highp int;

uniform int u_DrawMode;
uniform vec3 u_Eye;

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_View; 
uniform mat4 u_Project;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;
out vec4 fs_Col;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.


float EPSILON = 0.0001;
float CLIP = 100.f;

// Smooth minimum from IQ
float smin( float a, float b, float k) {
    float res = exp(-k * a) + exp(-k * b);
    return -log(res) / k;
}


float arm(vec3 pos) {
	return smin(length(pos + vec3(0.1, -0.1, 0.2)) - 0.2f, length(vec3(pos.x, pos.y * 0.5, pos.z)) - 0.2f, 16.f);
}

float eye(vec3 pos, float degrees) {
	
	// Tilts the eyes
	float c = cos(radians(degrees));
    float s = sin(radians(degrees));
    mat3  mZ = mat3(c, s, 0.f, -s, c, 0.f, 0.f, 0.f, 1.f);     							// Z-axis rotation
	mat3  mY = mat3(cos(radians(-degrees / 1.4f)), 0.f, -sin(radians(-degrees / 1.4f)), // Y-axis rotation
					0.f, 1.f, 0.f, 
					sin(radians(-degrees / 1.4f)), 0.f, cos(radians(-degrees / 1.4f)));

	// The main eyeball
	vec3  eye = mY * mZ * (vec3(pos.x + degrees * 0.0215, pos.y * 0.85 - 0.05, pos.z * 1.5f + 0.38f));

	// The surrounding torus
    vec3  outline = mY * mZ * pos;
	vec2 t = vec2(0.25, 0.05);
	vec2 d = vec2(length(outline.xy * vec2(0.75, 0.65)) - t.x, outline.z);

	float iris = length(vec3(pos.x + degrees * 0.0035, pos.y * 0.85, pos.z * 1.7 - 0.07f)) - 0.13;
					 
  	return min(iris, min(length(d) - t.y, length(eye) - 0.5));
}

float box(vec3 p, vec3 b)
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

// Sphere from IQ - used for Cappy's Body
float sphere(vec3 pos) {
	return length(pos) - 0.97f;
}

float body(vec3 p, vec2 h) { // major warping of IQ's capped cylinder function
  	vec2 d = abs(vec2(length(p.xy), p.z)) - (h * vec2(p.z / 2.3f - sin(12.f * p.z) * 0.03 * (p.z - 2.f) * 1.2f, 1.f));
  	return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

// Cylinder from IQ - used for Cappy's Hat
float sdCappedCylinder(vec3 p, vec2 h, float f) {
  	vec2 d = abs(vec2(length(p.xz), p.y)) - h;
  	return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - f;
}

float hatBrim(vec3 p, vec2 t) {   // Essentially a bent torus
	float c = cos(radians(12.0 * p.x));
    float s = sin(radians(12.0 * p.x));
    mat2  m = mat2(c, -s, s, c);
    vec3  q = vec3(m * p.xy, p.z);
  	vec2 d = vec2(length(q.xz * 0.5) - t.x, q.y + 0.5);
  	return length(d) - t.y;
}

// The main part of the hat, using bent and beveled cylinders
float hatBase(vec3 p) {
    float c = cos(radians(12.0 * p.y));
    float s = sin(radians(12.0 * p.y));
    mat2  m = mat2(c, -s, s, c);
    vec3  q = vec3(m * p.zy, p.x);
	float scaleVal = p.y * 0.2 + 0.7;
	// Hat and ribbon!
	return min(sdCappedCylinder(q + vec3(0.f, 0.2 * (1.f + cos(p.x)) - 0.25, 0.f), vec2(1.37f * scaleVal, 0.2f), 0.05), 
			   sdCappedCylinder(q + vec3(0.f, -0.4f, 0.f), vec2(1.2f * scaleVal, 0.7f), 0.15));
}

// My combination SDF
float mySDF(vec3 pos) {

	vec3 bgPos = pos;
	pos = pos + vec3(0.f, sin(0.07) * 0.7, 0.f);

	float hat = min(hatBase(pos), hatBrim(pos * vec3(1.f, 1.f, 1.f), vec2(0.6f, 0.2f)));
	float yScale = 0.7f - pos.z / 2.2f;
	float bod = smin(sphere(pos + vec3(0.f, 0.7f, 0.03f)), 
					 body(pos + vec3(sin(3.f * pos.z) * 0.1, yScale + sin(10.f * pos.z) * 0.1, 1.93f), vec2(1.f , 1.7f)), 22.f);
	float arms = min(arm(pos - vec3(0.8f, -1.f, 1.f)), arm((pos - vec3(-0.8f, -1.f, 1.f)) * vec3(-1.f, 1.f, 1.f)));
	bod = smin(bod, arms, 20.f);
	float eyes = smin(eye(pos - vec3(0.34f, 0.25f, 0.98f), 23.f), eye(pos - vec3(-0.34f, 0.25f, 0.98f), -23.f), 100.f);

	float cappy = min(min(hat, bod), eyes);
	return cappy;
}


void main() {
	mat3 invTranspose = mat3(u_ModelInvTr);

    fs_Pos = vs_Pos;
    
    vec4 modelposition;
    if (u_DrawMode == 0) {
        modelposition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below
        fs_Nor = vec4(invTranspose * vs_Nor.xyz, 0);        
    } else {
        modelposition = vs_Pos;
        fs_Nor = vs_Nor;
    }

    fs_Col = vec4(1.f, 1.f, 1.f, 1.f);
    if (u_DrawMode == 2 && mySDF(vec3(vs_Pos)) <= 0.f) {
        fs_Col = vec4(1.f, 0.f, 0.f, 1.f);
    }

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_PointSize = 3.0;
    gl_Position = u_Project * u_View * modelposition;
}
