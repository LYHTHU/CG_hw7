"use strict"


////////////////////////////// USEFUL VECTOR OPERATIONS

let dot = (a, b) => {
   let value = 0;
   for (let i = 0 ; i < a.length ; i++)
      value += a[i] * b[i];
   return value;
}

let add = (a, b) => {
    let c = [];
    for (let i = 0; i < a.length; i++)
        c.push(a[i] + b[i]);
    return c;
}

let subtract = (a,b) => {
   let c = [];
   for (let i = 0 ; i < a.length ; i++)
      c.push(a[i] - b[i]);
   return c;
}

let multVecScale = (a, vec) => {
    let c = [];
    for (let i = 0; i < vec.length; i++)
        c.push(vec[i] * a);
    return c;
}

let normalize = a => {
   let s = Math.sqrt(dot(a, a)), b = [];
   for (let i = 0 ; i < a.length ; i++)
      b.push(a[i] / s);
   return b;
}

let cross = (a, b) => [ a[1] * b[2] - a[2] * b[1],
                        a[2] * b[0] - a[0] * b[2],
                        a[0] * b[1] - a[1] * b[0] ];


////////////////////////////// MATRIX OPERATIONS


let cos = t => Math.cos(t);
let sin = t => Math.sin(t);
let identity = ()       => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
let rotateX = t         => [1,0,0,0, 0,cos(t),sin(t),0, 0,-sin(t),cos(t),0, 0,0,0,1];
let rotateY = t         => [cos(t),0,-sin(t),0, 0,1,0,0, sin(t),0,cos(t),0, 0,0,0,1];
let rotateZ = t         => [cos(t),sin(t),0,0, -sin(t),cos(t),0,0, 0,0,1,0, 0,0,0,1];
let scale = (x,y,z)     => [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
let translate = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];

