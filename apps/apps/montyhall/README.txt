100 DOOR CHALLENGE - QUARTO VERSION
===================================

FIXED VERSION: The game markup is now explicitly marked as raw HTML so Quarto renders the game instead of printing the HTML tags.

Files:
  monty-hall.qmd          Quarto page
  monty-hall.css          Game styling
  monty-hall.js           Game logic
  monty-hall-script.html  Loads the JavaScript after the page body

INSTALL
1. Copy all four monty-hall files into the SAME folder in your Quarto website.
2. Replace the previous versions if prompted.
3. Run `quarto preview` from the root of your website project.
4. Open the monty-hall page.

If your Quarto page is in a subfolder such as apps/apps/montyhall/, keep the CSS, JS, and script HTML files in that same subfolder unless you change their paths in the QMD.

No Shiny server, iframe, or R runtime is required. The game runs entirely in the browser.


MEDIA FILES
The included images/ folder must stay beside monty-hall.qmd, monty-hall.js, and monty-hall.css.
The Purdue/IU theme uses images/purduegoat.mp4 and images/purduesheep.mp4 behind losing doors and images/IUwinner.jpg behind the winning door.

PERSISTENT SCORE
Scores for 3-door and 50-door modes are stored in the browser's localStorage. They survive refreshes, closing/reopening the browser, and restarting the device. They are local to that browser/device, not shared globally among website visitors.
