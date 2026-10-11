"""Spot checks: mobile layout, Telugu/Hindi switching, corrupt save handling."""
import sys, json, re
from playwright.sync_api import sync_playwright
S = sys.argv[1]
save = {"playerName": "Pappu", "wallet": 21536, "reserve": 500, "cibilScore": 650, "activeWorld": 3, "sceneIndex": 5, "language": "te",
        "loans": [{"id": "equipment", "lender": "x", "principal": 14000, "annualRate": 0.12, "months": 12, "emi": 1244, "remaining": 14000}]}
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [('m', {'width': 390, 'height': 844}), ('d', {'width': 1366, 'height': 768})]:
        pg = b.new_page(viewport=vp); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:4173/'); pg.evaluate(f"localStorage.setItem('pocketplay.save', {json.dumps(json.dumps(save))})"); pg.reload(); pg.wait_for_timeout(1200)
        pg.screenshot(path=f'{S}/s_{name}_title_te.png')
        pg.locator('nav button').first.click(); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{S}/s_{name}_emi_te.png')
        pg.get_by_role('radio', name='हिंदी').first.click() if pg.get_by_role('radio', name='हिंदी').count() else None
        pg.wait_for_timeout(500); pg.screenshot(path=f'{S}/s_{name}_emi_hi.png')
    # corrupt save must not crash
    pg = b.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:4173/'); pg.evaluate("localStorage.setItem('pocketplay.save', '{not json')"); pg.reload(); pg.wait_for_timeout(1000)
    print('corrupt save → title shown:', pg.get_by_role('button', name='Play', exact=True).count() > 0)
    # mobile dialogue
    pg = b.new_page(viewport={'width': 390, 'height': 844}); pg.goto('http://localhost:4173/'); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(800)
    pg.get_by_role('button', name='Play', exact=True).click(); pg.wait_for_timeout(700)
    pg.get_by_role('button', name=re.compile('Start a new story')).click(); pg.wait_for_timeout(600)
    pg.fill('#pname', 'Asha'); pg.keyboard.press('Enter'); pg.wait_for_timeout(1800)
    pg.get_by_role('button', name=re.compile('Enter island')).click(); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{S}/s_m_dialogue.png')
    b.close()
print('page errors:', errs)
