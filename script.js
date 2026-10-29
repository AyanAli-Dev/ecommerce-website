"use strict";

    const PRODUCTS = {
      headphones: {
        name: "Wireless Headphones",
        price: 4999,
        category: "audio",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80"
      },
      watch: {
        name: "Smart Watch",
        price: 7499,
        category: "wearables",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80"
      },
      backpack: {
        name: "Everyday Backpack",
        price: 3299,
        category: "lifestyle",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80"
      },
      speaker: {
        name: "Bluetooth Speaker",
        price: 2799,
        category: "audio",
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=300&q=80"
      }
    };

    const CART_KEY = "novamart_cart_v2";
    const WISHLIST_KEY = "novamart_wishlist_v2";

    let cart = loadJSON(CART_KEY, {});
    let wishlist = loadJSON(WISHLIST_KEY, []);
    let activeFilter = "all";
    let noticeTimeout;

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];

    function loadJSON(key, fallback) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
      } catch {
        return fallback;
      }
    }

    function saveCart() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch {
        showNotice("Browser storage is unavailable.");
      }
    }

    function saveWishlist() {
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      } catch {
        showNotice("Browser storage is unavailable.");
      }
    }

    function formatPrice(amount) {
      return "Rs. " + Number(amount).toLocaleString("en-PK");
    }

    function showNotice(message) {
      const notice = $("#notice");
      notice.textContent = message;
      notice.classList.add("show");
      clearTimeout(noticeTimeout);
      noticeTimeout = setTimeout(() => notice.classList.remove("show"), 2300);
    }

    function addToCart(id) {
      if (!PRODUCTS[id]) return;
      cart[id] = (Number(cart[id]) || 0) + 1;
      saveCart();
      renderCart();
      showNotice(PRODUCTS[id].name + " added to cart!");
    }

    function changeQuantity(id, amount) {
      if (!PRODUCTS[id]) return;

      cart[id] = (Number(cart[id]) || 0) + amount;

      if (cart[id] <= 0) {
        delete cart[id];
      }

      saveCart();
      renderCart();
    }

    function removeFromCart(id) {
      delete cart[id];
      saveCart();
      renderCart();
      showNotice("Item removed from cart.");
    }

    function renderCart() {
      const cartItems = $("#cartItems");
      const ids = Object.keys(cart).filter(
        id => PRODUCTS[id] && Number(cart[id]) > 0
      );

      const totalQuantity = ids.reduce((sum, id) => sum + Number(cart[id]), 0);
      const subtotal = ids.reduce(
        (sum, id) => sum + PRODUCTS[id].price * Number(cart[id]),
        0
      );

      $("#cartCount").textContent = totalQuantity;
      $("#summaryItems").textContent = totalQuantity;
      $("#subtotal").textContent = formatPrice(subtotal);

      if (!ids.length) {
        cartItems.innerHTML = `
          <div class="cart-empty">
            <div style="font-size:3rem">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add a product to get started.</p>
          </div>`;
        return;
      }

      cartItems.innerHTML = ids.map(id => {
        const product = PRODUCTS[id];
        const quantity = Number(cart[id]);

        return `
          <div class="cart-item">
            <img src="${product.image}" alt="${product.name}">
            <div>
              <h4>${product.name}</h4>
              <small>${formatPrice(product.price)}</small>
              <div class="quantity-controls">
                <button type="button" data-minus="${id}" aria-label="Decrease quantity">−</button>
                <span>${quantity}</span>
                <button type="button" data-plus="${id}" aria-label="Increase quantity">+</button>
              </div>
              <button class="remove-btn" type="button" data-remove="${id}">Remove</button>
            </div>
            <strong>${formatPrice(product.price * quantity)}</strong>
          </div>`;
      }).join("");
    }

    function toggleWishlist(id) {
      if (!PRODUCTS[id]) return;

      if (wishlist.includes(id)) {
        wishlist = wishlist.filter(item => item !== id);
        showNotice("Removed from wishlist.");
      } else {
        wishlist.push(id);
        showNotice("Added to wishlist ❤️");
      }

      saveWishlist();
      renderWishlist();
      filterProducts();
    }

    function renderWishlist() {
      $$(".heart-btn").forEach(button => {
        const id = button.dataset.heart;
        const isSaved = wishlist.includes(id);

        button.classList.toggle("favorited", isSaved);
        button.textContent = isSaved ? "♥" : "♡";
        button.setAttribute("aria-pressed", String(isSaved));
        button.setAttribute(
          "aria-label",
          (isSaved ? "Remove " : "Add ") + PRODUCTS[id].name + " " +
          (isSaved ? "from" : "to") + " wishlist"
        );
      });

      $("#wishlistCount").textContent = wishlist.length;
    }

    function filterProducts() {
      const query = $("#searchInput").value.trim().toLowerCase();
      let visibleCount = 0;

      $$(".product-card").forEach(card => {
        const id = card.dataset.id;
        const product = PRODUCTS[id];
        const matchesText =
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.description || "").toLowerCase().includes(query);

        const matchesCategory =
          activeFilter === "all" ||
          (activeFilter === "wishlist" && wishlist.includes(id)) ||
          product.category === activeFilter;

        const visible = matchesText && matchesCategory;
        card.hidden = !visible;

        if (visible) visibleCount++;
      });

      $("#resultCount").textContent =
        visibleCount + (visibleCount === 1 ? " product found." : " products found.");

      let emptyState = $("#emptyState");

      if (!visibleCount) {
        if (!emptyState) {
          emptyState = document.createElement("div");
          emptyState.id = "emptyState";
          emptyState.className = "empty-state";
          $("#productGrid").appendChild(emptyState);
        }

        emptyState.innerHTML = activeFilter === "wishlist"
          ? "<h3>Your wishlist is empty ❤️</h3><p>Tap a heart on any product to save it here.</p>"
          : "<h3>No products found</h3><p>Try another search or choose a different category.</p>";
        emptyState.hidden = false;
      } else if (emptyState) {
        emptyState.hidden = true;
      }

      $$(".filter-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === activeFilter);
      });
    }

    function openCart() {
      $("#overlay").classList.add("open");
      $("#cartDrawer").classList.add("open");
      $("#cartDrawer").setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $("#closeCart").focus();
    }

    function closeCart() {
      $("#overlay").classList.remove("open");
      $("#cartDrawer").classList.remove("open");
      $("#cartDrawer").setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    $("#productGrid").addEventListener("click", event => {
      const addButton = event.target.closest("[data-add]");
      const heartButton = event.target.closest("[data-heart]");

      if (addButton) addToCart(addButton.dataset.add);
      if (heartButton) toggleWishlist(heartButton.dataset.heart);
    });

    $("#cartItems").addEventListener("click", event => {
      const minus = event.target.closest("[data-minus]");
      const plus = event.target.closest("[data-plus]");
      const remove = event.target.closest("[data-remove]");

      if (minus) changeQuantity(minus.dataset.minus, -1);
      if (plus) changeQuantity(plus.dataset.plus, 1);
      if (remove) removeFromCart(remove.dataset.remove);
    });

    $("#searchInput").addEventListener("input", filterProducts);

    $$(".filter-btn").forEach(button => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterProducts();
      });
    });

    $("#heroWishlist").addEventListener("click", () => {
      activeFilter = "wishlist";
      filterProducts();
      $("#products").scrollIntoView({ behavior: "smooth" });
    });

    $("#openCart").addEventListener("click", openCart);
    $("#closeCart").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeCart();
    });

    $("#checkoutBtn").addEventListener("click", () => {
      if (!Object.keys(cart).some(id => PRODUCTS[id] && cart[id] > 0)) {
        showNotice("Your cart is empty!");
        return;
      }

      showNotice("Demo checkout only — no real order was placed.");
    });

    $("#newsletterForm").addEventListener("submit", event => {
      event.preventDefault();
      showNotice("Thanks! This demo form does not send emails.");
      $("#newsletterForm").reset();
    });

    $("#year").textContent = new Date().getFullYear();

    // Restore cart and wishlist when the page loads.
    renderCart();
    renderWishlist();
    filterProducts();
