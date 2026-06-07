import os
import re

files_to_update = [
    ("Breakout Ball Game/Breakout.html", "../index.html"),
    ("Catch/Index.html", "../index.html"),
    ("Crazy/Crazy copy.html", "../index.html"),
    ("Crazy/Crazy.html", "../index.html"),
    ("Game/index.html", "../index.html"),
    ("joke.html", "index.html"),
    ("Neon runner/neon.html", "../index.html"),
    ("P5/AI GAME/AI.html", "../../index.html"),
    ("P5/Caterpiller/Caterpiller.html", "../../index.html"),
    ("P5/Circles/index.html", "../../index.html"),
    ("P5/Flower/index.html", "../../index.html"),
    ("P5/sunset/Sun.html", "../../index.html"),
    ("sand-sandbox/index.html", "../index.html"),
    ("Tanks/element_tank.html", "../index.html"),
    ("Tanks/tankwars.html", "../index.html"),
    ("test.html", "index.html"),
    ("tests/clickspeed.html", "../index.html"),
    ("tests/cpstest.html", "../index.html"),
    ("tests/memorytest.html", "../index.html"),
    ("tests/tests.html", "../index.html"),
    ("tests/typingtest.html", "../index.html"),
    ("towerdefense/nexus_defense.html", "../index.html"),
    ("towerdefense/towerdefense.html", "../index.html"),
]

standard_css = """
.global-hub-btn {
    position: fixed;
    bottom: 25px;
    right: 25px;
    background: linear-gradient(135deg, #00f2ff 0%, #0077ff 100%);
    color: white !important;
    text-decoration: none !important;
    padding: 14px 28px;
    border-radius: 50px;
    font-family: 'Poppins', 'Segoe UI', sans-serif;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 1.5px;
    box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
    z-index: 1000000;
    border: 2px solid rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    gap: 10px;
    text-transform: uppercase;
    cursor: pointer;
}
.global-hub-btn:hover {
    transform: scale(1.1) translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 242, 255, 0.6);
    background: linear-gradient(135deg, #0077ff 0%, #00f2ff 100%);
    border-color: #fff;
}"""

def update_file(file_path, rel_path):
    full_path = os.path.join(os.getcwd(), file_path)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        return

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update/Add CSS
    # Remove existing global-hub-btn styles (including hover and before)
    css_pattern = re.compile(r'\.global-hub-btn\s*\{.*?\}', re.DOTALL)
    hover_pattern = re.compile(r'\.global-hub-btn:hover\s*\{.*?\}', re.DOTALL)
    before_pattern = re.compile(r'\.global-hub-btn::before\s*\{.*?\}', re.DOTALL)
    
    new_content = before_pattern.sub('', content)
    new_content = hover_pattern.sub('', new_content)
    new_content = css_pattern.sub('', new_content)

    # Check if there's a style tag to put the new CSS in
    if '<style>' in new_content:
        # Insert at the beginning of the first style tag
        new_content = new_content.replace('<style>', f'<style>{standard_css}', 1)
    else:
        # Create a style tag in head
        if '</head>' in new_content:
            new_content = new_content.replace('</head>', f'<style>{standard_css}\n</style>\n</head>', 1)
        else:
            # Just prepend if no head
            new_content = f'<style>{standard_css}\n</style>\n' + new_content

    # 2. Update/Add HTML
    standard_html = f'<a href="{rel_path}" class="global-hub-btn">Back to Hub</a>'
    
    html_pattern = re.compile(r'<a\s+href="[^"]*"\s+class="global-hub-btn">.*?</a>', re.DOTALL)
    
    if html_pattern.search(new_content):
        new_content = html_pattern.sub(standard_html, new_content)
    else:
        # Append before </body>
        if '</body>' in new_content:
            new_content = new_content.replace('</body>', f'\n{standard_html}\n</body>', 1)
        else:
            new_content += f'\n{standard_html}'

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {file_path}")

for file_path, rel_path in files_to_update:
    update_file(file_path, rel_path)
