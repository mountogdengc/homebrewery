var script_class = "tool"

# =============================================================================
# Random Map Generator — Dungeondraft Mod
# Procedurally generates outdoor encounter maps with terrain, rocks,
# vegetation, and paths using Dungeondraft's native rendering and asset packs.
# =============================================================================

# Configuration (updated by UI controls)
var seed_value: int = 12345
var boulder_count: int = 8
var outcropping_count: int = 3
var tree_count: int = 10
var bush_count: int = 12
var scatter_count: int = 20
var road_count: int = 1
var road_width: float = 40.0
var road_curviness: float = 0.5
var spread_val: float = 0.5
var map_style: int = 0
var terrain_variation: float = 0.6
var paint_passes: int = 40
var enable_terrain: bool = true

# Internal state
var rng: RandomNumberGenerator
var noise: OpenSimplexNoise
var generating: bool = false
var tool_panel = null
var _placed_count: int = 0

# Scale constants — DD world space uses ~256 units per grid square
# A typical 35x20 map is 8960x5120 world units
const CELL_SIZE = 256.0  # world units per grid cell
const ROAD_CLEARANCE = 400.0  # world units — about 1.5 grid squares
const EDGE_MARGIN = 512.0  # world units — 2 grid squares

# Asset lists
var object_assets: Array = []
var rock_assets: Array = []
var tree_assets: Array = []
var bush_assets: Array = []
var path_assets: Array = []

# Keywords for excluding indoor/decoration objects
const EXCLUDE_KEYWORDS = [
	"indoor", "furniture", "table", "chair", "candle", "book", "scroll",
	"potion", "bottle", "plate", "cup", "mug", "barrel", "crate",
	"chest", "bed", "carpet", "rug", "curtain", "banner", "flag",
	"torch", "lamp", "lantern", "sign", "door", "window", "shelf",
	"cabinet", "desk", "stool", "bench", "weapon", "sword", "shield",
	"armor", "helmet", "skull", "bone", "food", "bread", "meat",
	"fish", "fruit", "coin", "gem", "key", "lock", "trap",
	"statue", "fountain", "well", "cart", "wagon", "tent",
	"campfire", "fire", "smoke", "blood", "web", "rope", "chain",
	"autumn", "fall", "dead_tree", "dead tree"
]

# =============================================================================
# REQUIRED: Called when script is loaded
# =============================================================================

func start():
	tool_panel = Global.Editor.Toolset.CreateModTool(
		self, "Design", "RandomMapGen", "Random Map", ""
	)

	tool_panel.CreateLabel("Random Map Generator")
	tool_panel.CreateSeparator()

	# Seed
	var seed_slider = tool_panel.CreateSlider("seed_value", 12345, 0, 99999, 1, false)
	seed_slider.connect("value_changed", self, "_on_seed_changed")
	var rand_btn = tool_panel.CreateButton("Randomize Seed", "")
	rand_btn.connect("pressed", self, "_on_random_seed")

	tool_panel.CreateSeparator()

	# Style
	var style_menu = tool_panel.CreateLabeledDropdownMenu(
		"map_style", "Style",
		["Grassland", "Forest", "Desert", "Rocky"],
		"Grassland"
	)
	style_menu.connect("item_selected", self, "_on_style_changed")

	tool_panel.CreateSeparator()
	tool_panel.CreateLabel("-- Rocks --")

	tool_panel.CreateSlider("boulder_count", 8, 0, 20, 1, false).connect("value_changed", self, "_on_boulder_count")
	tool_panel.CreateSlider("outcropping_count", 3, 0, 10, 1, false).connect("value_changed", self, "_on_outcropping_count")
	tool_panel.CreateSlider("scatter_count", 20, 0, 50, 1, false).connect("value_changed", self, "_on_scatter_count")
	tool_panel.CreateSlider("spread_val", 0.5, 0.0, 1.0, 0.05, false).connect("value_changed", self, "_on_spread_changed")

	tool_panel.CreateSeparator()
	tool_panel.CreateLabel("-- Vegetation --")

	tool_panel.CreateSlider("tree_count", 10, 0, 30, 1, false).connect("value_changed", self, "_on_tree_count")
	tool_panel.CreateSlider("bush_count", 12, 0, 30, 1, false).connect("value_changed", self, "_on_bush_count")

	tool_panel.CreateSeparator()
	tool_panel.CreateLabel("-- Roads --")

	tool_panel.CreateSlider("road_count", 1, 0, 5, 1, false).connect("value_changed", self, "_on_road_count")
	tool_panel.CreateSlider("road_width", 40.0, 20.0, 80.0, 5.0, false).connect("value_changed", self, "_on_road_width")
	tool_panel.CreateSlider("road_curviness", 0.5, 0.0, 1.0, 0.05, false).connect("value_changed", self, "_on_road_curve")

	tool_panel.CreateSeparator()
	tool_panel.CreateLabel("-- Terrain --")

	var terrain_toggle = tool_panel.CreateCheckButton("Paint Terrain", "enable_terrain", true)
	terrain_toggle.connect("toggled", self, "_on_terrain_toggle")
	tool_panel.CreateSlider("terrain_variation", 0.6, 0.0, 1.0, 0.05, false).connect("value_changed", self, "_on_terrain_var")
	tool_panel.CreateSlider("paint_passes", 40, 10, 80, 1, false).connect("value_changed", self, "_on_paint_passes")

	tool_panel.CreateSeparator()

	var gen_btn = tool_panel.CreateButton("GENERATE MAP", "")
	gen_btn.connect("pressed", self, "_on_generate")

	tool_panel.CreateSeparator()
	tool_panel.CreateNote("Tip: Set terrain textures in the Terrain tool before generating. Only slots 1-3 are painted as variation.")