let inverse = src => {
  let dst = [], det = 0, cofactor = (c, r) => {
     let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
  for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
  return dst;
}

let multiply = (a, b) => {
   let c = [];
   for (let n = 0 ; n < 16 ; n++)
      c.push( a[n&3     ] * b[    n&12] +
              a[n&3 |  4] * b[1 | n&12] +
              a[n&3 |  8] * b[2 | n&12] +
              a[n&3 | 12] * b[3 | n&12] );
   return c;
}

let mulMat4Vec4 = (m, v) => {
    if (m.length != 16 || v.length != 4) {
        throw "Invalid dimension!";
    }
    let ret = [];
    for (let i = 0; i < 4; i ++) {
        ret.push(0);
        for (let j = 0; j < 4; j ++) {
            ret[i] += m[j*4+i] * v[j];
        }
    }
    return ret;
}

let mulvec4Mat4 = (v, m) => {
    if (m.length != 16 || v.length != 4) {
        throw "Invalid dimension!";
    }
    let ret = [];
    for (let j = 0; j < 4; j++) {
        ret.push(0);
        for (let i = 0; i < 4; i++) {
            ret[j] += m[j * 4 + i] * v[i];
        }
    }
    return ret;
}

let transpose = m => [ m[0],m[4],m[ 8],m[12],
                       m[1],m[5],m[ 9],m[13],
                       m[2],m[6],m[10],m[14],
                       m[3],m[7],m[11],m[15] ];

let transform = (m, v) => [
   m[0] * v[0] + m[4] * v[1] + m[ 8] * v[2] + m[12] * v[3],
   m[1] * v[0] + m[5] * v[1] + m[ 9] * v[2] + m[13] * v[3],
   m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
   m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
];


////////////////////////////// MATRIX CLASS


let Matrix = function() {
   let topIndex = 0,
       stack = [ identity() ],
       getVal = () => stack[topIndex],
       setVal = m => stack[topIndex] = m;

   this.identity  = ()      => setVal(identity());
   this.restore   = ()      => --topIndex;
   this.rotateX   = t       => setVal(multiply(getVal(), rotateX(t)));
   this.rotateY   = t       => setVal(multiply(getVal(), rotateY(t)));
   this.rotateZ   = t       => setVal(multiply(getVal(), rotateZ(t)));
   this.save      = ()      => stack[++topIndex] = stack[topIndex-1].slice();
   this.scale     = (x,y,z) => setVal(multiply(getVal(), scale(x,y,z)));
   this.translate = (x,y,z) => setVal(multiply(getVal(), translate(x,y,z)));
   this.value     = ()      => getVal();
}


////////////////////////////// SUPPORT FOR SPLINES


let HermiteBasisMatrix = [
    2,-3, 0, 1,
   -2, 3, 0, 0,
    1,-2, 1, 0,
    1,-1, 0, 0
];

let BezierBasisMatrix = [
   -1,  3, -3,  1,
    3, -6,  3,  0,
   -3,  3,  0,  0,
    1,  0,  0,  0
];

let toCubicCurveCoefficients = (basisMatrix, M) => {
   let C = [];
   for (let i = 0 ; i < M.length ; i++)
      C.push(transform(basisMatrix, M[i]));
   return C;
}

let toCubicPatchCoefficients = (basisMatrix, M) => {
   let C = [];
   for (let i = 0 ; i < M.length ; i++)
      C.push(multiply(basisMatrix, multiply(M[i], transpose(basisMatrix))));
   return C;
}


////////////////////////////// SUPPORT FOR CREATING 3D SHAPES


const VERTEX_SIZE = 8;    // EACH VERTEX IS: [ x,y,z, nx,ny,nz, u,v ]


// FUNCTION createMeshVertices() REPEATEDLY CALLS uvToShape(u, v, args).
// EACH CALL ADDS ANOTHER VERTEX TO THE MESH, IN THE FORM: [x,y,z, nx,ny,nz, u,v]

function createMeshVertices(M, N, uvToShape, arg) {

    // IMPLEMENTATION NOTES:

    // THIS IS ESSENTIALLY WHAT YOU HAVE ALREADY IMPLEMENTED.
    // THE ONLY SIGNIFICANT DIFFERENCE IS THAT YOU NEED TO PASS IN
    // arg AS A THIRD ARGUMENT WHEN YOU CALL uvToShape().

    let ret = [];
    if (M == 1 && N == 1) {
        throw "No triangles!";
    }

    let addTriangle = (a, b, c) => {
        //  a, b, c are all [u, v] pairs.
        let x = uvToShape(a[0], a[1], arg);
        let y = uvToShape(b[0], b[1], arg);
        let z = uvToShape(c[0], c[1], arg);
        ret = ret.concat(x);
        ret = ret.concat(y);
        ret = ret.concat(z);
    }

    let addPoint = (u, v) => {
        let xyz = uvToShape(u, v, arg);
        ret = ret.concat(xyz);
    }

    let dx = 1.0 / (M - 1); 
    let dy = 1.0 / (N - 1);
    // zigzag
    // There are N-1 rows, 1 => N-1
    let num_triangles = 2 * (M - 1);

    for (let r = 1; r < N; r++) {
        // let c = 1 - r % 2;
        // c = Math.max(c, 0)
        // c = Math.min(c, 1)
        // let sign = (r % 2 == 1 ? 1 : -1);
        let sign = 1;
        let c = 0;
        let mdown = (r - 1) * dy, mup = r * dy ;
        for (let t = 0; t < num_triangles; t += 2) {
            if (c > 1) break;

            addPoint(c, mdown);
            addPoint(c, mup);
            c = c + sign * dx ;
            addPoint(c, mdown)
            addPoint(c, mup);
        }
    }
    return ret;
}

// FOR uvCubicCurvesRibbon(), arg IS IN THE BELOW FORM:
//
// {
//    width: width,
//    data: [
//       [ [a0x,b0x,c0x,d0x], [a0y,b0y,c0y,d0y] [a0z,b0z,c0z,d0z] ], // CURVE 0
//       [ [a1x,b1x,c1x,d1x], [a1y,b1y,c1y,d1y] [a1z,b1z,c1z,d1z] ], // CURVE 1
//       ...                                                         // ...
//    ]
// }


let uvToCubicCurvesRibbon = (u, v, arg) => {

    // IMPLEMENTATION NOTES:

    // THE MULTIPLE CURVES TOGETHER SPAN THE LENGTH OF THE RIBBON,
    // FROM u == 0.0 TO u == 1.0 FROM ONE END OF THE RIBBON TO THE OTHER.

    // arg.width SPECIFIES THE WIDTH OF THE RIBBON. THIS IS THE DIRECTION
    // THAT SPANS FROM v == 0.0 TO v == 1.0.

    // EACH ELEMENT OF arg.data PROVIDES CUBIC COEFFICIENTS FOR THE X,Y AND Z
    // COORDINATES, RESPECTIVELY, OF ONE CUBIC SEGMENT ALONG THE CURVE.

    // THE KEY TO IMPLEMENTATION IS TO EVAL THE CUBIC AT TWO SLIGHTLY
    // DIFFERENT VALUES OF u, SUCH AS u AND u+0.001.
    // THE DIFFERENCE VECTOR [dx,dy] IN X,Y CAN THEN BE USED TO
    // CREATE THE VECTOR THAT VARIES ALONG THE WIDTH OF THE RIBBON,
    // FROM p + (dy,-dx) WHEN v == 0.0 TO p + (-dy,dx) WHEN v == 1.0. 

    // VARYING IN Z IS TRICKY, BECAUSE YOU NEED TO FIGURE OUT HOW TO
    // COMPUTE A CORRECT VALUE FOR THE SURFACE NORMAL AT EACH VERTEX.
    // IF YOU CAN'T FIGURE OUT HOW TO PRODUCE A RIBBON THAT VARIES IN Z,
    // IT IS OK TO CREATE A RIBBON WHERE ALL THE Z VALUES ARE THE SAME.


    // For now, just set Z as const

    if (u > 1) {
        u = 1.0;
    }

    let func = (ft, t) => {
        let ret = 0;
        for (let i = 3; i >= 0; i--) {
            ret += (ft[3-i] * Math.pow(t, i));
        }
        return ret;
    }

    let N = arg.data.length;
    let du = 1 / N;
    let width = arg.width;

    let uvToXYZ = (uu, vv) => {
        let n = Math.floor(uu / (du+(1e-5)*du)); // 0 ~ N-1
        
        // if (n >= N) console.log(n, uu, du);
        // Flaot precision error
        n = Math.min(n, N-1);
        n = Math.max(n, 0);

        let t = uu*N - n;
        
        // sometime n == N, exceed the bound.

        let fx = arg.data[n][0]; 
        let fy = arg.data[n][1];
        let fz = arg.data[n][2];

        let x = func(fx, t);
        let y = func(fy, t);
        let z = func(fz, t);
        return [x, y, z];
    }

    let p0 = uvToXYZ(u, v);
    let dp = [];

    if (u < 0.999) {
        let p1 = uvToXYZ(u + 0.001, v);
        dp = subtract(p1, p0);
    }
    else {
        let p1 = uvToXYZ(u - 0.001, v);
        dp = subtract(p0, p1);
    }

    let dx = dp[0], dy = dp[1];

    let delta = multVecScale(0.5*width, normalize([-dy, dx, 0]));

    let ret = add(p0, multVecScale(2 * v - 1, delta));

    let normal = [0, 0, 1];
    ret = ret.concat(normal);
    ret.push(u);
    ret.push(v);
    // console.log(ret);
    return ret;
}


// For uvToCubicPatch, arg consists of bicubic coefficents in the form:
//
// [
//    [x0,x1, ... x15],  // Bicubic coefficients in x
//    [y0,y1, ... y15],  // Bicubic coefficients in y
//    [z0,z1, ... z15]   // Bicubic coefficients in z
// ]

let uvToCubicPatch = (u, v, arg) => {

    // IMPLEMENTATION NOTES:

    // THE THREE 4x4 MATRICES IN VARIABLE arg ARE VALUES OF Cx, Cy AND Cz.
    // THESE ARE THE BICUBIC COEFFICIENTS FOR X, Y AND Z, RESPECTIVELY.

    // TO EVAL THE X,Y AND Z COORDS AT ANY [u,v] YOU NEED TO MULTIPLY THREE TERMS:

    //   x = U * Cx * transpose( V )
    //   y = U * Cy * transpose( V )
    //   z = U * Cz * transpose( V )

    // WHERE U = [ u*u*u , u*u , u , 1 ] AND V = [ v*v*v , v*v , v , 1 ]

    // NOW YOU HAVE THE SURFACE POINT p = [x,y,z].

    // TO COMPUTE THE SURFACE NORMAL, YOU NEED TO EVALUATE AT SLIGHTLY
    // DIFFERENT PARAMETRIC LOCATIONS pu = [u+.001,v] AND pv = [u,v+.001].

    // THEN YOU CAN TAKE THE DIFFERENCE VECTORS (pu - p) AND (pv - p).

    // THE CROSS PRODUCT OF THOSE TWO VECTORS IS IN A DIRECTION PERPENDICULAR
    // TO THE SURFACE. YOU CAN NORMALIZE THIS VECTOR TO GET THE SURFACE NORMAL.

    // FINALLY, RETURN [ x, y, z,  nx, ny, nz,  u, v ]
    if (u > 1) u = 1.0;

    let getXYZ = (uu, vv) => {
        let U = [uu * uu * uu, uu * uu, uu, 1], V = [vv * vv * vv, vv * vv, vv, 1];
        let x = dot(U, mulMat4Vec4(arg[0], V));
        let y = dot(U, mulMat4Vec4(arg[1], V));
        let z = dot(U, mulMat4Vec4(arg[2], V));
        return [x, y, z];
    }

    let p = getXYZ(u, v);
    let pu = getXYZ(u + 0.001, v);
    let pv = getXYZ(u, v + 0.001);

    let v1 = subtract(pu, p), v2 = subtract(pv, p);
    let n = normalize(cross(v1, v2));

    let ret = p.concat(n);
    ret.push(u);
    ret.push(v);
    return ret;
}


////////////////////////////// SCENE SPECIFIC CODE


async function setup(state) {
    hotReloadFile(getPath('week7.js'));

    const images = await imgutil.loadImagesPromise([
       getPath("textures/brick.png"),
       getPath("textures/polkadots.png"),
       getPath("textures/night_sky.jpg"),
    ]);


    let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
        { 
            key : "pnoise", path : "shaders/noise.glsl", foldDefault : true
        },
        {
            key : "sharedlib1", path : "shaders/sharedlib1.glsl", foldDefault : true
        },      
    ]);

    if (!libSources) {
        throw new Error("Could not load shader library");
    }

    // load vertex and fragment shaders from the server, register with the editor
    let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
        gl,
        "mainShader",
        { 
            onNeedsCompilation : (args, libMap, userData) => {
                const stages = [args.vertex, args.fragment];
                const output = [args.vertex, args.fragment];

                const implicitNoiseInclude = true;
                if (implicitNoiseInclude) {
                    let libCode = MREditor.libMap.get("pnoise");

                    for (let i = 0; i < 2; i += 1) {
                        const stageCode = stages[i];
                        const hdrEndIdx = stageCode.indexOf(';');
                        
                        /*
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        output[i] = hdr + "\n#line 1 1\n" + 
                                    libCode + "\n#line " + (hdr.split('\n').length) + " 0\n" + 
                                    stageCode.substring(hdrEndIdx + 1);
                        console.log(output[i]);
                        */
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        
                        output[i] = hdr + "\n#line 2 1\n" + 
                                    "#include<pnoise>\n#line " + (hdr.split('\n').length + 1) + " 0" + 
                            stageCode.substring(hdrEndIdx + 1);

                        //console.log(output[i]);
                    }
                }

                MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
                    output[0],
                    output[1],
                    libMap
                );
            },
            onAfterCompilation : (program) => {
                state.program = program;

                gl.useProgram(program);

                state.uColorLoc        = gl.getUniformLocation(program, 'uColor');
                state.uCursorLoc       = gl.getUniformLocation(program, 'uCursor');
                state.uModelLoc        = gl.getUniformLocation(program, 'uModel');
                state.uProjLoc         = gl.getUniformLocation(program, 'uProj');
                state.uTex0Loc         = gl.getUniformLocation(program, 'uTex0');
                state.uTex1Loc         = gl.getUniformLocation(program, 'uTex1');
                state.uTex2Loc         = gl.getUniformLocation(program, 'uTex2');
                state.uTexIndexLoc     = gl.getUniformLocation(program, 'uTexIndex');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');

                gl.uniform1i(state.uTex0Loc, 0);
                gl.uniform1i(state.uTex1Loc, 1);
                gl.uniform1i(state.uTex2Loc, 2);
            } 
        },
        {
            paths : {
                vertex   : "shaders/vertex.vert.glsl",
                fragment : "shaders/fragment.frag.glsl"
            },
            foldDefault : {
                vertex   : true,
                fragment : false
            }
        }
    );

    state.turnAngle = -.4;
    state.cursor = ScreenCursor.trackCursor(MR.getCanvas());

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }

    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);

    let bpe = Float32Array.BYTES_PER_ELEMENT;

    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 0);

    let aNor = gl.getAttribLocation(state.program, 'aNor');
    gl.enableVertexAttribArray(aNor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 3);

    let aUV  = gl.getAttribLocation(state.program, 'aUV');
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV , 2, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 6);

    for (let i = 0 ; i < images.length ; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

let m = new Matrix();
let cursorPrevX, cursorPrevZ;

// NOTE: t is the elapsed time since system start in ms, but
// each world could have different rules about time elapsed and whether the time
// is reset after returning to the world
function onStartFrame(t, state) {

    let tStart = t;
    if (!state.tStart) {
        state.tStart = t;
        state.time = t;
    }

    let cursor = state.cursor;

    let cursorValue = () => {
       let p = cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    tStart = state.tStart;

    state.time = (t - tStart) / 1000;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // VARY TURN ANGLE AS USER DRAGS CURSOR LEFT OR RIGHT.

    let cursorXYZ = cursorValue();
    if (cursorXYZ[2] && cursorPrevZ)
        state.turnAngle += 2 * (cursorXYZ[0] - cursorPrevX);
    cursorPrevX = cursorXYZ[0];
    cursorPrevZ = cursorXYZ[2];

    gl.uniform3fv(state.uCursorLoc     , cursorXYZ);
    gl.uniform1f (state.uTimeLoc       , state.time);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);  // CULL FACES THAT ARE VISIBLY CLOCKWISE.
}

function onDraw(t, projMat, viewMat, state, eyeIdx) {

    gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

    let drawShape = (color, type, vertices, texture) => {
       gl.uniform3fv(state.uColorLoc, color );
       gl.uniformMatrix4fv(state.uModelLoc, false, m.value() );
       gl.uniform1i(state.uTexIndexLoc, texture === undefined ? -1 : texture);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW);
       gl.drawArrays(type, 0, vertices.length / VERTEX_SIZE);
    }

    m.identity();

    m.translate(0,0,-4);
    m.rotateY(state.turnAngle);
    m.translate(0,0,4);

    let by = 1;

    let S = .3 * Math.sin(state.time);

    let hermiteCurveVertices = createMeshVertices(48, 2, uvToCubicCurvesRibbon,
       {
          width: .05,
	  data: [
	     toCubicCurveCoefficients(HermiteBasisMatrix, [
                [ 0, 0,-3, 3], // P0.x P1.x R0.x R1.x
                [-1, 0, 0, 0], // P0.y P1.y R0.y R1.y
                [ 0,.4, 0, 0]  // P0.z P1.z R0.z R1.z
             ]),
	     toCubicCurveCoefficients(HermiteBasisMatrix, [
                [ 0, .5,  3,  3], // P0.x P1.x R0.x R1.x
                [ 0,  1,  0,  0], // P0.y P1.y R0.y R1.y
                [.5,  0,  0,  0]  // P0.z P1.z R0.z R1.z
             ]),
	     toCubicCurveCoefficients(HermiteBasisMatrix, [
                [.5, .5,  2, -2], // P0.x P1.x R0.x R1.x
                [ 1, .2,  0,  0], // P0.y P1.y R0.y R1.y
                [ 0,  0,  0,-.5]  // P0.z P1.z R0.z R1.z
             ])
          ]
       }
    );

    let bezierCurveVertices = createMeshVertices(32, 2, uvToCubicCurvesRibbon,
       {
          width: 0.06,
	  data: [
             toCubicCurveCoefficients(BezierBasisMatrix, [
                [ -1, -.6, -.3,  0], // A.x B.x C.x D.x
                [  0,  by, -by,  0], // A.y B.y C.y D.y
                [-.3,  .3,   0,-.1]  // A.z B.z C.z D.z
             ]),
             toCubicCurveCoefficients(BezierBasisMatrix, [
                [  0, .3, .6,  1],    // A.x B.x C.x D.x
                [  0, by,  0,  1],    // A.y B.y C.y D.y
                [-.1,-.1,-.3,-.6]     // A.z B.z C.z D.z
             ])
          ]
       }
    );

    let st = 1 + 3 * state.time;
    let s0 = .7 * Math.sin(st);
    let s1 = .7 * Math.sin(st + 1);
    let s2 = .7 * Math.sin(st + 2);
    let s3 = .7 * Math.sin(st + 3);

    let bezierPatchVertices = createMeshVertices(32, 32, uvToCubicPatch,
       toCubicPatchCoefficients(BezierBasisMatrix, [
        [
            -1,-1/3, 1/3, 1,
            -1,-1/3, 1/3, 1,
            -1,-1/3, 1/3, 1,
            -1,-1/3, 1/3, 1
        ],
        [
	        -1  ,-1  ,-1  ,-1,
            -1/3,-1/3,-1/3,-1/3,
            1/3, 1/3, 1/3, 1/3,
            1  , 1  , 1  , 1
	    ],
        [
            s0,  s1,   s2, s3,
            0,   s3,   s0,  0,
            s0,  s1,   s2, s3,
            0,   s0,   s3,  0
	    ]
       ])
    );

    m.save();
    m.translate(0,0,-3.5);
    m.rotateY(state.time);
    m.rotateZ(state.time);
    drawShape([0,0,1], gl.TRIANGLE_STRIP, hermiteCurveVertices);
    m.restore();

    m.save();
    m.translate(0,0,-3);
    m.rotateY(state.time);
    m.rotateZ(state.time);
    drawShape([1,0,1], gl.TRIANGLE_STRIP, bezierCurveVertices);
    m.restore();

    m.save();
    m.translate(0,0,-4);
    m.scale(.6,1.,.6);
    m.rotateY(state.time);
    m.rotateX(state.time)
    drawShape([1,1,1], gl.TRIANGLE_STRIP, bezierPatchVertices, 1);
    m.restore();
}

function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week7',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
