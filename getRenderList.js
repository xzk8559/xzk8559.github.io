//import { inFrustum } from "./isPointInFrustum.js";
import * as THREE from "./three.js_115/build/three.module.js";

// 四叉树递归寻找渲染object
export function getRenderList( frustum, node, iteration, position ){

    Array.prototype.extend = function (array) {
        array.forEach(function(v){this.push(v)}, this)
    };

    let renderList = [];

    /*
    let plist = [];
    // frustum plane:
    // 0:右 1:左 2:下 3:上 4:后 5:前
    plist.push( [position.x, position.z] );
    //plist.push( getFrustumPoint(frustum, 0, 3, 5) );
    //plist.push( getFrustumPoint(frustum, 0, 2, 5) );
    //plist.push( getFrustumPoint(frustum, 1, 2, 5) );
    plist.push( getFrustumPoint(frustum, 1, 3, 4) );
    plist.push( getFrustumPoint(frustum, 0, 3, 4) );
    plist.push( getFrustumPoint(frustum, 0, 2, 4) );
    plist.push( getFrustumPoint(frustum, 1, 2, 4) );
    //console.log(plist);
    */

    get( node );

    function get( node ){

        let tmp = 0;
        for (let i = 0; i < 4; i++){
            tmp += frustum.containsPoint(new THREE.Vector3(node.pos[i][0], 3.0, node.pos[i][1]));
            //tmp += inFrustum( node.pos[i], plist );
        }
        //console.log(tmp);

        if (tmp === 4){
            renderList.extend(node.object);
        }
        else if ( (tmp > 0 && node.level < iteration) || (node.level < 5 && tmp ===0) ){
            get( node.children[0] );
            get( node.children[1] );
            get( node.children[2] );
            get( node.children[3] );
        }
        else if ( (node.level === iteration) && tmp > 0 ){
            renderList.extend(node.object);
        }

    }

    //console.log(renderList);
    return renderList

}

function getFrustumPoint(frustum, n1, n2, n3){

    let m = new THREE.Matrix3();
    m.set( frustum.planes[n1].normal.x, frustum.planes[n1].normal.y, frustum.planes[n1].normal.z,
        frustum.planes[n2].normal.x, frustum.planes[n2].normal.y, frustum.planes[n2].normal.z,
        frustum.planes[n3].normal.x, frustum.planes[n3].normal.y, frustum.planes[n3].normal.z );
    let p = new THREE.Vector3( -frustum.planes[n1].constant, -frustum.planes[n2].constant, -frustum.planes[n3].constant );
    p.applyMatrix3( new THREE.Matrix3().getInverse(m) );

    return [p.x, p.z]

}