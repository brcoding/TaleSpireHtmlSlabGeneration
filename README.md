# Overview

Tool to allow creating slabs in TaleSpire using javascript.  This small library uses pako(for gzip) and math.js (for vector math).

***Note** This project is not associated with Bouncyrock. If you have a bug with this project please file it here and not with the company who created TaleSpire.

# Usage

- Install python 3.x

- Edit extracttiles.py and change path to match your local path:

```path = 'G:\\Program Files (x86)\\Steam\\steamapps\\common\\TaleSpire\\TaleSpire_Data\\Taleweaver\\boardAssets\\Tiles'```

- Execute:
```python extracttiles.py```
This will generate assetdata.js

- Open your html file and add to the <head> section:

```<script src="talespireslabs.js"></script>```

An example script is included called forestgen.html.

# API:

## TalespireSlabs.DecodeSlab(pastestring)

Reads a slab string that can be obtained from TaleSpire by coping any objects.

### Parameters

- pastestring - Takes in a TaleSpire formatted string containing a slab and returns a summary of the data as a string.

**Example:** 

``````
  ```H4sIAAAAAAAACzv369xFRgZGhuATs99e3WfjsiV+ubBtKKMUIwMIODiKrFtuD2QcYGBosIewG+xZOHHLAQAQOzLSUAAAAA==```
``````

**Example Output:**

```
Number of Layouts: 1

Total Asset Count: 1

Dead Tree 03 NGuid: ed9bc853-bed5-443c-b45f-a7133d55011a

Rotation: 4
Center X: 12 Y: 1.31 Z: -2 Extents X: 1 Y: 1.31 Z: 1
```

## TalespireSlabs.CreateSlab(create_payload)

Creates a slab by taking in the layout information along with assets and turning it into the binary representation along with gzipping and turning that
string into a base64 string that TaleSpire can read by pasting.

### Parameters

- create_payload - An object containing the layouts and assets along with locations.

**Example:**

```
create_payload = [
    {
        'nguid': 'ed9bc853-bed5-443c-b45f-a7133d55011a', 
        'assets': [
            {
                'rotation': 4, 
                'bounds': 
                {
                    'center': {'x': 1, 'y': 1, 'z': 1}, 
                    'extents': {'x': 1, 'y': 1, 'z': 1}
                }
            },
            {
                'rotation': 4, 
                'bounds': 
                {
                    'center': {'x': 2, 'y': 1, 'z': 2}, 
                    'extents': {'x': 1, 'y': 1, 'z': 1}
                }
            }
        ]
    }
    ];
```

**Example Output:**

`````
```H4sIAAAAAAAAAzv369xFRgZGhuATs99e3WfjsiV+ubBtKKMUEwMINNhjwyxgOQYHCB9GI8th1weSAQAdG0xwcAAAAA==```
`````

## TalespireSlabs.GetAllAssets()

Returns an object with all scanned assets from the extracttiles.py script.

### Parameters

- None

**Example Output:**

```

{
    "8df8bc5f-8aff-4d73-bb7d-d6c1bdb60113": {"name": "Castle Wall/Floor 1", "width": 2, "height": 3, "depth": 2}, 
    "b33fedfa-7352-4f02-9c2f-18ba4a6ac452": {"name": "Castle Wall/Floor 2", "width": 3, "height": 3, "depth": 2},
    ...
}

```

## TalespireSlabs.GetAsset(nguid)

Returns a single object by asset nguid along with the name, width, height, and depth. This can be used to determine how much space an asset requires while creating layouts to pass to CreateSlab.

### Parameters

- nguid - 8df8bc5f-8aff-4d73-bb7d-d6c1bdb60113

**Example Output:**

```

{"name": "Castle Wall/Floor 1", "width": 2, "height": 3, "depth": 2}

```
