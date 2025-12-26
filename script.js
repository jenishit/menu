fetch("menu.json")
  .then(response => response.json())
  .then(data => {
    const menuContainer = document.getElementById("menu-container");

    for (const category in data) {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "category";

      const title = document.createElement("h2");
      title.textContent = category.toUpperCase();
      categoryDiv.appendChild(title);

      data[category].forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "menu-item";

        const name = document.createElement("span");
        name.className = "item-name";
        name.textContent = item.name;

        const price = document.createElement("span");
        price.className = "item-price";
        price.textContent = `Rs. ${item.price}`;

        itemDiv.appendChild(name);
        itemDiv.appendChild(price);
        categoryDiv.appendChild(itemDiv);
      });

      menuContainer.appendChild(categoryDiv);
    }
  })
  .catch(error => {
    console.error("Error loading menu:", error);
  });
