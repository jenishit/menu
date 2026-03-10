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

      // ── PIZZA: grouped by name, show Large / Medium sizes inline ──
      if (category === 'Fire Wood Pizza') {
        const sizes = Object.keys(val); // ["Large size 12 inch", "Medium size 8 inch"]

        // Build a map: pizza name → { sizeLabel: price }
        const pizzaMap = {};
        const pizzaOrder = [];
        sizes.forEach(sizeLabel => {
          val[sizeLabel].forEach(item => {
            if (!pizzaMap[item.name]) {
              pizzaMap[item.name] = {};
              pizzaOrder.push(item.name);
            }
            pizzaMap[item.name][sizeLabel] = item.price;
          });
        });

        // Short labels for the size headers
        const shortLabels = sizes.map(s => s.match(/large|medium/i)?.[0] || s);

        pizzaOrder.forEach(pizzaName => {
          const row = document.createElement('div');
          row.className = 'menu-item menu-item--multi';

          const name = document.createElement('span');
          name.className = 'item-name';
          name.textContent = pizzaName;

          const dots = document.createElement('span');
          dots.className = 'item-dots';

          // Right side: size labels on top, prices below
          const right = document.createElement('div');
          right.className = 'item-multi-right';

          const labelsRow = document.createElement('div');
          labelsRow.className = 'item-multi-labels';

          const pricesRow = document.createElement('div');
          pricesRow.className = 'item-multi-prices';

          sizes.forEach((sizeLabel, i) => {
            const lbl = document.createElement('span');
            lbl.className = 'item-size-label';
            lbl.textContent = shortLabels[i];
            labelsRow.appendChild(lbl);

            const pr = document.createElement('span');
            pr.className = 'item-price';
            pr.innerHTML = `<span class="currency">Rs.</span>${pizzaMap[pizzaName][sizeLabel] ?? '—'}`;
            pricesRow.appendChild(pr);
          });

          right.appendChild(labelsRow);
          right.appendChild(pricesRow);

          row.appendChild(name);
          row.appendChild(dots);
          row.appendChild(right);
          catDiv.appendChild(row);
        });

      // ── MOMO: grouped by base name, show varieties inline ──
      } else if (category === 'Momo') {
        const proteins = Object.keys(val); // ["Buff", "Chicken"]

        proteins.forEach(protein => {
          // Sub-heading for Buff / Chicken
          const subHead = document.createElement('div');
          subHead.className = 'momo-subheading';
          subHead.textContent = protein;
          catDiv.appendChild(subHead);

          // Build map: base flavour → { variety: price }
          // e.g. "Steam" → price,  "Fried" → price ...
          // We extract the variety word from names like "Steam Buff Momo"
          const varietyOrder = [];
          const items = val[protein];

          // Derive variety labels (strip protein name and "Momo")
          items.forEach(item => {
            const variety = item.name
              .replace(new RegExp(protein, 'i'), '')
              .replace(/momo/i, '')
              .trim();
            varietyOrder.push({ variety, price: item.price });
          });

          // For momo we have one "row" per protein showing all varieties
          const row = document.createElement('div');
          row.className = 'menu-item menu-item--multi';

          const name = document.createElement('span');
          name.className = 'item-name';
          name.textContent = protein + ' Momo';

          const dots = document.createElement('span');
          dots.className = 'item-dots';

          const right = document.createElement('div');
          right.className = 'item-multi-right';

          const labelsRow = document.createElement('div');
          labelsRow.className = 'item-multi-labels';

          const pricesRow = document.createElement('div');
          pricesRow.className = 'item-multi-prices';

          varietyOrder.forEach(({ variety, price }) => {
            const lbl = document.createElement('span');
            lbl.className = 'item-size-label';
            lbl.textContent = variety;
            labelsRow.appendChild(lbl);

            const pr = document.createElement('span');
            pr.className = 'item-price';
            pr.innerHTML = `<span class="currency">Rs.</span>${price}`;
            pricesRow.appendChild(pr);
          });

          right.appendChild(labelsRow);
          right.appendChild(pricesRow);

          row.appendChild(name);
          row.appendChild(dots);
          row.appendChild(right);
          catDiv.appendChild(row);
        });

      // ── COMBOS (existing grid logic) ──
      } else if (!Array.isArray(val)) {
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

      // ── FLAT LIST (all other categories) ──
      } else {
        val.forEach(item => catDiv.appendChild(createMenuItem(item)));
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