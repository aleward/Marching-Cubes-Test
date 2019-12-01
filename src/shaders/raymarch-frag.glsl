#version 300 es

precision highp float;

uniform mat4 u_View;
uniform mat4 u_Project;
uniform vec3 u_Eye;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_DrawMode;

in vec4 fs_Pos;
//in vec4 gl_FragCoord;

out vec4 out_Col;


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
	return cappy;//min(cappy, box(pos - vec3(0.f, -0.1f, -0.2f), vec3(1.7f, 1.7f, 1.8f)));
}

vec3 estimateNormal(vec3 p) { 
	return normalize(vec3( 
		mySDF(vec3(p.x + EPSILON, p.y, p.z)) - mySDF(vec3(p.x - EPSILON, p.y, p.z)), 
		mySDF(vec3(p.x, p.y + EPSILON, p.z)) - mySDF(vec3(p.x, p.y - EPSILON, p.z)), 
		mySDF(vec3(p.x, p.y, p.z + EPSILON)) - mySDF(vec3(p.x, p.y, p.z - EPSILON)) )); 
}

void main() {
	// TODO: make a Raymarcher!

	vec3 pos = u_Eye;

	// Finds the furthest point in the background, used to compute rays
	float x = (gl_FragCoord.x / u_Dimensions.x) * 2.f - 1.f;
	float y = 1.f - (gl_FragCoord.y / u_Dimensions.y) * 2.f;
	vec4 bg = inverse(u_View) * inverse(u_Project) * vec4(x * 1000.f, y * -1000.f, 1000.f, 1000.f);
	
	if (u_DrawMode == 0) {
		vec3 dir = normalize(vec3(bg.x, bg.y, bg.z) - u_Eye);

		bool geo = false;

		float maxLoops = 0.f; // Ensures program doesn't crash

		float t = mySDF(pos);
		float dist = t;

		while (t < CLIP && maxLoops < 100.f) {
			pos += t * dir;
			float i = mySDF(pos);
			dist += i;
			if (i < EPSILON && i > -0.-EPSILON) { //
				geo = true;
				break;
			}
			t = i;
			maxLoops++;
		}


		if (geo) {
			vec4 lightVec = vec4(5.f, 5.f, 3.f, 1.f) - vec4(pos, 1.f);
			float diffuse = dot(estimateNormal(pos), normalize(lightVec.xyz));
    		diffuse = min(diffuse, 1.0);
   			diffuse = max(diffuse, 0.0);
			diffuse /= (dist * 0.1);
			float lightIntensity = diffuse * 0.6 + 0.2;

			out_Col = vec4(mix(vec3(0.5843, 0.898, 1.0) + vec3(1.0, 0.8627, 0.3686) *
    	        cos(2.f * 3.14159265359 * (vec3(0.8353, 0.549, 0.1765) / lightIntensity +
    	            vec3(0.511, 0.1176, 0.0902))) * lightIntensity, vec3(0.f, 0.f, 0.f), dist / CLIP), 1.0);
		} else {
			// Background gradient
			float glow = (dot(normalize(bg.xyz), vec3(0.f, 1.f, 0.f)) + 1.0) / 2.f;
			out_Col = vec4(mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), sqrt(glow)), 1.0);
		}
	} else {
		float glow = (dot(normalize(bg.xyz), vec3(0.f, 1.f, 0.f)) + 1.0) / 2.f;
		out_Col = vec4(mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), sqrt(glow)), 1.0);
	}
}
