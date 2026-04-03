var script_class = "tool"

# =============================================================================
# Keyboard Controls — Global hotkeys for Dungeondraft
#   WASD: Pan camera
#   Shift+Arrow keys: Nudge selected objects
#   Delete: Delete selected objects
#
# This extends the SelectTool so update() runs every frame when
# the select tool is active (the most common tool to have active).
# =============================================================================

var select_tool = null
var pan_speed: float = 1200.0
var nudge_amount: float = 32.0

# Key state tracking for single-fire actions
var delete_was_pressed: bool = false
var up_was_pressed: bool = false
var down_was_pressed: bool = false
var left_was_pressed: bool = false
var right_was_pressed: bool = false

func start():
	# Extend the SelectTool — add a Delete button and info note
	var tool_panel = Global.Editor.Toolset.GetToolPanel("SelectTool")

	var delete_btn = tool_panel.CreateButton("Delete Selected", "")
	delete_btn.connect("pressed", self, "_on_delete_pressed")

	tool_panel.CreateSeparator()
	tool_panel.CreateNote("Hotkeys:\nWASD = Pan camera\nShift+Arrows = Nudge\nDelete = Delete selection")

	# Cache the select tool
	select_tool = Global.Editor.Tools["SelectTool"]

func update(delta: float):
	# Skip if user is typing in a search box
	if Global.Editor.SearchHasFocus:
		return

	_handle_camera_pan(delta)
	_handle_nudge_and_delete()

# =============================================================================
# CAMERA PAN — WASD (continuous while held)
# =============================================================================

func _handle_camera_pan(delta: float):
	var pan = Vector2.ZERO

	if Input.is_key_pressed(KEY_W):
		pan.y -= 1
	if Input.is_key_pressed(KEY_S):
		pan.y += 1
	if Input.is_key_pressed(KEY_A):
		pan.x -= 1
	if Input.is_key_pressed(KEY_D):
		pan.x += 1

	if pan == Vector2.ZERO:
		return

	# Scale speed by zoom level so panning feels consistent
	pan = pan.normalized() * pan_speed * delta

	# Access camera — it's a child of World
	var camera = Global.World.get_node("Camera")
	if camera:
		camera.Pan(camera.global_position + pan)

# =============================================================================
# NUDGE & DELETE — Arrow keys + Delete (single-fire per press)
# =============================================================================

func _handle_nudge_and_delete():
	# Delete key
	var del_pressed = Input.is_key_pressed(KEY_DELETE)
	if del_pressed and not delete_was_pressed:
		if select_tool and select_tool.Selectables.size() > 0:
			select_tool.Delete()
	delete_was_pressed = del_pressed

	# Shift + Arrow keys = nudge selection (single-fire)
	if not Input.is_key_pressed(KEY_SHIFT):
		up_was_pressed = false
		down_was_pressed = false
		left_was_pressed = false
		right_was_pressed = false
		return

	if not select_tool or select_tool.Selectables.size() == 0:
		return

	var nudge = Vector2.ZERO

	var up = Input.is_key_pressed(KEY_UP)
	if up and not up_was_pressed:
		nudge.y -= nudge_amount
	up_was_pressed = up

	var down = Input.is_key_pressed(KEY_DOWN)
	if down and not down_was_pressed:
		nudge.y += nudge_amount
	down_was_pressed = down

	var left = Input.is_key_pressed(KEY_LEFT)
	if left and not left_was_pressed:
		nudge.x -= nudge_amount
	left_was_pressed = left

	var right = Input.is_key_pressed(KEY_RIGHT)
	if right and not right_was_pressed:
		nudge.x += nudge_amount
	right_was_pressed = right

	if nudge != Vector2.ZERO:
		var t = Transform2D(0, nudge)
		select_tool.ApplyTransforms(t)

# =============================================================================
# DELETE BUTTON CALLBACK
# =============================================================================

func _on_delete_pressed():
	if select_tool and select_tool.Selectables.size() > 0:
		select_tool.Delete()