# =============================================================================
# TOOL LIFECYCLE
# =============================================================================

func on_tool_enable(tool_id):
	_discover_assets()

func on_tool_disable(tool_id):
	pass

# =============================================================================
# ASSET DISCOVERY
# =============================================================================

func _discover_assets():
	object_assets = Script.GetAssetList("Objects")

	rock_assets = []
	tree_assets = []
	bush_assets = []

	for asset_path in object_assets:
		var lower = asset_path.to_lower()

		# Skip indoor/decoration objects
		var excluded = false
		for kw in EXCLUDE_KEYWORDS:
			if kw in lower:
				excluded = true
				break
		if excluded:
			continue

		# Categorize outdoor assets
		if "rock" in lower or "boulder" in lower or "stone" in lower or "rubble" in lower:
			rock_assets.append(asset_path)
		elif "tree" in lower and not "stump" in lower:
			tree_assets.append(asset_path)
		elif "bush" in lower or "shrub" in lower or "hedge" in lower or "fern" in lower:
			bush_assets.append(asset_path)

	path_assets = Script.GetAssetList("Paths")

	print("[RandomMapGen] Assets: %d rocks, %d trees, %d bushes, %d paths (from %d total)" % [
		rock_assets.size(), tree_assets.size(), bush_assets.size(),
		path_assets.size(), object_assets.size()
	])

# =============================================================================
# UI CALLBACKS
# =============================================================================

func _on_seed_changed(val): seed_value = int(val)
func _on_random_seed(): seed_value = randi() % 99999
func _on_style_changed(idx): map_style = idx
func _on_boulder_count(val): boulder_count = int(val)
func _on_outcropping_count(val): outcropping_count = int(val)
func _on_scatter_count(val): scatter_count = int(val)
func _on_spread_changed(val): spread_val = val
func _on_tree_count(val): tree_count = int(val)
func _on_bush_count(val): bush_count = int(val)
func _on_road_count(val): road_count = int(val)
func _on_road_width(val): road_width = val
func _on_road_curve(val): road_curviness = val
func _on_terrain_var(val): terrain_variation = val
func _on_paint_passes(val): paint_passes = int(val)
func _on_terrain_toggle(val): enable_terrain = val

func _on_generate():
	if generating:
		return
	generating = true
	_discover_assets()
	_generate_map()

# =============================================================================
# MAP GENERATION
# =============================================================================

