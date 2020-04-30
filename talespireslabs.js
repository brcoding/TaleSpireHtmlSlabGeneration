/**
 * Slab Library for TaleSpire.
 *
 * A javascript library for reading and writing TaleSpire slabs.
 *
 * @link   https://github.com/brcoding/TaleSpireHtmlSlabGeneration
 * @file   talespireslabs.js.
 * @author Barry Ruffner.
 * @since  1.0.0
 */

// Pull in the assets to display names and get asset extents
var script = document.createElement("script");
script.src = 'assetdata.js';
document.head.appendChild(script);
// Needed for gzip inflate / deflate of paste strings
var script = document.createElement("script");
script.src = 'https://cdn.jsdelivr.net/pako/1.0.3/pako.min.js';
document.head.appendChild(script);
// Math package for vector math
var script = document.createElement("script");
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/6.6.4/math.min.js';
document.head.appendChild(script);

var TalespireSlabs = (function () {

    'use strict';
    
    // Any methods or parameters that 
    var publicAPIs = {};    
    var outputElement;

    publicAPIs.GetAsset = function(nguid) {
        return asset_data[nguid];
    }

    publicAPIs.GetAllAssets = function() {
        return asset_data;
    }

    var toHexString = function(byteArray, withDash=false) {
        if (withDash) {
            return Array.from(byteArray, function(byte) {
                return ('0' + (byte & 0xFF).toString(16)).slice(-2);
            }).join('-')
        } else {
            return Array.from(byteArray, function(byte) {
                return ('0' + (byte & 0xFF).toString(16)).slice(-2);
            }).join('')            
        }
    }

    // Convert a hex string to a byte array
    var hexToBytes = function(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    var roundNumber = function(num) {
        //return num
        return num;// Math.round((num + Number.EPSILON) * 100) / 100
    }

    var nguidHexToBytes = function(nguid) {
        var b = hexToBytes(nguid);
        //console.log("Hex to Bytes: " + b);
        // rearrange bytes into bin format (smarter ways but brute force works fine)
        return [b[3], b[2], b[1], b[0], b[5], b[4], b[7], b[6], b[8], 
                b[9], b[10], b[11], b[12], b[13], b[14], b[15]]
    }

    publicAPIs.CreateSlab = function(layouts=[]) { 
        // Create a large ArrayBuffer and DataView, We can slice what we don't need at the end.
        var buffer = new ArrayBuffer(Math.pow(2, 20));
        var bufferDataView = new DataView(buffer);

        // Write header
        var bufPtr = 0;
        // Write Magic Numbers
        bufferDataView.setUint32(0, 3520002766, true);
        bufPtr += 4;
        bufferDataView.setUint16(bufPtr, 1, true);
        bufPtr += 2;

        // Write layout count        
        bufferDataView.setUint16(bufPtr, layouts.length, true);
        bufPtr += 2;
        //01c3a210-94fb-449f-8c47-993eda3e7126
        layouts.forEach(function(layout){ 
            nguidHexToBytes(layout['nguid'].replace(/[- ]/g, "")).forEach(function(byte) {
                bufferDataView.setUint8(bufPtr, byte, true);
                bufPtr += 1;
            });

            bufferDataView.setUint16(bufPtr, layout['assets'].length, true);
            bufPtr += 2;
            // skip unknown
            bufPtr += 2;
        });
        var first = true;
        var unionMin = [0, 0, 0];
        var unionMax = [0, 0, 0];
        layouts.forEach(function(layout){ 
            // Write asset locations
            layout['assets'].forEach(function(asset) {
                //console.log(asset);
                bufferDataView.setFloat32(bufPtr, asset['bounds']['center']['x'], true);
                bufPtr += 4;
                bufferDataView.setFloat32(bufPtr, asset['bounds']['center']['y'], true);
                bufPtr += 4;
                bufferDataView.setFloat32(bufPtr, asset['bounds']['center']['z'], true);
                bufPtr += 4;
                bufferDataView.setFloat32(bufPtr, asset['bounds']['extents']['x'], true);
                bufPtr += 4;
                bufferDataView.setFloat32(bufPtr, asset['bounds']['extents']['y'], true);
                bufPtr += 4;
                bufferDataView.setFloat32(bufPtr, asset['bounds']['extents']['z'], true);
                bufPtr += 4;
                
                bufferDataView.setUint8(bufPtr, asset['rotation'], true);
                bufPtr += 4;
                //console.log(math.subtract([10, 12, 14], [1, 1, 1]));
                var centerVector3 = [asset['bounds']['center']['x'], asset['bounds']['center']['y'], asset['bounds']['center']['z']]
                var extentsVector3 = [asset['bounds']['extents']['x'], asset['bounds']['extents']['y'], asset['bounds']['extents']['z']]
                
                if (first) {
                    first = false;
                    unionMin = math.subtract(centerVector3, extentsVector3);
                    unionMax = math.add(centerVector3, extentsVector3);
                }

                var min = math.subtract(centerVector3, extentsVector3);
                var max = math.add(centerVector3, extentsVector3);
                
                unionMin[0] = Math.min(min[0], unionMin[0]);
                unionMin[1] = Math.min(min[1], unionMin[1]);
                unionMin[2] = Math.min(min[2], unionMin[2]);
                
                unionMax[0] = Math.max(max[0], unionMax[0]);
                unionMax[1] = Math.max(max[1], unionMax[1]);
                unionMax[2] = Math.max(max[2], unionMax[2]);
                //console.log(unionMin, unionMax);

            });
        });
        var unionCenterVector3 = math.multiply(0.5, math.add(unionMin, unionMax))
        var unionExtentsVector3 = math.multiply(0.5, math.subtract(unionMax, unionMin))
        // unionCenterVector3[0] = 1;
        // unionCenterVector3[2] = 1;

        bufferDataView.setFloat32(bufPtr, unionCenterVector3[0], true);
        bufPtr += 4;
        bufferDataView.setFloat32(bufPtr, unionCenterVector3[1], true);
        bufPtr += 4;
        bufferDataView.setFloat32(bufPtr, unionCenterVector3[2], true);
        bufPtr += 4;
        bufferDataView.setFloat32(bufPtr, unionExtentsVector3[0], true);
        bufPtr += 4;
        bufferDataView.setFloat32(bufPtr, unionExtentsVector3[1], true);
        bufPtr += 4;
        bufferDataView.setFloat32(bufPtr, unionExtentsVector3[2], true);
        bufPtr += 4;
        bufPtr += 4;

        var gzdata        = pako.gzip(buffer.slice(0, bufPtr));        

        return '```' + btoa(String.fromCharCode.apply(null, gzdata)) + '```';
    }

    var ReadSlab = function(data, getpayload=false) {
        var results = "";
        var decodedAssets = [];
        var bufPtr = 0;
        console.log("Magic Header: " + new Uint32Array(data.buffer.slice(bufPtr, bufPtr + 4))[0]);
        bufPtr += 4;
        console.log("Second Magic: " + new Uint16Array(data.buffer.slice(bufPtr, bufPtr + 2))[0]);
        bufPtr += 2;
        var num_layouts = new Uint16Array(data.buffer.slice(bufPtr, bufPtr + 2))[0];
        bufPtr += 2;
        results += "<p>Number of Layouts: " + num_layouts + "</p>";

        var totalAssets = 0;
        // Loop over every layout and decode
        for (var i = 0; i < num_layouts; i++) {
            //console.log(new Int8Array(data.buffer.slice(bufPtr, bufPtr + 16)));
            var ng_a1 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_a2 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_a3 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_a4 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;


            var ng_b1 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_b2 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;


            var ng_c1 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_c2 = new Int8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;


            var ng_d = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_e = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_f = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_g = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_h = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_i = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_j = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;
            var ng_k = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1));
            bufPtr += 1;

            var hexNguid = toHexString(ng_a4) + toHexString(ng_a3) + toHexString(ng_a2) + toHexString(ng_a1) +
                        "-" + toHexString(ng_b2) + toHexString(ng_b1) + "-" +
                        toHexString(ng_c2) + toHexString(ng_c1) + "-" +
                        toHexString(ng_d) + toHexString(ng_e) + "-" +
                        toHexString(ng_f) + toHexString(ng_g) + toHexString(ng_h) + 
                        toHexString(ng_i) + toHexString(ng_j) + toHexString(ng_k)
            var assetCount = new Uint16Array(data.buffer.slice(bufPtr, bufPtr + 2))[0];
            bufPtr += 2;
            decodedAssets.push({"nguid": hexNguid, "assetCount": assetCount})
            totalAssets += assetCount;
            // Skip terminator for struct
            //var unknown = new Uint16Array(data.buffer.slice(bufPtr, bufPtr + 2))[0];
            bufPtr += 2;
            //console.log("unknown: " + unknown);
        }
        console.log("Total Asset Count: " + totalAssets);
        results += "<p>Total Asset Count: " + totalAssets + "</p>";
        var AssetLocations = [];
        
        for (i = 0; i < totalAssets; i++) {
            // Each AssetCopyData is 28 bytes
            var centerVector3 = new DataView(data.buffer.slice(bufPtr, bufPtr + 12))
            var centerX = centerVector3.getFloat32(0, true);
            var centerY = centerVector3.getFloat32(4, true);
            var centerZ = centerVector3.getFloat32(8, true);
            bufPtr += 12
            var extentsVector3 = new DataView(data.buffer.slice(bufPtr, bufPtr + 12))
            var extentsX = extentsVector3.getFloat32(0, true);
            var extentsY = extentsVector3.getFloat32(4, true);
            var extentsZ = extentsVector3.getFloat32(8, true);
            bufPtr += 12

            var rotation = new Uint8Array(data.buffer.slice(bufPtr, bufPtr + 1))[0];
            bufPtr += 4;
            // printResults("Asset Rotation: " + rotation);            
            // printResults("Center X: " + centerX + " Y: " + centerY + " Z: " + centerZ);
            // printResults("Extents X: " + extentsX + " Y: " + extentsY + " Z: " + extentsZ);

            AssetLocations.push({"rotation": rotation, "centerX": centerX, "centerY": centerY, "centerZ": centerZ, "extentsX": extentsX, "extentsY": extentsY, "extentsZ": extentsZ})
        }

        var unionCenter = [0, 0, 0];
        var unionExtents = [0, 0, 0];
        var centerVector3 = new DataView(data.buffer.slice(bufPtr, bufPtr + 12))
        unionCenter[0] = centerVector3.getFloat32(0, true);
        unionCenter[1] = centerVector3.getFloat32(4, true);
        unionCenter[2] = centerVector3.getFloat32(8, true);
        bufPtr += 12
        var extentsVector3 = new DataView(data.buffer.slice(bufPtr, bufPtr + 12))
        unionExtents[0] = extentsVector3.getFloat32(0, true);
        unionExtents[1] = extentsVector3.getFloat32(4, true);
        unionExtents[2] = extentsVector3.getFloat32(8, true);
        bufPtr += 12
        console.log("Union Center: " + JSON.stringify(unionCenter));
        console.log("Union Extents: " + JSON.stringify(unionExtents));
        var payload = []
        var assetIdx = 0;
        for (i = 0; i < decodedAssets.length; i++) {
            var asset = publicAPIs.GetAsset(decodedAssets[i]["nguid"]);
            if (asset) {
                results += "<p><b>" + asset["name"] + "</b><br> NGuid: " + decodedAssets[i]["nguid"] + "</p>";
            } else {
                results += "<p><b>NGuid:</b> " + decodedAssets[i]["nguid"] + "</p>";
            }
            var assetCount = decodedAssets[i]["assetCount"];
            var payloadAssets = [];
            for (var x = 0; x < assetCount; x++) {
                payloadAssets.push(
                    {
                        'rotation': AssetLocations[assetIdx]["rotation"],
                        'bounds': {
                            'center': {'x': AssetLocations[assetIdx]["centerX"], 'y': AssetLocations[assetIdx]["centerY"], 'z': AssetLocations[assetIdx]["centerZ"]},
                            'extents': {'x': AssetLocations[assetIdx]["extentsX"], 'y': AssetLocations[assetIdx]["extentsY"], 'z': AssetLocations[assetIdx]["extentsZ"]},
                        }
                    });

                results += "<pre><b style='margin-left: 15px'>Rotation</b>: " + AssetLocations[assetIdx]["rotation"];
                results += "<br><b style='margin-left: 15px'>Center</b> X: " + roundNumber(AssetLocations[assetIdx]["centerX"], 4) + 
                    " Y: " + roundNumber(AssetLocations[assetIdx]["centerY"], 4) + 
                    " Z: " + roundNumber(AssetLocations[assetIdx]["centerZ"], 4) + 
                    " <b>Extents</b> X: " + roundNumber(AssetLocations[assetIdx]["extentsX"], 4) + 
                    " Y: " + roundNumber(AssetLocations[assetIdx]["extentsY"], 4) + 
                    " Z: " + roundNumber(AssetLocations[assetIdx]["extentsZ"], 4) + "</pre>";
                assetIdx++;
            }
            payload.push({'nguid': decodedAssets[i]["nguid"], 'assets': payloadAssets})
        }
        if (getpayload) {
            return payload;
        } else {
            return results;            
        }
    }

    publicAPIs.DecodeSlab = function(paste) {
        if (paste.length == 0) {
            throw "Unable to read slab."
        }
        paste = paste.replace(/[` ]/g, "")

        // Decode base64 (convert ascii to binary)
        var strData     = atob(paste);
        if (strData.length == 0) {
            throw "Unable to process paste. Base64 decode returned empty results."
        }
        // Convert binary string to character-number array
        var charData    = strData.split('').map(function(x){return x.charCodeAt(0);});

        // Turn number array into byte-array
        var binData = new Uint8Array(charData);

        var data;
        try {
        // Pako magic
            data = pako.inflate(binData);
        } catch {
            throw "Unable to inflate gzip contents. Cannot read slab."
        }

        return ReadSlab(data);
    }

    publicAPIs.DecodeSlabToPayload = function(paste) {
        if (paste.length == 0) {
            throw "Unable to read slab."
        }

        paste = paste.replace(/[` ]/g, "")

        // Decode base64 (convert ascii to binary)
        var strData     = atob(paste);
        if (strData.length == 0) {
            throw "Unable to process paste. Base64 decode returned empty results."
        }
        // Convert binary string to character-number array
        var charData    = strData.split('').map(function(x){return x.charCodeAt(0);});

        // Turn number array into byte-array
        var binData = new Uint8Array(charData);

        var data;
        try {
        // Pako magic
            data = pako.inflate(binData);
        } catch {
            throw "Unable to inflate gzip contents. Cannot read slab."
        }

        return ReadSlab(data, true);
    }

    return publicAPIs;
})();

