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

      if (Array.isArray(data[category])){
        data[category].forEach(item => {
          categoryDiv.appendChild(createMenuItem(item));
        });
      }
      else {
        const subCategories = data[category];

        for (const sub in subCategories) {
          const subTitle = document.createElement("h3");
          subTitle.className = "subcategory";
          subTitle.textContent = sub.toUpperCase();
          categoryDiv.appendChild(subTitle);

          subCategories[sub].forEach(item => {
            categoryDiv.appendChild(createMenuItem(item));
          });
        }
      }

      menuContainer.appendChild(categoryDiv);
    }
  })
  .catch(error => {
    console.error("Error loading menu:", error);
  });

function createMenuItem(item){
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
        return itemDiv;
}