func _generate_map():
	_placed_count = 0
	_init_rng()

	var world = Global.World
	if not world:
		OS.alert("No map open.", "RandomMapGen")
		generating = false
		return

	var level = world.GetLevelByID(world.CurrentLevelId)
	if not level:
		OS.alert("No active level.", "RandomMapGen")
		generating = false
		return

	# WoxelDimensions gives world-space coordinates
	var map_w = world.WoxelDimensions.x
	var map_h = world.WoxelDimensions.y

	if map_w <= 0 or map_h <= 0:
		OS.alert("Could not read map dimensions.", "RandomMapGen")
		generating = false
		return

	# Phase 1: Paint terrain variation
	if enable_terrain:
		_paint_terrain(level, map_w, map_h)

	# Phase 2: Generate roads
	var road_data = []
	if road_count > 0 and path_assets.size() > 0:
		road_data = _generate_roads(level, map_w, map_h)

	# Phase 3: Build road samples for clearance
	var road_samples = _build_road_samples(road_data)

	# Phase 4: Place rocks
	if rock_assets.size() > 0:
		_place_rocks(level, map_w, map_h, road_samples)

	# Phase 5: Place vegetation
	_place_vegetation(level, map_w, map_h, road_samples)

	OS.alert("Done! Placed %d objects.\nSeed: %d" % [_placed_count, seed_value], "RandomMapGen")
	generating = false

# =============================================================================
# RNG
# =============================================================================

func _init_rng():
	rng = RandomNumberGenerator.new()
	rng.seed = seed_value

	noise = OpenSimplexNoise.new()
	noise.seed = seed_value
	noise.octaves = 4
	noise.period = 120.0
	noise.persistence = 0.5
	noise.lacunarity = 2.0

# =============================================================================
# TERRAIN — only paints variation into slots 1-3 over slot 0 base
# =============================================================================

func _paint_terrain(level, map_w: float, map_h: float):
	var terrain = level.Terrain
	if not terrain:
		return

	# Fill with slot 0 as base
	terrain.Fill(0)

	var brush_size = 64
	for i in range(paint_passes):
		var wx = rng.randf() * map_w
		var wy = rng.randf() * map_h

		var noise_val = noise.get_noise_2d(wx * 0.008, wy * 0.008)
		var terrain_id = 0

		if abs(noise_val) > (1.0 - terrain_variation) * 0.5:
			if noise_val < -0.2:
				terrain_id = 1
			elif noise_val > 0.3:
				terrain_id = 2
			elif noise_val > 0.05:
				terrain_id = 3
			else:
				continue

			var tex_pos = terrain.WorldToTexture(Vector2(wx, wy))
			var rate = 0.3 + abs(noise_val) * terrain_variation * 0.5
			var cur_size = int(brush_size * (0.5 + rng.randf() * 1.5))
			var brush = _create_soft_brush(cur_size)
			var brush_offset = Vector2(cur_size / 2, cur_size / 2)
			terrain.Paint(terrain_id, brush, brush_offset, tex_pos, rate)

	terrain.UpdateSplat()

func _create_soft_brush(size: int) -> Image:
	var brush = Image.new()
	brush.create(size, size, false, Image.FORMAT_RGBA8)
	brush.lock()
	var center = size / 2.0
	var radius = size / 2.0
	for x in range(size):
		for y in range(size):
			var dist = Vector2(x - center, y - center).length() / radius
			var alpha = clamp(1.0 - dist * dist * dist, 0.0, 1.0)
			brush.set_pixel(x, y, Color(1, 1, 1, alpha))
	brush.unlock()
	return brush

# =============================================================================
# ROADS
# =============================================================================

