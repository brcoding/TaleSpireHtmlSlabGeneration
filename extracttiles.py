import json
import os
import glob
import pprint

#Assets are stored in a single file called index.json. Make sure to change the path to its location on your machine
path = r'C:\Program Files (x86)\Steam\steamapps\common\TaleSpire\Taleweaver\d71427a1-5535-4fa7-82d7-4ca1e75edbfd\index.json'

output = {}

with open(path, encoding='utf-8', mode='r') as currentFile:
    assets = json.loads(currentFile.read())["Tiles"]
    for asset in assets:
        nguid = asset["Id"]
        asset_name = asset["Name"]
        board_asset_group = asset["GroupTag"]
        width = 0
        depth = 0

        #Get width and height based on tag name (eg. 1x2)
        for tag in asset["Tags"]:
            tag = tag.lower()
            if "x" in tag:
                try:
                    X_index = tag.index("x")
                    
                    width = int(tag[:X_index])
                    depth = int(tag[X_index+1:])

                    #print(f"Tag: {tag} width: {width} Height: {depth}")
                except ValueError: 
                    print(f"Invalid tag with X: {tag}")
                    pass
        if width == 0 or depth == 0:
            raise RuntimeError(f'Width and Depth not specified in the index.json file for asset named: {asset_name}')
            
        height = asset["ColliderBoundsBound"]["m_Extent"]["y"]

        output[nguid] = {"name": asset_name, "group": board_asset_group, "width": width, "height": height, "depth": depth}

with open("assetdata.js", "w") as fout:
    fout.write("asset_data = " + json.dumps(output) + ";")