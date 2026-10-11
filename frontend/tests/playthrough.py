"""End-to-end test: Story Mode from title to ending via the island map, then Direct Mode,
mode separation, save migration and mobile. Run against a static server on :4173.
Usage: python3 tests/playthrough.py <screenshot_dir>"""
import sys, re, json
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[1] if len(sys.argv) > 1 else '.'
URL = 'http://localhost:4173/'
errors = []
CHOICES = ('Rent for a roof over my head', 'Check the maths first', 'Move it to my emergency reserve',
           'Hold — I am investing for years, not days', 'The Emergency Shield')

def shot(page, name): page.screenshot(path=f'{SHOTS}/{name}.png')

def dialogue(page):
    for _ in range(400):
        box = page.locator('[role="button"][aria-live="polite"]')
        if box.count() == 0: return
        if page.locator('[role="status"][aria-label^="Entering"]').count(): return  # portal cinematic started
        for c in CHOICES:
            btn = page.get_by_role('button', name=c, exact=True)
            if btn.count(): btn.first.click(); page.wait_for_timeout(250); break
        else:
            # First playthrough: lines can't be skipped, so wait for the Continue button (line finished),
            # then press it once. The 400ms advance cooldown means rapid clicks would be ignored anyway.
            cont_btn = page.get_by_test_id('dialogue-continue')
            if cont_btn.count(): cont_btn.first.click(); page.wait_for_timeout(430)
            else: page.wait_for_timeout(150)
            continue
        page.wait_for_timeout(120)
    shot(page, 'zz_stuck'); raise RuntimeError('dialogue did not finish')

def learn(page): page.get_by_role('button', name=re.compile('Got it')).click(); page.wait_for_timeout(500)
def cont(page): page.get_by_role('button', name=re.compile('^Continue')).last.click(); page.wait_for_timeout(700)
def hud(page): return page.locator('header').first.inner_text().replace('\n', ' ')
def save(page): return json.loads(page.evaluate("localStorage.getItem('pocketplay.save')"))
def enter_island(page):
    page.wait_for_timeout(600)
    page.get_by_role('button', name=re.compile('Enter island|Resume chapter')).click(); page.wait_for_timeout(1500)
def after_boss(page, name):
    dialogue(page); page.wait_for_timeout(5000)   # portal cinematic → island map
    shot(page, name); enter_island(page)

