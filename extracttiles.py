import json
import os
import glob
import pprint

path = 'G:\\Program Files (x86)\\Steam\\steamapps\\common\\TaleSpire\\TaleSpire_Data\\Taleweaver\\boardAssets\\Tiles'

output = {}

for root,d_names,f_names in os.walk(path):
    #print(root, d_names, f_names)
    for f in f_names:
        #print(f)
        if not f.endswith('boardAsset'):
            continue
        filename = os.path.join(root, f)
        with open(filename, encoding='utf-8', mode='r') as currentFile:
            data = "\n".join(currentFile.readlines()[1:])
            #data=currentFile.read().replace('\n', '')
            asset = json.loads(data)
            nguid = asset["GUID"]
            asset_name = asset["boardAssetName"]
            width = asset["assetLoaders"][0]["occluderInfo"]["Width"]
            height = asset["assetLoaders"][0]["occluderInfo"]["Height"]
            depth = asset["assetLoaders"][0]["occluderInfo"]["Depth"]
            output[nguid] = {"name": asset_name, "width": width, "height": height, "depth": depth}
with open("assetdata.js", "w") as fout:
    fout.write("asset_data = " + json.dumps(output) + ";")
