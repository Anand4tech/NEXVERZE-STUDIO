import math
import subprocess

def make_stadium_path(w, h, r):
    # Centered at 0, 0
    # w is straight length, h is total height (so cap radius is h/2)
    # returns SVG path string
    r = h / 2.0
    hw = w / 2.0
    # Left cap center: -hw, Right cap center: +hw
    return f"M {-hw} {-r} L {hw} {-r} A {r} {r} 0 0 1 {hw} {r} L {-hw} {r} A {r} {r} 0 0 1 {-hw} {-r} Z"

def generate_knot_svg():
    width = 640
    height = 540
    cx = width / 2
    cy = height / 2

    # Loop parameters
    # The two loops are tilted at -34 deg and +34 deg
    # Width between cap centers: 180, total height: 160 (radius 80)
    # Band stroke width: 54
    # Inner opening height: 160 - 54*2 = 52
    
    # Let's create high resolution SVG
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    
    # Definitions
    svg.append('''<defs>
      <!-- Metallic Chrome Outer Rim Gradient -->
      <linearGradient id="chromeBevel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="15%" stop-color="#e2e8f0" stop-opacity="1"/>
        <stop offset="35%" stop-color="#94a3b8" stop-opacity="1"/>
        <stop offset="55%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="75%" stop-color="#64748b" stop-opacity="1"/>
        <stop offset="90%" stop-color="#cbd5e1" stop-opacity="1"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
      </linearGradient>

      <!-- Inner Glow Bevel -->
      <linearGradient id="innerRimGlow" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#64748b" stop-opacity="0.7"/>
        <stop offset="70%" stop-color="#e2e8f0" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#475569" stop-opacity="0.8"/>
      </linearGradient>

      <!-- Dark Translucent PCB Substrate -->
      <linearGradient id="pcbSubstrate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#212836"/>
        <stop offset="45%" stop-color="#111620"/>
        <stop offset="70%" stop-color="#18202c"/>
        <stop offset="100%" stop-color="#0e1219"/>
      </linearGradient>

      <!-- Circuit Traces Silver Glow -->
      <linearGradient id="circuitTrace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="#e6edf3"/>
        <stop offset="70%" stop-color="#b0c0d4"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>

      <!-- Drop Shadows & Glows -->
      <filter id="pcbGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="crossoverShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.9"/>
      </filter>

      <filter id="outerHalo" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffffff" flood-opacity="0.4"/>
      </filter>
    </defs>''')

    # Main container centered
    svg.append(f'<g transform="translate({cx}, {cy})" filter="url(#outerHalo)">')

    # Dimensions:
    # Outer stadium: straight = 175, total h = 180 (radius 90)
    # Band thickness = 52
    # Inner stadium: straight = 175, total h = 180 - 52*2 = 76 (radius 38)
    # Stroke center radius = (90 + 38) / 2 = 64
    
    angle = 33.5 # degrees tilt for each loop
    
    # We will draw the loops with the over-under weave
    # Loop 1 is tilted at -33.5 deg
    # Loop 2 is tilted at +33.5 deg
    
    # Let's generate circuit lines inside each stadium!
    # For a stadium with cap centers at (-d, 0) and (+d, 0) and radius R:
    def get_stadium_points(d, r, steps=100):
        pts = []
        # Top straight: from -d, -r to +d, -r
        for i in range(steps // 4):
            t = i / (steps // 4)
            pts.append((-d + 2*d*t, -r))
        # Right cap: angle -pi/2 to +pi/2
        for i in range(steps // 4):
            th = -math.pi/2 + math.pi * (i / (steps // 4))
            pts.append((d + r * math.cos(th), r * math.sin(th)))
        # Bottom straight: from +d, r to -d, r
        for i in range(steps // 4):
            t = i / (steps // 4)
            pts.append((d - 2*d*t, r))
        # Left cap: angle +pi/2 to 3*pi/2
        for i in range(steps // 4):
            th = math.pi/2 + math.pi * (i / (steps // 4))
            pts.append((-d + r * math.cos(th), r * math.sin(th)))
        return pts

    def pts_to_path(pts):
        d = f"M {pts[0][0]:.2f} {pts[0][1]:.2f} "
        for p in pts[1:]:
            d += f"L {p[0]:.2f} {p[1]:.2f} "
        d += "Z"
        return d

    d = 88.0
    r_outer = 94.0
    r_inner = 40.0
    r_mid = (r_outer + r_inner) / 2.0 # 67.0
    band_w = r_outer - r_inner # 54.0

    # Draw loop component (with substrate + circuit board elements + beveled rims)
    def render_loop(rot_deg, clip_mode=None):
        out = []
        transform = f'transform="rotate({rot_deg})"'
        out.append(f'<g {transform}>')
        
        # 1. Base substrate (thick band)
        # Using stroke of width band_w on r_mid
        out.append(f'<path d="{pts_to_path(get_stadium_points(d, r_mid))}" fill="none" stroke="url(#pcbSubstrate)" stroke-width="{band_w}" stroke-linejoin="round"/>')
        
        # 2. PCB Circuit Traces inside the band
        # Radii offsets within the band: [-20, -14, -8, -2, 4, 10, 16, 21]
        offsets = [-20, -14, -8, -2, 4, 10, 16, 21]
        for idx, off in enumerate(offsets):
            curr_r = r_mid + off
            pts = get_stadium_points(d, curr_r, steps=120)
            
            # Draw base trace line
            opacity = 0.85 if idx % 2 == 0 else 0.65
            width_t = 1.6 if idx % 2 == 0 else 1.2
            
            # Dashed sections to simulate real circuit lines with breaks & vias
            dash = "none"
            if idx == 1:
                dash = "40 12 70 15 30 10"
            elif idx == 3:
                dash = "80 20 50 15 60 10"
            elif idx == 5:
                dash = "60 15 40 20 80 12"
            elif idx == 6:
                dash = "30 10 90 20 40 15"
                
            out.append(f'<path d="{pts_to_path(pts)}" fill="none" stroke="url(#circuitTrace)" stroke-width="{width_t}" stroke-dasharray="{dash}" stroke-linecap="round" opacity="{opacity}"/>')
        
        # 3. Add Micro Vias / Solder Dots along the track
        via_angles = [-1.3, -0.8, -0.3, 0.4, 0.9, 1.4, 2.2, 2.7, 3.5, 4.1]
        for i, va in enumerate(via_angles):
            for ro in [-16, -6, 8, 18]:
                # on straight or cap
                vx = d * math.cos(va) + (r_mid + ro) * math.cos(va * 1.5)
                vy = (r_mid + ro) * math.sin(va * 1.2)
                if abs(vx) < 170 and abs(vy) < 90:
                    out.append(f'<circle cx="{vx:.1f}" cy="{vy:.1f}" r="2.2" fill="#ffffff" opacity="0.9"/>')
                    out.append(f'<circle cx="{vx:.1f}" cy="{vy:.1f}" r="1.0" fill="#111620"/>')

        # 4. Silicon Microchip IC packages on the band
        chips = [
            (-d - 10, -20, 22, 22),
            (d - 5, 20, 24, 24),
            (20, -r_mid, 22, 22),
            (-30, r_mid, 24, 24),
        ]
        for cx_c, cy_c, cw, ch in chips:
            out.append(f'''<g transform="translate({cx_c}, {cy_c})">
              <!-- IC Pins -->
              <line x1="-3" y1="4" x2="-6" y2="4" stroke="#ffffff" stroke-width="1.5"/>
              <line x1="-3" y1="11" x2="-6" y2="11" stroke="#ffffff" stroke-width="1.5"/>
              <line x1="-3" y1="18" x2="-6" y2="18" stroke="#ffffff" stroke-width="1.5"/>
              <line x1="{cw+3}" y1="4" x2="{cw+6}" y2="4" stroke="#ffffff" stroke-width="1.5"/>
              <line x1="{cw+3}" y1="11" x2="{cw+6}" y2="11" stroke="#ffffff" stroke-width="1.5"/>
              <line x1="{cw+3}" y1="18" x2="{cw+6}" y2="18" stroke="#ffffff" stroke-width="1.5"/>
              <!-- IC Body -->
              <rect x="0" y="0" width="{cw}" height="{ch}" rx="3" fill="#1a202c" stroke="#e2e8f0" stroke-width="1.5"/>
              <!-- Silicon Die / Notch -->
              <circle cx="5" cy="5" r="1.5" fill="#ffffff" opacity="0.8"/>
              <rect x="4" y="4" width="{cw-8}" height="{ch-8}" rx="2" fill="#2d3748" stroke="#718096" stroke-width="0.8"/>
            </g>''')

        # 5. Inner & Outer Beveled Borders (Thick Silver/Chrome rim with Specular highlights)
        # Outer boundary
        out.append(f'<path d="{pts_to_path(get_stadium_points(d, r_outer))}" fill="none" stroke="url(#chromeBevel)" stroke-width="4.5" stroke-linejoin="round"/>')
        out.append(f'<path d="{pts_to_path(get_stadium_points(d, r_outer - 1.5))}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.9"/>')

        # Inner boundary
        out.append(f'<path d="{pts_to_path(get_stadium_points(d, r_inner))}" fill="none" stroke="url(#chromeBevel)" stroke-width="4.5" stroke-linejoin="round"/>')
        out.append(f'<path d="{pts_to_path(get_stadium_points(d, r_inner + 1.5))}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.9"/>')

        out.append('</g>')
        return "\n".join(out)

    # To create the true Celtic over-under crossover effect:
    # First render Loop 1 (-angle) in full
    svg.append(render_loop(-angle))
    
    # Render Loop 2 (+angle) in full
    svg.append(render_loop(+angle))

    # Re-stamp crossover areas of Loop 1 where it weaves OVER Loop 2
    # Crossover 1: Top-Left crossover region (x in [-70, 70], y in [-140, -40])
    # Crossover 2: Bottom-Right crossover region (x in [-70, 70], y in [40, 140])
    svg.append('<g filter="url(#crossoverShadow)">')
    svg.append('<clipPath id="crossoverTop">')
    svg.append('  <rect x="-100" y="-160" width="140" height="110" rx="20"/>')
    svg.append('</clipPath>')
    svg.append('<g clip-path="url(#crossoverTop)">')
    svg.append(render_loop(-angle))
    svg.append('</g>')
    svg.append('</g>')

    svg.append('<g filter="url(#crossoverShadow)">')
    svg.append('<clipPath id="crossoverBottom">')
    svg.append('  <rect x="-40" y="50" width="140" height="110" rx="20"/>')
    svg.append('</clipPath>')
    svg.append('<g clip-path="url(#crossoverBottom)">')
    svg.append(render_loop(-angle))
    svg.append('</g>')
    svg.append('</g>')

    svg.append('</g>') # close translate
    svg.append('</svg>')
    
    return "".join(svg)

svg_content = generate_knot_svg()
with open("circuit_infinity_knot.svg", "w") as f:
    f.write(svg_content)

print("SVG written to circuit_infinity_knot.svg successfully")

# Convert to PNG using ImageMagick
cmd = [
    "convert",
    "-background", "none",
    "-density", "300",
    "circuit_infinity_knot.svg",
    "-resize", "480x400",
    "circuit_infinity_knot.png"
]
subprocess.run(cmd, check=True)
print("PNG rendered successfully to circuit_infinity_knot.png")
