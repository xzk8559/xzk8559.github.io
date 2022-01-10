"use strict";

export function quadTree(map, buildings, iteration) {

    let offset = 12.5;
    let x_max = map.mapbounds["-maxx"] + offset;
    let x_min = map.mapbounds["-minx"] - offset;
    let z_max = map.mapbounds["-maxy"] + offset;
    let z_min = map.mapbounds["-miny"] - offset;
    //console.log([[x_min, z_min], [x_max, z_min], [x_min, z_max], [x_max, z_max]]);
    // console.log((x_max+x_min)/2, (z_max+z_min)/2, (x_max-x_min), (z_max-z_min))

    let node = [new Node( [[x_min, z_min], [x_max, z_min], [x_min, z_max], [x_max, z_max]] )];
    // console.log(node);
    //node[0].computeIndex();

    buildTree( node, iteration );
    // console.log(node);
    // console.log(buildings);

    for (let ib = 0; ib < buildings.length; ib++) {

        buildings[ib].geometry.computeBoundingSphere();
        let pb = [buildings[ib].geometry.boundingSphere.center.x, buildings[ib].geometry.boundingSphere.center.z];
        //console.log("obj center: ", pb);
        //console.log("obj number: ", ib);

        bindingObject( pb, ib, node, iteration );

    }

    return node[0]

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
    }
};

// pos = [[0, 0], [1, 0], [0, 1], [1, 1]];
function Node( pos ){

    //this.index = [];
    this.pos = pos;
    this.level = 0;
    this.parent = null;
    this.children = [];
    this.object = [];
    this.visible = false;
    //this.width = Math.abs((pos[0][0] - pos[1][0]));
    //this.length = Math.abs((pos[0][1] - pos[2][1]));
    this.center = [(pos[0][0] + pos[1][0]) / 2, (pos[0][1] + pos[2][1]) / 2];

}
Node.prototype = {

    /*
    computeIndex: function(){
        this.index[0] = 0;
        this.index[1] = this.width;
        this.index[2] = (this.width + 1) * this.length;
        this.index[3] = (this.width + 1) * (this.length + 1) - 1;
    },*/
    setVisible: function(){
        this.visible = true;
    },
    computeSubNode: function(){

        let tmp = {
            down: [this.center[0], this.pos[0][1]],
            up: [this.center[0], this.pos[2][1]],
            left: [this.pos[0][0], this.center[1]],
            right: [this.pos[1][0], this.center[1]],
            center: this.center,
            //idn: (this.index[0] + this.index[1]) / 2,
            //iup: (this.index[2] + this.index[3]) / 2,
            //ile: (this.index[0] + this.index[2]) / 2,
            //iri: (this.index[1] + this.index[3]) / 2,
            //ice: (this.index[0] + this.index[1] + this.index[2] + this.index[3]) / 4
        };

        let subNode = [];
        let subPos = [];
        //let subIndex = [];

        subPos.push( [this.pos[0], tmp.down, tmp.left, tmp.center] ); // subNode0
        subPos.push( [tmp.down, this.pos[1], tmp.center, tmp.right] ); // subNode1
        subPos.push( [tmp.left, tmp.center, this.pos[2], tmp.up] ); // subNode2
        subPos.push( [tmp.center, tmp.right, tmp.up, this.pos[3]] ); // subNode3

        //subIndex.push( [this.index[0], tmp.idn, tmp.ile, tmp.ice] );
        //subIndex.push( [tmp.idn, this.index[1], tmp.ice, tmp.iri] );
        //subIndex.push( [tmp.ile, tmp.ice, this.index[2], tmp.iup] );
        //subIndex.push( [tmp.ice, tmp.iri, tmp.iup, this.index[3]] );

        for (let i = 0; i < 4; i++) {

            subNode.push( new Node(subPos[i]) );
            //subNode[i].index = subIndex[i];
            subNode[i].parent = this;
            subNode[i].level = this.level + 1;
        }

        this.children = subNode;

    }

};

function buildTree( nodeList, iteration ){

    for (let i = 0; i < nodeList.length; i++){
        nodeList[i].computeSubNode();
        let children = nodeList[i].children;
        if ((nodeList[i].level + 1) < iteration){
            buildTree( children, iteration );
        }
    }
}
function bindingObject( point, ib, node, iteration ) {

    // console.log('-----',ib,'-----');
    //console.log(node, node[0].level);
    // 判断包围球中心在哪个节点里
    let i_in;
    for (let i = 0; i < node.length; i++){
        // console.log(node);
        // console.log(point);
        if ( isPointInQuad(point, node[i].pos) ){
            i_in = i;
            // console.log(i_in);
            // console.log(point);
            //console.log(node[i].pos);
            //console.log('exist in node ', i, node[i].level);
            break
        } //else { console.log('not exist in node ', i) }

    }
    //console.log('push for node ', i_in);
    // console.log(i_in);
    node[i_in].object.push(ib);
    //console.log('pushed :', node[i_in]);

    if (node[i_in].level < iteration){
        //console.log('next level input: ', node[i_in].children);
        let children = node[i_in].children;
        return bindingObject( point, ib, children, iteration )
    }

}
function isPointInQuad(point, quadPos){

    let ab = new Vector2( quadPos[1][0] - quadPos[0][0], quadPos[1][1] - quadPos[0][1] );
    let dc = new Vector2( quadPos[2][0] - quadPos[3][0], quadPos[2][1] - quadPos[3][1] );
    let ac = new Vector2( quadPos[2][0] - quadPos[0][0], quadPos[2][1] - quadPos[0][1] );
    let db = new Vector2( quadPos[1][0] - quadPos[3][0], quadPos[1][1] - quadPos[3][1] );
    let ap = new Vector2( point[0] - quadPos[0][0], point[1] - quadPos[0][1] );
    let dp = new Vector2( point[0] - quadPos[3][0], point[1] - quadPos[3][1] );

    let f1 = ab.dot(ap) * dc.dot(dp) >= 0;
    let f2 = ac.dot(ap) * db.dot(dp) >= 0;
    return f1 && f2

}

// 经度lon转墨卡托
function handle_x(x) { return -( x / 180.0 ) * 20037508.3427892 }
// 纬度lat转墨卡托
function handle_y(y){

    if ( y > 85.05112 ) { y = 85.0511288 }
    if ( y < -85.05112) { y = -85.0511288 }
    y = ( Math.PI / 180.0 ) * y;
    let tmp = Math.PI / 4.0 + y / 2.0;
    return 20037508.3427892 * Math.log(Math.tan(tmp)) / Math.PI

}
