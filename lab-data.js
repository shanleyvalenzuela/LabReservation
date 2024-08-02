function getData(s){
    const fs = require('fs');
        let rawdata = fs.readFileSync(s);
        return JSON.parse(rawdata);
}

function getFloorLayout(s){
    const fs = require('fs');
        let rawdata = fs.readFileSync(s);
        return JSON.parse(rawdata);
}

module.exports.getData = getData;
module.exports.getFloorLayout = getFloorLayout;