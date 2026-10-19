import math

def generate_svg():
    width = 600
    height = 600
    
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    svg.append('''<defs>
      <!-- Metallic Silver Gradients -->
      <linearGradient id="silverBevel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="25%" stop-color="#c8d1dc" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="#7a889b" stop-opacity="0.85"/>
        <stop offset="75%" stop-color="#e2e8f0" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.85"/>
      </linearGradient>

      <linearGradient id="outerBevelGlow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f8fafc" stop-opacity="1"/>
        <stop offset="40%" stop-color="#94a3b8" stop-opacity="0.9"/>
        <stop offset="70%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="100%" stop-color="#64748b" stop-opacity="0.8"/>
      </linearGradient>

      <linearGradient id="bandBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2a303c" stop-opacity="0.88"/>
        <stop offset="50%" stop-color="#141820" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#242b35" stop-opacity="0.88"/>
      </linearGradient>

      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="heavyGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>''')
    
    return svg

print("Script template ready")
