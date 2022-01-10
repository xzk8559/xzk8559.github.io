import * as THREE from "../three.js_130/build/three.module.js";

// 四叉树递归寻找渲染object
export function getRenderList( frustum, node, iteration ){

    Array.prototype.extend = function (array) {
        array.forEach(function(v){this.push(v)}, this)
    };

    let renderList = [];

    get( node );

    function get( node ){

        let tmp = 0;
        for (let i = 0; i < 4; i++){
            tmp += frustum.containsPoint(new THREE.Vector3(node.pos[i][0], 3.0, node.pos[i][1]));
        }

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
