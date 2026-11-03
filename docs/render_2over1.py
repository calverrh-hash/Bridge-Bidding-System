# Renders 2over1.html (from build_2over1_chart.py) to 2over1_Flowchart_A3.pdf and prints each panel's spare room.
from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1588, 'height': 1123})
    pg.goto('file://' + os.path.abspath('2over1.html')); pg.wait_for_timeout(400)
    print(pg.evaluate("""()=>[...document.querySelectorAll('.panel')].map(p=>{const pb=p.querySelector('.pb');let need=0;for(const c of pb.children){need=Math.max(need,c.getBoundingClientRect().bottom)};return [p.querySelector('.ph').innerText.slice(0,30),Math.round(p.getBoundingClientRect().bottom-need)]})"""))
    pg.screenshot(path='2over1.png')
    pg.pdf(path='2over1_Flowchart_A3.pdf', width='420mm', height='297mm', print_background=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
    b.close()
