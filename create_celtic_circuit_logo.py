import math
import subprocess

def create_logo():
    # 600x480 canvas for the emblem
    w, h = 600, 480
    cx, cy = 300, 240
    
    # Scale and parameters
    # The knot is slightly wider than tall, tilted
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">')
    svg.append('''<defs>
      <linearGradient id="chromeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="20%" stop-color="#d8e2ec"/>
        <stop offset="50%" stop-color="#8a99ad"/>
        <stop offset="80%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#718096"/>
      </linearGradient>

      <linearGradient id="bevelLight" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="30%" stop-color="#cbd5e1" stop-opacity="0.8"/>
        <stop offset="70%" stop-color="#475569" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
      </linearGradient>

      <linearGradient id="substrateBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e2430" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="#0f131a" stop-opacity="0.98"/>
        <stop offset="100%" stop-color="#181e28" stop-opacity="0.95"/>
      </linearGradient>

      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="outerBevelGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffffff" flood-opacity="0.45"/>
      </filter>
    </defs>''')

    # Two interlinking loops A and B:
    # Loop A tilted at -36 deg, Loop B tilted at +36 deg
    # Each loop is a rounded racetrack / stadium curve
    # Width of loop ~ 340, height ~ 180, corner radius ~ 90, stroke width ~ 64
    
    # Let's define the base loop path (centered at 0,0)
    # Loop outer width = 360, height = 180
    # rx = 90
    rw = 260
    rh = 100
    r = 65
    
    # We will draw the knot with proper crossover weaving:
    # Loop 1 (tilted -34 deg):
    # Loop 2 (tilted +34 deg):
    svg.append('<g transform="translate(300, 240)">')

    # Draw the substrate (thick dark band with border)
    # 4 segments to handle over/under weaving
    
    return svg

print("Base script initialized")
