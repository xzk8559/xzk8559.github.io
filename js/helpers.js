// js/helpers.js


function loadXMLDoc(url, callback) {
    let xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = callback;
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}


function loadTableData(file) {
    loadXMLDoc(file, function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            const currentAttr = JSON.parse(xmlhttp.responseText);
            table_attr.structure.attributes.county.value = currentAttr["county"];
            table_attr.structure.attributes.town.value = currentAttr["town"];
            table_attr.structure.attributes.circleNum.value = currentAttr["circleNum"];
            table_attr.structure.attributes.builtYear.value = currentAttr["builtYear"];
            table_attr.structure.attributes.floorArea.value = parseFloat(currentAttr["floorArea"]).toFixed(2);
            table_attr.structure.attributes.buildArea.value = parseFloat(currentAttr["buildArea"]).toFixed(2);
            // Trigger Vue to update the data tables if necessary
            if (app) {
                app.$forceUpdate();
            }
        }
    });
}