func _generate_roads(level, map_w: float, map_h: float) -> Array:
	var pathways = level.Pathways
	if not pathways:
		return []

	var road_data = []

	for i in range(road_count):
		var start_pt = _random_edge_point(map_w, map_h)
		var end_pt = _random_edge_point(map_w, map_h)
		var attempts = 0
		while end_pt.side == start_pt.side and attempts < 10:
			end_pt = _random_edge_point(map_w, map_h)
			attempts += 1

		var segments = 3 + rng.randi() % 3
		var points = PoolVector2Array()
		points.append(start_pt.pos)

		for s in range(1, segments):
			var t = float(s) / float(segments)
			var base = start_pt.pos.linear_interpolate(end_pt.pos, t)

			var dir = end_pt.pos - start_pt.pos
			var perp = Vector2(-dir.y, dir.x).normalized()
			var noise_val = noise.get_noise_2d(base.x * 0.005 + i * 100, base.y * 0.005)
			var offset = noise_val * road_curviness * min(map_w, map_h) * 0.3
			base += perp * offset

			# Road merging
			if road_data.size() > 0:
				var closest_dist = INF
				var closest_pt = Vector2.ZERO
				for prev_road in road_data:
					for pt in prev_road.samples:
						var d = base.distance_to(pt)
						if d < closest_dist:
							closest_dist = d
							closest_pt = pt
				var merge_dist = road_width * CELL_SIZE * 0.1
				if closest_dist < merge_dist:
					var pull = 1.0 - (closest_dist / merge_dist)
					base += (closest_pt - base) * pull * 0.6

			points.append(base)

		points.append(end_pt.pos)

		var path_asset = path_assets[rng.randi() % path_assets.size()]
		var path_tex = Script.GetAssetTexture("Paths", path_asset)
		if path_tex:
			var pathway = pathways.CreatePath(path_tex, 0, 1, true, true, false, false)
			if pathway:
				pathway.SetEditPoints(points)
				pathway.SetWidthScale(road_width / 40.0)
				pathway.Smooth()

		var samples = _sample_polyline(points, CELL_SIZE * 0.5)
		road_data.append({
			"points": points,
			"samples": samples,
			"width": road_width
		})

	return road_data

func _random_edge_point(map_w: float, map_h: float) -> Dictionary:
	var side = rng.randi() % 4
	var pos = Vector2.ZERO
	match side:
		0: pos = Vector2(rng.randf() * map_w, 0)
		1: pos = Vector2(map_w, rng.randf() * map_h)
		2: pos = Vector2(rng.randf() * map_w, map_h)
		3: pos = Vector2(0, rng.randf() * map_h)
	return { "pos": pos, "side": side }

func _sample_polyline(points: PoolVector2Array, step: float) -> Array:
	var samples = []
	for i in range(points.size() - 1):
		var a = points[i]
		var b = points[i + 1]
		var dist = a.distance_to(b)
		var steps = max(1, int(ceil(dist / step)))
		for s in range(steps + 1):
			var t = float(s) / float(steps)
			samples.append(a.linear_interpolate(b, t))
	return samples

func _build_road_samples(road_data: Array) -> Array:
	var all_samples = []
	for road in road_data:
		all_samples.append_array(road.samples)
	return all_samples

func _dist_to_road(pos: Vector2, road_samples: Array) -> float:
	var min_dist = INF
	for sample in road_samples:
		var d = pos.distance_to(sample)
		if d < min_dist:
			min_dist = d
	return min_dist

# =============================================================================
# ROCK PLACEMENT
# =============================================================================

func _place_rocks(level, map_w: float, map_h: float, road_samples: Array):
	var objects = level.Objects
	if not objects:
		return

	# Boulders — scale 0.6-1.4 (DD native object scale)
	for i in range(boulder_count):
		var pos = _spread_position(map_w, map_h)
		if road_samples.size() > 0:
			if _dist_to_road(pos, road_samples) < ROAD_CLEARANCE:
				continue
		var s = 0.6 + rng.randf() * 0.8
		_place_asset(objects, pos, s, rock_assets, true)

	# Outcroppings — clustered rocks
	for i in range(outcropping_count):
		var center = _spread_position(map_w, map_h)
		if road_samples.size() > 0:
			if _dist_to_road(center, road_samples) < ROAD_CLEARANCE * 1.5:
				continue
		var cluster_size = 3 + rng.randi() % 5
		for j in range(cluster_size):
			var off = Vector2(
				(rng.randf() - 0.5) * CELL_SIZE * 3,
				(rng.randf() - 0.5) * CELL_SIZE * 3
			)
			var s = 0.4 + rng.randf() * 0.8
			_place_asset(objects, center + off, s, rock_assets, true)

	# Scattered stones — small
	for i in range(scatter_count):
		var pos = _spread_position(map_w, map_h)
		if road_samples.size() > 0:
			if _dist_to_road(pos, road_samples) < ROAD_CLEARANCE * 0.5:
				continue
		_place_asset(objects, pos, 0.15 + rng.randf() * 0.3, rock_assets, false)

