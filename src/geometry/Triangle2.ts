import {vec3} from 'gl-matrix';

class Triangle2 {
    indices: Array<number>;
    constructor(indices: Array<number>) {
        this.indices = indices;
    }

    getNormal(p0: vec3, p1: vec3, p2: vec3) : vec3 {
        let v1 = vec3.create();
        let v2 = vec3.create();
        
        vec3.subtract(v1, p1, p0);
        vec3.subtract(v2, p2, p0);

        let norm = vec3.create();
        vec3.cross(norm, v1, v2);

        vec3.normalize(norm, norm);
        return norm;
    }

    averageNormal(avgNorm: vec3, newNorm: vec3, currNum: number) : vec3 {
        // Initialize base value
        let average = vec3.create();
        vec3.copy(average, avgNorm);

        // Set weight for given normal
        vec3.multiply(average, average, vec3.fromValues(currNum, currNum, currNum));
        // And add the new normal
        vec3.add(average, average, newNorm);

        return vec3.normalize(average, average);
    }
}

export default Triangle2;