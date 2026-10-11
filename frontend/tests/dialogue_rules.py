"""Dialogue-skip rules and live language switching (normal motion, real typewriter).
Run against a static server on :4173.   Usage: python3 tests/dialogue_rules.py <screenshot_dir>"""
import sys, re, json
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[1] if len(sys.argv) > 1 else '.'
URL = 'http://localhost:4173/'
results = []
def check(name, ok, extra=''):
    results.append(ok); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{extra}]' if extra else ''))

def line_id(page): return page.locator('[data-dialogue-line]').first.get_attribute('data-dialogue-line')
def line_text(page): return page.locator('[data-dialogue-line] p').first.inner_text()
def save(page): return json.loads(page.evaluate("localStorage.getItem('pocketplay.save')"))
def continue_btn(page): return page.get_by_test_id('dialogue-continue')

def start_story(page):
    page.goto(URL); page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(1200)
    page.get_by_role('button', name='Play', exact=True).click(); page.wait_for_timeout(700)
    page.get_by_role('button', name=re.compile('Start a new story')).click(); page.wait_for_timeout(600)
    page.fill('#pname', 'Pappu'); page.get_by_role('button', name=re.compile('Step through')).click(); page.wait_for_timeout(1600)
    page.get_by_role('button', name=re.compile('Enter island')).click(); page.wait_for_timeout(1500)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1280, 'height': 820})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))

    # ---------- First playthrough: no skipping ----------
    start_story(page)
    first = line_id(page)
    skip = page.get_by_test_id('dialogue-skip')
    check('first run: Skip button is disabled', skip.is_disabled())
    check('first run: Skip explains why', 'finish the story once' in (skip.get_attribute('aria-label') or ''))
    check('first run: no Fast-forward button', page.get_by_role('button', name='Fast-forward').count() == 0)
    page.locator('[data-dialogue-line]').first.click(); page.wait_for_timeout(60)          # click while typing
    check('first run: clicking does not finish the typing', continue_btn(page).count() == 0 and line_id(page) == first)
    page.keyboard.press('Space'); page.keyboard.press('Enter'); page.wait_for_timeout(60)
    check('first run: Space/Enter do not skip the typing', continue_btn(page).count() == 0 and line_id(page) == first)
    page.wait_for_selector('[data-testid="dialogue-continue"]', timeout=15000)
    check('line finished on its own → Continue appears', continue_btn(page).count() == 1)
    box = page.locator('[data-dialogue-line]').first
    for _ in range(6): box.click(delay=0)                                                  # rapid clicks
    page.wait_for_timeout(100)
    second = line_id(page)
    check('rapid clicks advance exactly one line', second == 'a2', f'{first} → {second}')
    page.screenshot(path=f'{SHOTS}/dr_01_first_run.png')

    # Language switch mid-line keeps the same line, shown in full in the new language
    page.wait_for_timeout(200)
    page.get_by_role('radio', name='తెలుగు').first.click(); page.wait_for_timeout(300)
    te_text = line_text(page)
    check('language switch keeps the dialogue position', line_id(page) == second)
    check('dialogue text is now Telugu', bool(re.search('[ఀ-౿]', te_text)), te_text[:40])
    check('Telugu Continue button', page.get_by_role('button', name='కొనసాగించు').count() >= 1)
    page.screenshot(path=f'{SHOTS}/dr_02_telugu_line.png')
    page.get_by_role('radio', name='हिंदी').first.click(); page.wait_for_timeout(300)
    check('switch to Hindi keeps the line', line_id(page) == second and bool(re.search('[ऀ-ॿ]', line_text(page))))
    page.get_by_role('radio', name='English').first.click(); page.wait_for_timeout(300)

    # Refresh: still a first playthrough
    page.reload(); page.wait_for_timeout(1200)
    sv = save(page)
    check('refresh keeps storyPlaythroughsCompleted = 0', sv['profile']['storyPlaythroughsCompleted'] == 0)
    check('language preference persisted', sv['settings']['language'] == 'en')

    # ---------- After one full completion ----------
    sv['profile'] = {'storyPlaythroughsCompleted': 1, 'seenDialogue': ['w1_arrival', 'w1_needs']}
    page.evaluate(f"localStorage.setItem('pocketplay.save', {json.dumps(json.dumps(sv))})"); page.reload(); page.wait_for_timeout(1200)
    page.get_by_role('button', name='Play', exact=True).click(); page.wait_for_timeout(600)
    page.get_by_role('button', name=re.compile('Resume story')).click(); page.wait_for_timeout(1000)
    page.get_by_role('button', name=re.compile('Enter island|Resume chapter')).click(); page.wait_for_timeout(1400)
    skip = page.get_by_test_id('dialogue-skip')
    check('after completion: Skip enabled for a seen conversation', skip.is_enabled())
    check('after completion: Fast-forward available', page.get_by_role('button', name='Fast-forward').count() == 1)
    page.wait_for_timeout(200)
    page.locator('[data-dialogue-line]').first.click(); page.wait_for_timeout(80)
    check('after completion: click finishes typing instantly', continue_btn(page).count() == 1)
    page.screenshot(path=f'{SHOTS}/dr_03_replay.png')
    skip.click(); page.wait_for_timeout(900)
    check('after completion: Skip ends the conversation', page.locator('[data-dialogue-line]').count() == 0)

    # New story run keeps the profile (counter is never reset by starting over)
    page.goto(URL); page.wait_for_timeout(1000)
    page.get_by_role('button', name='Play', exact=True).click(); page.wait_for_timeout(600)
    page.get_by_role('button', name=re.compile('Start a new story')).click(); page.wait_for_timeout(500)
    if page.get_by_role('button', name=re.compile('Yes|Start over|confirm', re.I)).count():
        page.get_by_role('button', name=re.compile('Yes|Start over|confirm', re.I)).first.click(); page.wait_for_timeout(500)
    page.fill('#pname', 'Pappu'); page.get_by_role('button', name=re.compile('Step through')).click(); page.wait_for_timeout(1400)
    check('new run keeps storyPlaythroughsCompleted', save(page)['profile']['storyPlaythroughsCompleted'] == 1)

    # ---------- Direct Mode is never restricted ----------
    d = b.new_page(viewport={'width': 1280, 'height': 820})
    d.goto(URL); d.evaluate('localStorage.clear()'); d.reload(); d.wait_for_timeout(1000)
    d.get_by_role('button', name='Play', exact=True).click(); d.wait_for_timeout(600)
    d.get_by_role('button', name='Open topic library').click(); d.wait_for_timeout(500)
    d.locator('article', has_text='Rule of 72').get_by_role('button').click(); d.wait_for_timeout(400)
    d.get_by_role('button', name='Skip to practice').click(); d.wait_for_timeout(400)
    check('Direct Mode: intro skippable on a brand-new profile', d.get_by_role('heading', name='Rule of 72').count() >= 1)

    print('page errors:', errors)
    b.close()
print(f'\n{sum(results)}/{len(results)} checks passed')
sys.exit(0 if all(results) else 1)
