# Random Map Generator — Dungeondraft Mod

A Dungeondraft mod that procedurally generates random outdoor encounter maps with terrain variation, rocks, vegetation, and roads/paths.

## Features

- **Terrain Painting**: Noise-based terrain blending across up to 4 texture slots
- **Rock Placement**: Boulders, outcroppings (clustered rocks), and scattered stones
- **Vegetation**: Trees and bushes with style-aware density
- **Road Generation**: Curved paths with noise-based curvature and road merging
- **Spread Control**: Edge-biased, uniform, or center-biased object distribution
- **Road Clearance**: Automatic object avoidance around generated paths
- **Map Styles**: Grassland, Forest, Desert, Rocky presets
- **Seeded RNG**: Same seed always produces the same map
- **Fully Editable**: Generated maps are native Dungeondraft objects — move, delete, or add to them freely

## Installation

1. Open Dungeondraft
2. Go to **Mods** menu
3. Click **Open Mods Folder**
4. Copy the entire `RandomMapGenerator/` folder into the mods directory
5. Restart Dungeondraft or click **Reload Mods**
6. The "Random Map Generator" tool should appear in the toolbar

## Usage

1. Create a new map or open an existing one
2. **Set up terrain textures** in the Terrain tool first (the generator uses your configured terrain slots)
3. Select the **Random Map Generator** tool from the toolbar
4. Configure settings:
   - **Seed**: Determines the random layout (use "Random" for a new seed)
   - **Style**: Grassland/Forest/Desert/Rocky (affects vegetation density)
   - **Rocks**: Boulder count, outcroppings, scattered stones, spread, size range
   - **Vegetation**: Tree and bush counts
   - **Roads**: Count, width, curviness, clearance distance from rocks
   - **Terrain**: Variation strength and paint pass count
5. Click **Generate Map**
6. Edit the result as needed — all objects are standard Dungeondraft props

## Asset Packs

The mod discovers rock, tree, and bush textures from installed asset packs automatically. It searches common directory patterns used by default and popular community packs. More assets installed = more visual variety in generated maps.

## Requirements

- Dungeondraft v1.1.0.0 or higher

## Known Limitations

- Asset discovery depends on pack directory structure — some packs may not be auto-detected
- Terrain painting uses the textures already assigned to terrain slots 0-3
- Road/path textures must be available from installed packs
- Generated content is added to the current level only