# =============================================================================
# VEGETATION PLACEMENT
# =============================================================================

func _place_vegetation(level, map_w: float, map_h: float, road_samples: Array):
	var objects = level.Objects
	if not objects:
		return

	# Trees
	if tree_assets.size() > 0:
		for i in range(tree_count):
			var pos = _spread_position(map_w, map_h)
			if road_samples.size() > 0:
				if _dist_to_road(pos, road_samples) < ROAD_CLEARANCE * 0.7:
					continue
			var s = 0.5 + rng.randf() * 0.5
			if map_style == 1:  # Forest — slightly bigger
				s += 0.2
			elif map_style == 2:  # Desert — fewer, smaller
				if rng.randf() > 0.4:
					continue
				s *= 0.7
			_place_asset(objects, pos, s, tree_assets, true)

	# Bushes
	if bush_assets.size() > 0:
		for i in range(bush_count):
			var pos = _spread_position(map_w, map_h)
			if road_samples.size() > 0:
				if _dist_to_road(pos, road_samples) < ROAD_CLEARANCE * 0.3:
					continue
			var s = 0.3 + rng.randf() * 0.4
			if map_style == 2:  # Desert — sparse
				if rng.randf() > 0.5:
					continue
			_place_asset(objects, pos, s, bush_assets, false)

# =============================================================================
# OBJECT PLACEMENT HELPER
# =============================================================================

func _place_asset(objects, pos: Vector2, scale_val: float,
		asset_pool: Array, has_shadow: bool):
	if asset_pool.size() == 0:
		return

	var asset_path = asset_pool[rng.randi() % asset_pool.size()]
	var tex = Script.GetAssetTexture("Objects", asset_path)
	if not tex:
		return

	var prop = objects.CreateObject(0)  # 0 = Over
	if not prop:
		return

	prop.SetTexture(tex)
	prop.position = pos
	prop.rotation = rng.randf() * TAU
	prop.scale = Vector2.ONE * scale_val
	prop.HasShadow = has_shadow
	prop.Mirror = rng.randf() > 0.5
	objects.AddToSearchTable(prop, false)
	_placed_count += 1

# =============================================================================
# SPREAD ALGORITHM
# =============================================================================

func _spread_position(map_w: float, map_h: float) -> Vector2:
	var margin = EDGE_MARGIN

	if spread_val >= 0.95:
		# Center-biased
		var cx = map_w / 2 + (rng.randf() - 0.5 + rng.randf() - 0.5) * map_w * 0.35
		var cy = map_h / 2 + (rng.randf() - 0.5 + rng.randf() - 0.5) * map_h * 0.35
		return Vector2(clamp(cx, margin, map_w - margin), clamp(cy, margin, map_h - margin))

	if spread_val <= 0.05:
		return _edge_position(map_w, map_h)

	if rng.randf() > spread_val:
		return _edge_position(map_w, map_h)
	else:
		var bias = spread_val * 0.5
		var cx = map_w * bias + rng.randf() * map_w * (1.0 - 2.0 * bias)
		var cy = map_h * bias + rng.randf() * map_h * (1.0 - 2.0 * bias)
		return Vector2(clamp(cx, margin, map_w - margin), clamp(cy, margin, map_h - margin))

func _edge_position(map_w: float, map_h: float) -> Vector2:
	var side = rng.randi() % 4
	var depth = EDGE_MARGIN * (0.3 + rng.randf() * 0.7)
	match side:
		0: return Vector2(EDGE_MARGIN + rng.randf() * (map_w - 2 * EDGE_MARGIN), depth)
		1: return Vector2(map_w - depth, EDGE_MARGIN + rng.randf() * (map_h - 2 * EDGE_MARGIN))
		2: return Vector2(EDGE_MARGIN + rng.randf() * (map_w - 2 * EDGE_MARGIN), map_h - depth)
		3: return Vector2(depth, EDGE_MARGIN + rng.randf() * (map_h - 2 * EDGE_MARGIN))
	return Vector2(map_w / 2, map_h / 2)
