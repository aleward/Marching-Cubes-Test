import { mat4 } from 'gl-matrix';
import { gl } from '../../globals';
var activeProgram = null;
export class Shader {
    constructor(type, source) {
        this.shader = gl.createShader(type);
        gl.shaderSource(this.shader, source);
        gl.compileShader(this.shader);
        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(this.shader);
        }
    }
}
;
class ShaderProgram {
    constructor(shaders) {
        this.prog = gl.createProgram();
        for (let shader of shaders) {
            gl.attachShader(this.prog, shader.shader);
        }
        gl.linkProgram(this.prog);
        if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
            throw gl.getProgramInfoLog(this.prog);
        }
        // Raymarcher only draws a quad in screen space! No other attributes
        this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
        this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
        // TODO: add other attributes here
        this.unifDrawMode = gl.getUniformLocation(this.prog, "u_DrawMode");
        this.unifModel = gl.getUniformLocation(this.prog, "u_Model");
        this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
        this.unifView = gl.getUniformLocation(this.prog, "u_View");
        this.unifProject = gl.getUniformLocation(this.prog, "u_Project");
        this.unifEye = gl.getUniformLocation(this.prog, "u_Eye");
        this.unifDimensions = gl.getUniformLocation(this.prog, "u_Dimensions");
        this.unifTime = gl.getUniformLocation(this.prog, "u_Time");
    }
    use() {
        if (activeProgram !== this.prog) {
            gl.useProgram(this.prog);
            activeProgram = this.prog;
        }
    }
    setUnifDrawMode(drawM) {
        this.use();
        if (this.unifDrawMode !== -1) {
            gl.uniform1i(this.unifDrawMode, drawM);
        }
    }
    setModelMatrix(model) {
        this.use();
        if (this.unifModel !== -1) {
            gl.uniformMatrix4fv(this.unifModel, false, model);
        }
        if (this.unifModelInvTr !== -1) {
            let modelinvtr = mat4.create();
            mat4.transpose(modelinvtr, model);
            mat4.invert(modelinvtr, modelinvtr);
            gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
        }
    }
    // TODO: add functions to modify uniforms
    setEye(eye) {
        this.use();
        if (this.unifEye !== -1) {
            gl.uniform3fv(this.unifEye, eye);
        }
    }
    setDimensions(dimensions) {
        this.use();
        if (this.unifDimensions !== -1) {
            gl.uniform2fv(this.unifDimensions, dimensions);
        }
    }
    setViewMatrix(vp) {
        this.use();
        if (this.unifView !== -1) {
            gl.uniformMatrix4fv(this.unifView, false, vp);
        }
    }
    setProjectionMatrix(pp) {
        this.use();
        if (this.unifProject !== -1) {
            gl.uniformMatrix4fv(this.unifProject, false, pp);
        }
    }
    setTime(time) {
        this.use();
        if (this.unifTime !== -1) {
            gl.uniform1f(this.unifTime, time);
        }
    }
    draw(d) {
        this.use();
        if (this.attrPos != -1 && d.bindPos()) {
            gl.enableVertexAttribArray(this.attrPos);
            gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
        }
        if (this.attrNor != -1 && d.bindNor()) {
            gl.enableVertexAttribArray(this.attrNor);
            gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
        }
        d.bindIdx();
        gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);
        if (this.attrPos != -1)
            gl.disableVertexAttribArray(this.attrPos);
        if (this.attrNor != -1)
            gl.disableVertexAttribArray(this.attrNor);
    }
}
;
export default ShaderProgram;
//# sourceMappingURL=ShaderProgram.js.map