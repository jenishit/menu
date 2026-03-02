fetch("menu.json")
  .then(response => response.json())
  .then(menuData => {

    const container = document.getElementById('menu-container');
    let catIndex = 0;

    for (const category in menuData) {
      catIndex++;
      const catDiv = document.createElement('div');
      catDiv.className = 'category';

      // Header
      const header = document.createElement('div');
      header.className = 'category-header';
      const h2 = document.createElement('h2');
      h2.innerHTML = `<span class="cat-num">0${catIndex}</span>${category}`;
      const line = document.createElement('div');
      line.className = 'cat-line';
      header.appendChild(h2);
      header.appendChild(line);
      catDiv.appendChild(header);

      const val = menuData[category];

      if (Array.isArray(val)) {
        val.forEach(item => catDiv.appendChild(createMenuItem(item)));
      } else {
        // Build 2×2 combo grid
        const grid = document.createElement('div');
        grid.className = 'combo-grid';

        const highlightKeywords = ['pizza', 'hukka', 'wings', 'sekuwa'];

        for (const sub in val) {
          val[sub].forEach(item => {
            const card = document.createElement('div');
            card.className = 'combo-card';
            if (sub === 'Jumbo Combo') card.classList.add('jumbo');

            const size = document.createElement('h3');
            size.className = 'combo-size';
            size.textContent = sub;

            const pillsWrap = document.createElement('div');
            pillsWrap.className = 'combo-items';

            const raw = item.name;
            const servesMatch = raw.match(/for\s+(\d+)/i);
            const servesText = servesMatch ? `For ${servesMatch[1]}` : null;

            const parts = raw
              .replace(/\+\s*Choice of [Dd]rink for \d+/i, '')
              .replace(/\+\s*Popcorn\/Chiura/i, '+ Popcorn / Chiura')
              .split(/\s*\+\s*/);

            parts.forEach(part => {
              part = part.trim();
              if (!part) return;
              const pill = document.createElement('span');
              pill.className = 'combo-pill';
              if (highlightKeywords.some(k => part.toLowerCase().includes(k))) {
                pill.classList.add('highlight');
              }
              pill.textContent = part;
              pillsWrap.appendChild(pill);
            });

            const footer = document.createElement('div');
            footer.className = 'combo-footer';

            const serves = document.createElement('span');
            serves.className = 'combo-serves';
            serves.textContent = servesText || '';

            const price = document.createElement('div');
            price.className = 'combo-price';
            price.innerHTML = `<span class="currency">Rs.</span>${item.price}`;

            footer.appendChild(serves);
            footer.appendChild(price);

            card.appendChild(size);
            card.appendChild(pillsWrap);
            card.appendChild(footer);
            grid.appendChild(card);
          });
        }
        catDiv.appendChild(grid);
      }

      container.appendChild(catDiv);
    }

    // Scroll-triggered reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.category').forEach(el => observer.observe(el));

  })
  .catch(error => {
    console.error("Error loading menu:", error);
  });

function createMenuItem(item) {
  const div = document.createElement('div');
  div.className = 'menu-item';

  const name = document.createElement('span');
  name.className = 'item-name';
  name.textContent = item.name;

  const dots = document.createElement('span');
  dots.className = 'item-dots';

  const price = document.createElement('span');
  price.className = 'item-price';
  price.innerHTML = `<span class="currency">Rs.</span>${item.price}`;

  div.appendChild(name);
  div.appendChild(dots);
  div.appendChild(price);
  return div;
}