with sync_playwright() as p:
    b = p.chromium.launch()
    # Reduced motion = the accessibility path: dialogue text appears instantly (allowed even on a first
    # playthrough), which keeps this long run fast. tests/dialogue_rules.py covers the normal typing path.
    page = b.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    page.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL); page.wait_for_timeout(1500); shot(page, '01_title')
    page.get_by_role('button', name='Play', exact=True).click(); page.wait_for_timeout(900); shot(page, '02_modes')
    page.get_by_role('button', name=re.compile('Start a new story')).click(); page.wait_for_timeout(800)
    page.fill('#pname', 'Pappu'); page.get_by_role('button', name=re.compile('Step through')).click(); page.wait_for_timeout(1800)
    shot(page, '03_story_map_start')
    assert page.get_by_role('button', name=re.compile('The Banking Guild — Locked')).count(), 'island 2 must start locked'
    enter_island(page)

    # ---------- Island 1 ----------
    dialogue(page)
    for i, n in enumerate([3, 2, 1, 3, 1, 2]):
        for _ in range(n): page.get_by_role('button', name=re.compile('crate')).nth(i).click(); page.wait_for_timeout(110)
    page.wait_for_timeout(1000); cont(page)
    dialogue(page); learn(page)
    page.get_by_role('button', name='Start').click()
    for c in ['Rent', 'Grain rations', 'Tool maintenance']: page.get_by_role('button', name=f'{c} → Needs').click()
    for c in ['Glowing hover-boots', 'Tavern feast', 'Holo-trinket']: page.get_by_role('button', name=f'{c} → Wants').click()
    page.get_by_role('button', name='Lock in budget').click(); page.wait_for_timeout(400); cont(page)
    dialogue(page); learn(page)
    page.get_by_role('button', name='Buy this bundle').nth(1).click(); page.get_by_role('button', name='Confirm').click(); page.wait_for_timeout(300); cont(page)
    dialogue(page)
    page.get_by_role('button', name='Begin the month').click()
    for _ in range(200):
        if page.get_by_role('button', name='Skip', exact=True).count():
            page.wait_for_timeout(150); page.get_by_role('button', name='Skip', exact=True).click(timeout=3000); page.wait_for_timeout(700)
        if page.get_by_role('button', name=re.compile('^Continue')).count(): break
        page.wait_for_timeout(250)
    shot(page, '04_ledger_hud'); cont(page); page.wait_for_timeout(1200); print('after ledger:', hud(page)); print('choices so far:', save(page)['storyProgress']['storyChoices'])
    after_boss(page, '05_map_after_w1')

    # ---------- Island 2 ----------
    dialogue(page); learn(page)
    goals = page.locator('button[aria-pressed]')
    for gi, acc in [(0, 'Savings Account'), (1, 'Recurring Deposit'), (2, 'Fixed Deposit')]:
        goals.nth(gi).click(); page.get_by_role('button', name=re.compile(acc)).click()
    page.get_by_role('button', name='Check matches').click(); page.wait_for_timeout(300); cont(page)
    dialogue(page); learn(page)
    for safe in ['Reject & report', 'Hang up & call the bank yourself', 'Decline — ask them to pay to my UPI ID']:
        page.get_by_role('button', name=safe).click(); page.wait_for_timeout(300); cont(page)
    dialogue(page)
    page.get_by_role('button', name='Start').click()
    for ok in [False, True, False, True, False, True, False, False, True, False]:
        page.get_by_role('button', name='Approve' if ok else 'Reject', exact=True).click(); page.wait_for_timeout(180)
        page.get_by_role('button', name='Next').click(); page.wait_for_timeout(220)
    cont(page)
    page.reload(); page.wait_for_timeout(1500)                      # persistence mid-story
    page.get_by_role('button', name='Continue story').click(); page.wait_for_timeout(1200); enter_island(page)
    dialogue(page)  # bounty choice → reserve
    print('after w2 choice:', hud(page))
    page.wait_for_timeout(5000); shot(page, '06_map_after_w2'); enter_island(page)

    # ---------- Island 3 ----------
    dialogue(page); learn(page)
    page.get_by_role('button', name='Take the regulated loan').click(); cont(page)
    dialogue(page); learn(page)
    for _ in range(6):
        if page.get_by_role('button', name='Decline').count(): page.get_by_role('button', name='Decline').click()
        page.get_by_role('button', name=re.compile('Pay EMI on time')).click(); page.wait_for_timeout(220)
    cont(page); print('after emi:', hud(page))
    after_boss(page, '07_map_after_w3')

    # ---------- Island 4 ----------
    dialogue(page); learn(page)
    for _ in range(2): page.get_by_role('button', name='Open dossier').first.click()
    for _ in range(4): page.get_by_role('button', name=re.compile('^Compute')).first.click(); page.wait_for_timeout(100)
    page.get_by_role('button', name='Pick as fair-value candidate').nth(1).click(); cont(page)
    dialogue(page); learn(page)
    for y in range(1, 6):
        page.get_by_role('button', name=f'Advance to Year {y}').click(); page.wait_for_timeout(260)
        if y == 3: page.get_by_role('button', name='Stay invested', exact=True).click()
    cont(page); print('after market:', hud(page))
    after_boss(page, '08_map_after_w4')

    # ---------- Island 5 ----------
    dialogue(page); learn(page)
    for qi, a in enumerate(['8 years', '0%', '12 years']): page.locator('fieldset').nth(qi).get_by_role('button', name=a, exact=True).click()
    cont(page); learn(page); dialogue(page)
    safe = {1: 'Decline', 2: 'Ignore & report', 4: 'Skip it', 6: 'Stay invested', 7: 'Block & report', 9: 'Move idle cash to diversified', 10: 'Protect the goal'}
    for y in range(1, 11):
        if y in safe: page.get_by_role('button', name=safe[y], exact=True).click()
        page.get_by_role('button', name=f'Live Year {y}').click(); page.wait_for_timeout(220)
    page.get_by_role('button', name='See my scorecard').click(); page.wait_for_timeout(6000)
    shot(page, '09_ending')
    print('ending reached:', page.get_by_text('The real adventure begins now').count() > 0)
    print('playthroughs after ending:', save(page)['profile'])
    story_before = save(page)['storyProgress']

    # ---------- Direct Mode: independent, sandboxed ----------
    page.get_by_role('button', name='Main menu').click(); page.wait_for_timeout(900)
    page.get_by_role('button', name='Open topic library').click(); page.wait_for_timeout(900); shot(page, '10_direct_library')
    page.fill('#direct-search', 'UPI'); page.wait_for_timeout(300)
    print('search UPI →', page.locator('article h3').all_inner_texts())
    page.get_by_role('button', name=re.compile('^(Start|Replay)')).first.click(); page.wait_for_timeout(700); shot(page, '11_direct_intro')
    page.get_by_role('button', name='Explore the idea').click(); page.wait_for_timeout(400)
    page.get_by_role('button', name='Start practice').click(); page.wait_for_timeout(700)
    page.get_by_role('button', name='Enter UPI PIN to receive').click(); page.wait_for_timeout(300)  # a mistake on purpose
    page.get_by_role('button', name='Try again').click(); page.wait_for_timeout(300)
    for s in ['Reject & report', 'Hang up & call the bank yourself', 'Decline — ask them to pay to my UPI ID']:
        page.get_by_role('button', name=s).click(); page.wait_for_timeout(300); cont(page)
    page.wait_for_timeout(500); shot(page, '12_direct_results')
    print('direct results text:', page.locator('main').inner_text()[:200].replace('\n', ' | '))
    # Sorter in Direct: sandbox starts at ₹15,000 even though the story wallet differs
    page.get_by_role('button', name='Choose another topic').click(); page.wait_for_timeout(500)
    page.fill('#direct-search', ''); page.get_by_role('button', name='Money Management').click()
    page.locator('article', has_text='Survival Sorter').get_by_role('button').click(); page.wait_for_timeout(500)
    page.get_by_role('button', name='Skip to practice').click(); page.wait_for_timeout(600)
    print('practice bar:', page.locator('text=Practice wallet').locator('..').inner_text().replace('\n', ' '))
    page.get_by_role('button', name='Start').click()
    for c in ['Rent', 'Grain rations', 'Tool maintenance']: page.get_by_role('button', name=f'{c} → Needs').click()
    for c in ['Glowing hover-boots', 'Tavern feast', 'Holo-trinket']: page.get_by_role('button', name=f'{c} → Wants').click()
    page.get_by_role('button', name='Lock in budget').click(); page.wait_for_timeout(400); cont(page)
    # new Direct-only activity: EMI Calculator
    page.get_by_role('button', name=re.compile('^Next: ')).click(); page.wait_for_timeout(500)  # related topic → Bargain Matrix
    page.get_by_role('button', name='Exit to library').first.click(); page.wait_for_timeout(400)
    page.get_by_role('button', name='All', exact=True).click()
    page.locator('article', has_text='EMI Calculator').get_by_role('button').click(); page.wait_for_timeout(400)
    page.get_by_role('button', name='Skip to practice').click(); page.wait_for_timeout(500)
    page.get_by_role('button', name='36 months').click(); page.get_by_role('button', name='EMI falls, total interest rises').click(); page.wait_for_timeout(300)
    shot(page, '13_emicalc'); cont(page); page.wait_for_timeout(400)
    page.get_by_role('button', name='Return to library').click(); page.wait_for_timeout(500)
    page.get_by_role('tab', name=re.compile('Island view')).click(); page.wait_for_timeout(900)
    page.get_by_role('button', name=re.compile('The Citadel of Debt')).click(); page.wait_for_timeout(900); shot(page, '14_direct_islands')
    sv = save(page)
    story_after = sv['storyProgress']
    print('direct topics:', {k: (v['bestScore'], v['attempts'], v['completed']) for k, v in sv['directModeProgress']['topics'].items()})
    print('story untouched by Direct Mode:', story_before == story_after)

    # ---------- Fresh player: Direct Mode first, no story needed ----------
    fresh = b.new_page(viewport={'width': 1366, 'height': 800})
    fresh.on('pageerror', lambda e: errors.append(str(e)))
    fresh.goto(URL); fresh.evaluate('localStorage.clear()'); fresh.reload(); fresh.wait_for_timeout(1200)
    fresh.get_by_role('button', name='Play', exact=True).click(); fresh.wait_for_timeout(700)
    fresh.get_by_role('button', name='Open topic library').click(); fresh.wait_for_timeout(600)
    fresh.locator('article', has_text='Guild Fraud Gauntlet').get_by_role('button').click(); fresh.wait_for_timeout(400)
    fresh.get_by_role('button', name='Skip to practice').click(); fresh.wait_for_timeout(500)
    print('fresh player can open Gauntlet immediately:', fresh.get_by_role('button', name='Start').count() == 1)
    fsv = json.loads(fresh.evaluate("localStorage.getItem('pocketplay.save')") or '{}')
    print('fresh player has no story created:', fsv.get('storyProgress') is None)

    # ---------- v1 save migration ----------
    mig = b.new_page()
    v1 = {"saveVersion": 1, "playerName": "Asha", "wallet": 4000, "reserve": 500, "cibilScore": 650, "activeWorld": 2, "unlockedNodes": [1, 2], "language": "en", "sceneIndex": 3,
          "completedChallenges": ["crate", "sorter", "bargain", "ledger"], "masteryPoints": 375, "mastery": {"budgeting": 375}, "transactions": [], "portfolio": {"etf": 0, "stock": 0, "gold": 0, "cash": 0},
          "loans": [], "audio": {"music": True, "sfx": True, "volume": 0.6}, "scorecard": None, "phase": "playing"}
    mig.goto(URL); mig.evaluate(f"localStorage.clear(); localStorage.setItem('pocketplay.save', {json.dumps(json.dumps(v1))})"); mig.reload(); mig.wait_for_timeout(1200)
    mig.get_by_role('button', name='Play', exact=True).click(); mig.wait_for_timeout(600)
    print('v1 save shown in modes:', mig.get_by_text(re.compile('Asha · Chapter 2')).count() > 0)
    mig.get_by_role('button', name='Resume story').click(); mig.wait_for_timeout(1200)
    m2 = json.loads(mig.evaluate("localStorage.getItem('pocketplay.save')"))
    print('migrated to v2:', m2['saveVersion'], m2['storyProgress']['playerName'], m2['storyProgress']['wallet'], '| backup kept:', mig.evaluate("!!localStorage.getItem('pocketplay.save.v1-backup')"))
    mig.screenshot(path=f'{SHOTS}/15_migrated_map.png')

    # ---------- mobile ----------
    m = b.new_page(viewport={'width': 390, 'height': 844}); m.goto(URL); m.evaluate('localStorage.clear()'); m.reload(); m.wait_for_timeout(1200)
    m.screenshot(path=f'{SHOTS}/16_m_title.png')
    m.get_by_role('button', name='Play', exact=True).click(); m.wait_for_timeout(800); m.screenshot(path=f'{SHOTS}/17_m_modes.png')
    m.get_by_role('button', name='Open topic library').click(); m.wait_for_timeout(700); m.screenshot(path=f'{SHOTS}/18_m_library.png')
    m.get_by_role('tab', name=re.compile('Island view')).click(); m.wait_for_timeout(800)
    m.get_by_role('button', name=re.compile('The Grand Exchange')).click(); m.wait_for_timeout(800); m.screenshot(path=f'{SHOTS}/19_m_islands.png')
    b.close()
print('CONSOLE ERRORS:', [e for e in errors if 'fonts.g' not in e and 'TUNNEL' not in e][:10])
