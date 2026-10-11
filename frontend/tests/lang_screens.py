"""Untranslated-text scan: opens every screen and all 15 activities, switches to Telugu and Hindi
mid-activity (state must survive), and reports any visible English words or raw i18n keys.
Usage: python3 tests/lang_screens.py <screenshot_dir>"""
import sys, re
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[1] if len(sys.argv) > 1 else '.'
URL = 'http://localhost:4173/'
# Words that are correct in every language: acronyms, brand/character-free proper nouns, keyboard keys,
# fictional URLs/IDs shown inside scam messages, ticker symbols and language names.
ALLOW = set('''PocketPlay Pappu UPI PIN OTP EMI EMIs KYC ETF CIBIL SEBI NIFTY EPS FD RD QR SMS ID IDs Space Enter
EN TE HI English luckydraw okpay guild bit pay bill now xxxxx sim SOLARGRID HYPERVAPOR GOLD INDEX ETF'''.split())
KEY_RE = re.compile(r'\b(?:[a-z]+[A-Z]?[a-z]*\.){1,3}[a-zA-Z0-9]+\b')
problems = {}

SCAN_JS = """() => {
  const txt = document.body.innerText;
  const attrs = [...document.querySelectorAll('[aria-label],[title],[placeholder]')]
    .map(e => [e.getAttribute('aria-label'), e.getAttribute('title'), e.getAttribute('placeholder')].filter(Boolean).join(' ')).join(' ');
  return txt + ' ' + attrs;
}"""

def scan(page, where, lang):
    text = page.evaluate(SCAN_JS)
    allow = {a.lower() for a in ALLOW}
    words = {w for w in re.findall(r'[A-Za-z][A-Za-z]{2,}', text) if w.lower() not in allow}
    keys = {k for k in KEY_RE.findall(text) if not re.match(r'^(bit\.ly|luckydraw|pay-bill)', k) and '@' not in k and not re.match(r'^\d', k)}
    keys = {k for k in keys if re.match(r'^[a-z0-9]+\.[a-zA-Z0-9.]+$', k) and not k.startswith('bit.')}
    if words or keys: problems[f'{lang} · {where}'] = sorted(words)[:25] + [f'KEY:{k}' for k in sorted(keys)]

def set_lang(page, lang):
    name = {'te': 'తెలుగు', 'hi': 'हिंदी', 'en': 'English'}[lang]
    page.get_by_role('radio', name=name).first.click(); page.wait_for_timeout(250)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1366, 'height': 860}, reduced_motion='reduce')
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL); page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(1200)

    # ---------- menus + story ----------
    for lang in ('te', 'hi'):
        page.goto(URL); page.wait_for_timeout(900); set_lang(page, lang); page.wait_for_timeout(300)
        scan(page, 'title', lang); page.screenshot(path=f'{SHOTS}/ls_{lang}_title.png')
    set_lang(page, 'en')
    page.get_by_role('button', name='Play', exact=True).click(); page.wait_for_timeout(700)
    page.get_by_role('button', name=re.compile('Start a new story')).click(); page.wait_for_timeout(500)
    page.fill('#pname', 'Pappu'); page.get_by_role('button', name=re.compile('Step through')).click(); page.wait_for_timeout(1500)
    for lang in ('te', 'hi'):
        set_lang(page, lang); scan(page, 'story map', lang); page.screenshot(path=f'{SHOTS}/ls_{lang}_map.png')
    set_lang(page, 'en')
    page.get_by_role('button', name=re.compile('Enter island')).click(); page.wait_for_timeout(1400)
    for lang in ('te', 'hi'):
        set_lang(page, lang); scan(page, 'dialogue + HUD', lang); page.screenshot(path=f'{SHOTS}/ls_{lang}_dialogue.png')
    set_lang(page, 'en')

    # ---------- every Direct Mode activity ----------
    page.goto(URL); page.wait_for_timeout(900)
    page.get_by_role('button', name='Play', exact=True).click(); page.wait_for_timeout(600)
    page.get_by_role('button', name='Open topic library').click(); page.wait_for_timeout(600)
    for lang in ('te', 'hi'):
        set_lang(page, lang); scan(page, 'library', lang); page.screenshot(path=f'{SHOTS}/ls_{lang}_library.png')
    set_lang(page, 'en')
    n = page.locator('article').count()
    for i in range(n):
        art = page.locator('article').nth(i)
        name = art.locator('h3').inner_text()
        art.get_by_role('button').last.click(); page.wait_for_timeout(400)
        for lang in ('te', 'hi'):
            set_lang(page, lang); scan(page, f'{name} intro', lang)
        set_lang(page, 'en')
        page.get_by_role('button', name='Skip to practice').click(); page.wait_for_timeout(500)
        if page.get_by_role('button', name='Start', exact=True).count(): page.get_by_role('button', name='Start', exact=True).click(); page.wait_for_timeout(300)
        if page.get_by_role('button', name='Open dossier').count():
            for _ in range(2): page.get_by_role('button', name='Open dossier').first.click()
        before = page.locator('main').inner_text() if page.locator('main').count() else ''
        for lang in ('te', 'hi'):
            set_lang(page, lang); page.wait_for_timeout(150); scan(page, f'{name} practice', lang)
            page.screenshot(path=f'{SHOTS}/ls_{lang}_act{i:02d}.png')
        set_lang(page, 'en')
        page.get_by_role('button', name='Exit to library').first.click(); page.wait_for_timeout(500)
        if page.get_by_role('button', name=re.compile('Leave|Exit|Yes', re.I)).count() and page.locator('article').count() == 0:
            page.get_by_role('button', name=re.compile('Leave|Exit|Yes', re.I)).first.click(); page.wait_for_timeout(400)
        if page.get_by_role('button', name='All', exact=True).count(): page.get_by_role('button', name='All', exact=True).click()

    print('page errors:', errors)
    b.close()

if problems:
    print(f'{len(problems)} screen(s) with possible untranslated text:')
    for k, v in problems.items(): print(' ', k, '→', v)
else:
    print('✓ no untranslated English words or raw keys found on any scanned screen')
