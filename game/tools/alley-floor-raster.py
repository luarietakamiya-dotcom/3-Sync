# Rasterize the offline SVG chip proof using system librsvg/Cairo.
# Run from repository root after front-variety-gallery.cjs.
import ctypes as c
r=c.CDLL('librsvg-2.so.2'); ca=c.CDLL('libcairo.so.2');g=c.CDLL('libgobject-2.0.so.0')
r.rsvg_handle_new_from_file.argtypes=[c.c_char_p,c.c_void_p];r.rsvg_handle_new_from_file.restype=c.c_void_p
r.rsvg_handle_render_cairo.argtypes=[c.c_void_p,c.c_void_p]
ca.cairo_image_surface_create.argtypes=[c.c_int,c.c_int,c.c_int];ca.cairo_image_surface_create.restype=c.c_void_p
ca.cairo_create.argtypes=[c.c_void_p];ca.cairo_create.restype=c.c_void_p
ca.cairo_surface_write_to_png.argtypes=[c.c_void_p,c.c_char_p]
h=r.rsvg_handle_new_from_file(b'game/artifacts/alley-floor/sample.svg',None);assert h
s=ca.cairo_image_surface_create(0,1320,780);ctx=ca.cairo_create(s);assert r.rsvg_handle_render_cairo(h,ctx)
assert ca.cairo_surface_write_to_png(s,b'game/artifacts/alley-floor/sample.png')==0
