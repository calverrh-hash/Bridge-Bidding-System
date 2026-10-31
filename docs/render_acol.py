from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1588,'height':1123})
    pg.goto('file://'+os.path.abspath('acol.html'));pg.wait_for_timeout(500)
    print(pg.evaluate("""()=>[...document.querySelectorAll('.panel')].map(p=>{const pb=p.querySelector('.pb');const h=p.querySelector('.ph').innerText;let need=0;for(const c of pb.querySelectorAll('*')){need=Math.max(need,c.getBoundingClientRect().bottom)};return [h.slice(0,24),Math.round(p.getBoundingClientRect().bottom-need)]})"""))
    pg.screenshot(path='acol.png',full_page=True)
    pg.pdf(path='acol.pdf',width='420mm',height='297mm',print_background=True,margin={'top':'0','right':'0','bottom':'0','left':'0'})
    b.close()
