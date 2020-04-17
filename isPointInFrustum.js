
export function inFrustum(point, fru_plist){


    /*
    if ( inTriangle2(point, fru_plist[0], fru_plist[1], fru_plist[2]) ) {return 1}
    if ( inTriangle2(point, fru_plist[0], fru_plist[2], fru_plist[3]) ) {return 1}
    if ( inTriangle2(point, fru_plist[0], fru_plist[3], fru_plist[4]) ) {return 1}
    if ( inTriangle2(point, fru_plist[0], fru_plist[4], fru_plist[1]) ) {return 1}
    */

    if ( inTriangle(point, fru_plist[1], fru_plist[2], fru_plist[3]) ) {return 1}
    if ( inTriangle(point, fru_plist[1], fru_plist[4], fru_plist[3]) ) {return 1}
    if ( inTriangle(point, fru_plist[0], fru_plist[1], fru_plist[3]) ) {return 1}
    if ( inTriangle(point, fru_plist[0], fru_plist[2], fru_plist[4]) ) {return 1}

    return 0

}

// p = [0, 0]
function inTriangle3(P, A, B, C){

    let ab = new Vector2(B[0] - A[0], B[1] - A[1]);
    let bc = new Vector2(C[0] - B[0], C[1] - B[1]);
    let ca = new Vector2(A[0] - C[0], A[1] - C[1]);
    let ap = new Vector2(P[0] - A[0], P[1] - A[1]);
    let bp = new Vector2(P[0] - B[0], P[1] - B[1]);
    let cp = new Vector2(P[0] - C[0], P[1] - C[1]);
    let ac = new Vector2(C[0] - A[0], C[1] - A[1]);


    let a1 = ap.abscross(ab) + bp.abscross(bc) + cp.abscross(ca);

    return  Math.abs((ab.abscross(ac) - a1)) < 1e-6

}
function inTriangle2(P, A, B, C){

    let ab = new Vector2(B.x - A.x, B.z - A.z);
    let bc = new Vector2(C.x - B.x, C.z - B.z);
    let ca = new Vector2(A.x - C.x, A.z - C.z);
    let ap = new Vector2(P[0] - A.x, P[1] - A.z);
    let bp = new Vector2(P[0] - B.x, P[1] - B.z);
    let cp = new Vector2(P[0] - C.x, P[1] - C.z);

    let c1 = ap.cross(ab);
    let c2 = bp.cross(bc);
    let c3 = cp.cross(ca);

    return (c1*c2 >= 0) && (c2*c3 >= 0)

}
function inTriangle(P, A, B, C){

    let v0 = new Vector2(C[0] - A[0], C[1] - A[1]);
    let v1 = new Vector2(B[0] - A[0], B[1] - A[1]);
    let v2 = new Vector2(P[0] - A[0], P[1] - A[1]);

    let dot00 = v0.dot(v0);
    let dot01 = v0.dot(v1);
    let dot02 = v0.dot(v2);
    let dot11 = v1.dot(v1);
    let dot12 = v1.dot(v2);

    let den = dot00 * dot11 - dot01 * dot01;
    //console.log(den);

    let u = (dot11 * dot02 - dot01 * dot12) / den;
    if (u <= 0 || u >= 1) // if u out of range, return directly
    {
        //console.log(u,'1');
        return false
    }

    let v = (dot00 * dot12 - dot01 * dot02) / den;
    if (v <= 0 || v >= 1) // if v out of range, return directly
    {
        //console.log(v,'2');
        return false
    }

    //console.log(u + v < 1, '3');
    return u + v < 1.0;


}

function Vector2(x, y) {
    this.x = x;
    this.y = y;
}
Vector2.prototype = {
    copy : function() {
        return new Vector2(this.x, this.y);
    },
    length : function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    pow2 : function() {
        return this.x * this.x + this.y * this.y;
    },
    negate : function() {
        return new Vector2(-this.x, -this.y);
    },
    add : function(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    },
    subtract : function(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    },
    dot : function(v) {
        return this.x * v.x + this.y * v.y;
    },
    cross : function(v) {
        return this.x * v.y - this.y * v.x;
    },
    abscross : function(v) {
        return Math.abs((this.x * v.y - this.y * v.x));
    }
};