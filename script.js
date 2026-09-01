// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://hyhojdqxxzdinpilqfzv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KxmdNWPdIkaGo3drMPFhlw_gFA77s0Y";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let cart = [];


// =====================================================
// DELIVERY RATES
// =====================================================

const SHIPPING_INSIDE_DHAKA = 70;
const SHIPPING_OUTSIDE_DHAKA = 130;


// =====================================================
// BUY X GET Y FREE RULES
// =====================================================
// Keyed by the product's data-name. "every" = how many PAID
// units trigger a free unit, "free" = how many free units
// that unlocks. Repeats automatically (6 paid -> 2 free, etc).

const FREE_ITEM_RULES = {
  "Mystery Bag": { every: 3, free: 1 }
};


// =====================================================
// FORMSPREE
// =====================================================

const FORMSPREE_URL =
  "https://formspree.io/f/xaewnaqd";


// =====================================================
// GRAB ELEMENTS
// =====================================================

const cartIcon =
  document.getElementById("cart-icon");

const cartPanel =
  document.getElementById("cart-panel");

const closeCartBtn =
  document.getElementById("close-cart");

const cartItemsContainer =
  document.getElementById("cart-items");

const cartCountEl =
  document.getElementById("cart-count");

const cartTotalEl =
  document.getElementById("cart-total");

const deliveryNoteEl =
  document.getElementById("delivery-note");

const buyNowBtn =
  document.getElementById("buy-now-btn");

const checkoutModal =
  document.getElementById("checkout-modal");

const closeCheckoutBtn =
  document.getElementById("close-checkout");

const checkoutForm =
  document.getElementById("checkout-form");


// =====================================================
// PRODUCT MODAL ELEMENTS
// =====================================================

const productModal =
  document.getElementById("product-modal");

const closeProductModalBtn =
  document.getElementById("close-product-modal");

const modalImg =
  document.getElementById("modal-product-img");

const modalTitle =
  document.getElementById("modal-product-title");

const modalPrice =
  document.getElementById("modal-product-price");

const modalDescription =
  document.getElementById(
    "modal-product-description"
  );

const modalTypeContainer =
  document.getElementById(
    "modal-type-container"
  );

const modalTypeSelect =
  document.getElementById(
    "modal-product-type"
  );

const modalAddToCartBtn =
  document.getElementById(
    "modal-add-to-cart-btn"
  );

let currentSelectedProduct = null;


// =====================================================
// SOLD OUT HELPERS
// =====================================================

// Remembers the original text of a title/option so we can
// safely add/remove "(Sold Out)" without stacking duplicates.
function getBaseText(el) {
  if (!el.dataset.baseText) {
    el.dataset.baseText = el.textContent.trim();
  }
  return el.dataset.baseText;
}

// Recomputes and applies the sold-out UI state for a single
// product card, based on whatever stock numbers currently live
// in its dataset (own data-stock, or its variant options).
function refreshProductCardState(productEl) {

  if (!productEl) return;

  const select =
    productEl.querySelector(".product-type");

  let soldOut = false;

  if (select) {

    // Real variant options (skip the "-- Select Type --" placeholder)
    const options =
      Array.from(select.options).filter(
        (opt) => opt.value !== ""
      );

    options.forEach((opt) => {

      const optStock =
        Number(opt.dataset.stock);

      const optSoldOut =
        Number.isFinite(optStock) && optStock <= 0;

      opt.disabled = optSoldOut;

      opt.textContent =
        optSoldOut
          ? `${getBaseText(opt)} (Sold Out)`
          : getBaseText(opt);

    });

    // Card is sold out only if EVERY variant is sold out
    soldOut =
      options.length > 0 &&
      options.every((opt) => {
        const s = Number(opt.dataset.stock);
        return Number.isFinite(s) && s <= 0;
      });

  } else {

    const stock =
      Number(productEl.dataset.stock);

    soldOut =
      Number.isFinite(stock) && stock <= 0;

  }

  const titleEl =
    productEl.querySelector("h3, h2");

  const btn =
    productEl.querySelector(".add-to-cart-btn") ||
    productEl.querySelector("button");

  if (soldOut) {

    productEl.classList.add("is-sold-out");

    if (titleEl) {
      titleEl.innerHTML =
        `${getBaseText(titleEl)} <span class="sold-out-tag">(Sold Out)</span>`;
    }

    if (btn) {
      btn.textContent = "Sold Out 🥲";
      btn.disabled = true;
    }

  } else {

    productEl.classList.remove("is-sold-out");

    if (titleEl) {
      titleEl.innerHTML = getBaseText(titleEl);
    }

    if (btn) {
      const isFeatured =
        productEl.classList.contains("featured-info");
      btn.textContent =
        isFeatured ? "Add to Cart" : "View Details";
      btn.disabled = false;
    }

  }

}

// Called whenever Supabase reports a stock number for a given id.
// The id might belong to a top-level product OR to a variant option
// nested inside a product's <select class="product-type">.
function updateProductStockUI(id, stock) {

  const productEl =
    document.querySelector(
      `.product[data-name="${CSS.escape(id)}"], .featured-info[data-name="${CSS.escape(id)}"]`
    );

  if (productEl) {
    productEl.dataset.stock = stock;
    refreshProductCardState(productEl);
    return;
  }

  const optionEl =
    document.querySelector(
      `.product-type option[value="${CSS.escape(id)}"]`
    );

  if (optionEl) {
    optionEl.dataset.stock = stock;
    refreshProductCardState(optionEl.closest(".product"));
  }

}


// =====================================================
// CONFETTI CELEBRATION (Buy X Get Y Free)
// =====================================================

// Max possible z-index, set inline (not via a stylesheet), so nothing
// on the page — including the cart panel that slides open right after —
// can end up layered on top of and hiding the celebration.
const CELEBRATION_Z_INDEX = 2147483647;

function triggerFreeItemCelebration(freeCount) {

  const emojis = ["🎉", "✨", "🎊", "💖", "⭐", "🥳"];

  const burst = document.createElement("div");

  Object.assign(burst.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: String(CELEBRATION_Z_INDEX)
  });

  document.body.appendChild(burst);

  const pieceCount = 34;

  for (let i = 0; i < pieceCount; i++) {

    const piece = document.createElement("span");

    piece.textContent =
      emojis[Math.floor(Math.random() * emojis.length)];

    const size =
      16 + Math.random() * 18;

    Object.assign(piece.style, {
      position: "absolute",
      left: `${Math.random() * 100}vw`,
      top: "-40px",
      fontSize: `${size}px`,
      lineHeight: "1",
      willChange: "transform, opacity"
    });

    burst.appendChild(piece);

    const duration =
      1800 + Math.random() * 1400;

    const delay =
      Math.random() * 300;

    const rotation =
      360 + Math.random() * 360;

    const drift =
      (Math.random() - 0.5) * 120;

    // Web Animations API — runs entirely from JS, so it can't be
    // hidden by a missing/overridden stylesheet rule.
    piece.animate(
      [
        {
          transform: "translate(0, 0) rotate(0deg)",
          opacity: 1
        },
        {
          transform: `translate(${drift}px, 115vh) rotate(${rotation}deg)`,
          opacity: 0.9
        }
      ],
      {
        duration: duration,
        delay: delay,
        easing: "ease-in",
        fill: "forwards"
      }
    );

  }

  setTimeout(() => {
    burst.remove();
  }, 3600);

  const toast = document.createElement("div");

  toast.textContent =
    freeCount > 1
      ? `🎉 You unlocked ${freeCount} FREE Mystery Bags!`
      : `🎉 You unlocked 1 FREE Mystery Bag!`;

  Object.assign(toast.style, {
    position: "fixed",
    top: "18px",
    left: "50%",
    transform: "translateX(-50%) translateY(-20px)",
    background: "#ff4d6d",
    color: "#fff",
    fontWeight: "700",
    padding: "12px 22px",
    borderRadius: "999px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    zIndex: String(CELEBRATION_Z_INDEX),
    opacity: "0",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    pointerEvents: "none",
    textAlign: "center",
    fontFamily: "inherit"
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  setTimeout(() => {

    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-20px)";

    setTimeout(() => toast.remove(), 350);

  }, 2400);

}


// =====================================================
// ADD TO CART (shared by featured button + product modal)
// =====================================================
// Handles normal items exactly like before. For items listed in
// FREE_ITEM_RULES (currently just "Mystery Bag"), every N PAID
// units automatically grants a free unit — the free unit is added
// to the cart's quantity (and to what gets taken out of stock /
// shipped) but is NOT charged for.

function addToCart(name, price, stock, type = "") {

  const existingItem =
    cart.find(
      (item) =>
        item.name === name &&
        item.type === type
    );

  const currentPaidQty =
    existingItem
      ? existingItem.paidQty
      : 0;

  const previousFreeQty =
    existingItem
      ? (existingItem.freeQty || 0)
      : 0;

  const newPaidQty =
    currentPaidQty + 1;

  const rule =
    FREE_ITEM_RULES[name];

  const newFreeQty =
    rule
      ? Math.floor(newPaidQty / rule.every) * rule.free
      : 0;

  const newTotalQty =
    newPaidQty + newFreeQty;

  if (stock <= 0) {

    alert(
      `"${type || name}" is sold out! 🥲`
    );

    return;

  }

  if (newTotalQty > stock) {

    alert(
      `Sorry, only ${stock} of "${type || name}" is available!`
    );

    return;

  }

  if (existingItem) {

    existingItem.paidQty = newPaidQty;

    existingItem.freeQty = newFreeQty;

    existingItem.quantity = newTotalQty;

    existingItem.stock = stock;

  } else {

    cart.push({

      name: name,

      type: type,

      price: price,

      paidQty: newPaidQty,

      freeQty: newFreeQty,

      quantity: newTotalQty,

      stock: stock

    });

  }

  updateCartDisplay();

  const justCelebrated =
    rule && newFreeQty > previousFreeQty;

  if (justCelebrated) {

    const justUnlocked =
      newFreeQty - previousFreeQty;

    triggerFreeItemCelebration(
      justUnlocked
    );

    // Give the confetti a beat on screen before the cart panel
    // slides in and covers most of the viewport.
    setTimeout(() => {
      cartPanel.classList.add("cart-open");
    }, 900);

  } else {

    cartPanel.classList.add(
      "cart-open"
    );

  }

}


// =====================================================
// OPEN PRODUCT MODAL
// =====================================================

document
  .querySelectorAll(".product")
  .forEach((productEl) => {

    productEl.addEventListener(
      "click",
      (e) => {

        if (
          productEl.classList.contains("is-sold-out") ||
          e.target.tagName === "SELECT" ||
          e.target.tagName === "OPTION"
        ) {
          return;
        }

        openModalForProduct(productEl);
      }
    );

  });


function openModalForProduct(productEl) {

  currentSelectedProduct =
    productEl;


  const name =
    getBaseText(productEl.querySelector("h3, h2")) ||
    productEl.dataset.name;

  const price =
    productEl.dataset.price;

  const description =
    productEl.dataset.description ||
    "Handmade with care, perfect for everyday style.";

  const img =
    productEl.querySelector("img");


  if (img) {

    modalImg.src =
      img.src;

    modalImg.alt =
      name;

  }


  modalTitle.textContent =
    name;

  modalPrice.textContent =
    `${price} Taka`;

  modalDescription.textContent =
    description;


  // ===================================================
  // PRODUCT TYPES
  // ===================================================

  const typeSelect =
    productEl.querySelector(
      ".product-type"
    );


  if (typeSelect) {

    modalTypeContainer.style.display =
      "block";

    modalTypeSelect.innerHTML =
      typeSelect.innerHTML;

    modalTypeSelect.selectedIndex =
      0;

  } else {

    modalTypeContainer.style.display =
      "none";

    modalTypeSelect.innerHTML =
      "";

  }


  productModal.classList.add(
    "modal-open"
  );
}


// =====================================================
// CLOSE PRODUCT MODAL
// =====================================================

closeProductModalBtn.addEventListener(
  "click",
  () => {

    productModal.classList.remove(
      "modal-open"
    );

  }
);


productModal.addEventListener(
  "click",
  (e) => {

    if (e.target === productModal) {

      productModal.classList.remove(
        "modal-open"
      );

    }

  }
);
// =====================================================
// FEATURED PRODUCT — ADD TO CART
// =====================================================

document
  .querySelectorAll(
    ".featured .add-to-cart-btn"
  )
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      (e) => {

        e.stopPropagation();


        const productEl =
          btn.closest(
            ".featured-info"
          );


        if (
          productEl.classList.contains("is-sold-out")
        ) {
          return;
        }


        const name =
          productEl.dataset.name;

        const price =
          Number(
            productEl.dataset.price
          );

        const stock =
          Number(
            productEl.dataset.stock
          );


        addToCart(
          name,
          price,
          stock,
          ""
        );

      }
    );

  });


// =====================================================
// ADD TO CART FROM PRODUCT MODAL
// =====================================================

modalAddToCartBtn.addEventListener(
  "click",
  () => {

    if (!currentSelectedProduct) {
      return;
    }


    const name =
      currentSelectedProduct.dataset.name;

    const price =
      Number(
        currentSelectedProduct.dataset.price
      );


    const typeSelect =
      currentSelectedProduct.querySelector(
        ".product-type"
      );


    let type = "";


    let stock =
      Number(
        currentSelectedProduct.dataset.stock
      );


    if (typeSelect) {

      if (!modalTypeSelect.value) {

        alert(
          "Please choose a type first 💗"
        );

        return;

      }


      type =
        modalTypeSelect.value;


      const selectedOption =
        modalTypeSelect.options[
          modalTypeSelect.selectedIndex
        ];


      if (selectedOption.disabled) {

        alert(
          `Sorry, "${type}" is sold out! 🥲`
        );

        return;

      }


      stock =
        Number(
          selectedOption.dataset.stock
        );

    }


    if (
      !Number.isFinite(stock) ||
      stock <= 0
    ) {

      alert(
        `Sorry, "${type || name}" is sold out! 🥲`
      );

      return;

    }


    addToCart(
      name,
      price,
      stock,
      type
    );


    productModal.classList.remove(
      "modal-open"
    );

  }
);


// =====================================================
// CATEGORY FILTERING
// =====================================================

function filterProducts(category) {

  const products =
    document.querySelectorAll(
      ".product-list .product"
    );


  const collectionCards =
    document.querySelectorAll(
      ".collection-card"
    );


  collectionCards.forEach(
    (card) => {

      if (
        card.dataset.category ===
        category
      ) {

        card.classList.add(
          "active"
        );

      } else {

        card.classList.remove(
          "active"
        );

      }

    }
  );


  products.forEach(
    (product) => {

      const productCategory =
        product.dataset.category;


      if (
        category === "all" ||
        productCategory === category
      ) {

        product.style.display =
          "flex";

      } else {

        product.style.display =
          "none";

      }

    }
  );

}


// =====================================================
// COLLECTION CARD CLICK
// =====================================================

document
  .querySelectorAll(
    ".collection-card"
  )
  .forEach((card) => {

    card.addEventListener(
      "click",
      () => {

        const category =
          card.dataset.category;


        filterProducts(
          category
        );


        document
          .getElementById("shop")
          .scrollIntoView({
            behavior: "smooth"
          });

      }
    );

  });


// =====================================================
// UPDATE CART DISPLAY
// =====================================================

function updateCartDisplay() {

  cartItemsContainer.innerHTML =
    "";


  let total = 0;

  let itemCount = 0;


  cart.forEach(
    (item, index) => {

      const paidQty =
        item.paidQty !== undefined
          ? item.paidQty
          : item.quantity;

      const freeQty =
        item.freeQty || 0;


      total +=
        item.price *
        paidQty;


      itemCount +=
        item.quantity;


      const itemRow =
        document.createElement(
          "div"
        );


      itemRow.classList.add(
        "cart-item"
      );


      const typeText =
        item.type
          ? ` (${item.type})`
          : "";


      const freeText =
        freeQty > 0
          ? ` <span style="color:#ff4d6d; font-weight:700;">(${freeQty} free!)</span>`
          : "";


      itemRow.innerHTML = `

        <span>
          ${item.name}${typeText} x${item.quantity}${freeText}
        </span>

        <span>
          ${item.price * paidQty} Taka
        </span>

        <button
          class="remove-item-btn"
          data-index="${index}"
        >
          ✕
        </button>

      `;


      cartItemsContainer.appendChild(
        itemRow
      );

    }
  );


  cartCountEl.textContent =
    itemCount;


  cartTotalEl.textContent =
    `Subtotal: ${total} Taka`;


  if (total > 0) {

    deliveryNoteEl.textContent =
      "Delivery charge is added at checkout based on your area.";

  } else {

    deliveryNoteEl.textContent =
      "";

  }


  document
    .querySelectorAll(
      ".remove-item-btn"
    )
    .forEach((btn) => {

      btn.addEventListener(
        "click",
        () => {

          const index =
            Number(
              btn.dataset.index
            );


          cart.splice(
            index,
            1
          );


          updateCartDisplay();

        }
      );

    });

}


// =====================================================
// CART TOGGLE
// =====================================================

cartIcon.addEventListener(
  "click",
  (e) => {

    e.preventDefault();

    cartPanel.classList.add(
      "cart-open"
    );

  }
);


closeCartBtn.addEventListener(
  "click",
  () => {

    cartPanel.classList.remove(
      "cart-open"
    );

  }
);


// =====================================================
// BUY NOW
// =====================================================

buyNowBtn.addEventListener(
  "click",
  () => {

    if (cart.length === 0) {

      alert(
        "Your cart is empty! Add something first 🛍️"
      );

      return;

    }


    cartPanel.classList.remove(
      "cart-open"
    );


    checkoutModal.classList.add(
      "checkout-open"
    );

  }
);


// =====================================================
// CLOSE CHECKOUT
// =====================================================

closeCheckoutBtn.addEventListener(
  "click",
  () => {

    checkoutModal.classList.remove(
      "checkout-open"
    );

  }
);


// =====================================================
// GET CURRENT STOCK FROM SUPABASE
// =====================================================

async function getSupabaseStock(
  productName,
  parentName = null
) {

  let result =
    await supabaseClient
      .from("products")
      .select("id, stock")
      .eq("id", productName)
      .maybeSingle();


  if (
    !result.data &&
    !result.error &&
    parentName &&
    parentName !== productName
  ) {

    result =
      await supabaseClient
        .from("products")
        .select("id, stock")
        .eq("id", parentName)
        .maybeSingle();

  }


  if (result.error) {

    console.error(
      "Stock check error:",
      result.error
    );

    return null;

  }


  if (!result.data) {

    console.warn(
      `Product "${productName}" was not found in Supabase.`
    );

    return null;

  }


  return Number(
    result.data.stock
  );

}


// =====================================================
// CHECK ALL CART STOCK
// =====================================================

async function checkCartStock() {

  for (
    const item of cart
  ) {

    const stockName =
      item.type || item.name;


    const liveStock =
      await getSupabaseStock(
        stockName,
        item.name
      );


    if (
      liveStock === null ||
      !Number.isFinite(liveStock)
    ) {

      alert(
        `We couldn't verify the stock for "${stockName}". Please try again.`
      );

      return false;

    }


    if (liveStock <= 0) {

      alert(
        `"${stockName}" is sold out! 🥲`
      );

      return false;

    }


    if (
      liveStock <
      item.quantity
    ) {

      alert(
        `"${stockName}" only has ${liveStock} left in stock. Please update your cart.`
      );

      return false;

    }

  }


  return true;

}
// =====================================================
// DECREASE STOCK IN SUPABASE
// =====================================================

async function decreaseStock(
  productName,
  quantity,
  parentName = null
) {

  let result =
    await supabaseClient
      .from("products")
      .select("id, stock")
      .eq("id", productName)
      .maybeSingle();


  if (
    !result.data &&
    !result.error &&
    parentName &&
    parentName !== productName
  ) {

    result =
      await supabaseClient
        .from("products")
        .select("id, stock")
        .eq("id", parentName)
        .maybeSingle();

  }


  if (result.error) {

    console.error(
      "Could not get stock:",
      result.error
    );

    return false;

  }


  if (!result.data) {

    console.error(
      `Product "${productName}" was not found in Supabase.`
    );

    return false;

  }


  const currentStock =
    Number(
      result.data.stock
    );


  if (
    !Number.isFinite(currentStock)
  ) {

    console.error(
      `Invalid stock value for "${productName}".`
    );

    return false;

  }


  if (
    currentStock < quantity
  ) {

    console.error(
      `Not enough stock for "${productName}".`
    );

    return false;

  }


  const newStock =
    currentStock - quantity;


  const {
    data: updatedData,
    error: updateError
  } =
    await supabaseClient
      .from("products")
      .update({
        stock: newStock
      })
      .eq("id", result.data.id)
      .eq("stock", currentStock)
      .select("id, stock")
      .maybeSingle();


  if (updateError) {

    console.error(
      "Stock update error:",
      updateError
    );

    return false;

  }


  if (!updatedData) {

    console.error(
      `Stock was not updated for "${productName}".`
    );

    return false;

  }


  updateProductStockUI(result.data.id, updatedData.stock);


  console.log(
    `Stock successfully updated: ${productName} → ${updatedData.stock}`
  );


  return true;

}


// =====================================================
// RESTORE STOCK
// =====================================================

async function restoreStock(
  productName,
  quantity,
  parentName = null
) {

  let result =
    await supabaseClient
      .from("products")
      .select("id, stock")
      .eq("id", productName)
      .maybeSingle();


  if (
    !result.data &&
    !result.error &&
    parentName &&
    parentName !== productName
  ) {

    result =
      await supabaseClient
        .from("products")
        .select("id, stock")
        .eq("id", parentName)
        .maybeSingle();

  }


  if (result.error || !result.data) {

    console.error(
      "Could not find product to restore:",
      productName,
      result.error
    );

    return false;

  }


  const currentStock =
    Number(
      result.data.stock
    );


  const restoredStock =
    currentStock + quantity;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .update({
        stock: restoredStock
      })
      .eq("id", result.data.id)
      .eq("stock", currentStock)
      .select("id, stock")
      .maybeSingle();


  if (error || !data) {

    console.error(
      "Could not restore stock:",
      error
    );

    return false;

  }


  updateProductStockUI(result.data.id, data.stock);


  console.log(
    `Stock restored: ${productName} → ${data.stock}`
  );


  return true;

}


// =====================================================
// CHECKOUT SUBMISSION
// =====================================================

checkoutForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    if (cart.length === 0) {

      alert(
        "Your cart is empty!"
      );

      return;

    }


    const stockAvailable =
      await checkCartStock();


    if (!stockAvailable) {

      return;

    }


    const name =
      document
        .getElementById(
          "customer-name"
        )
        .value
        .trim();


    const phone =
      document
        .getElementById(
          "customer-phone"
        )
        .value
        .trim();


    const address =
      document
        .getElementById(
          "customer-address"
        )
        .value
        .trim();


    const socialAccount =
      document
        .getElementById(
          "social-account"
        )
        .value
        .trim();


    const locationInput =
      document.getElementById(
        "customer-location"
      );


    const locationValue =
      locationInput
        ? locationInput.value
        : "dhaka";


    let subtotal = 0;


    cart.forEach(
      (item) => {

        const paidQty =
          item.paidQty !== undefined
            ? item.paidQty
            : item.quantity;

        subtotal +=
          item.price *
          paidQty;

      }
    );


    let deliveryCharge = 0;

    let deliveryZoneText = "";


    if (
      locationValue
        .toLowerCase()
        .includes("outside")
    ) {

      deliveryCharge =
        SHIPPING_OUTSIDE_DHAKA;

      deliveryZoneText =
        "Outside Dhaka (130 Taka)";

    } else {

      deliveryCharge =
        SHIPPING_INSIDE_DHAKA;

      deliveryZoneText =
        "Inside Dhaka (70 Taka)";

    }


    const grandTotal =
      subtotal +
      deliveryCharge;


    let summary =
      "🛍️ NEW ORBEADS ORDER\n\n";


    summary +=
      `Name: ${name}\n`;


    summary +=
      `Phone: ${phone}\n`;


    summary +=
      `Address: ${address}\n`;


    summary +=
      `Instagram/Facebook: ${
        socialAccount ||
        "Not provided"
      }\n\n`;


    summary +=
      "--- ORDER ITEMS ---\n";


    cart.forEach(
      (item) => {

        const typeText =
          item.type
            ? ` — ${item.type}`
            : "";


        const paidQty =
          item.paidQty !== undefined
            ? item.paidQty
            : item.quantity;

        const freeQty =
          item.freeQty || 0;

        const itemTotal =
          item.price *
          paidQty;

        const freeNote =
          freeQty > 0
            ? ` (incl. ${freeQty} free!)`
            : "";


        summary +=
          `- ${item.name}${typeText} x${item.quantity}${freeNote} — ${itemTotal} Taka\n`;

      }
    );


    summary +=
      "\n--- INVOICE SUMMARY ---\n";


    summary +=
      `Subtotal: ${subtotal} Taka\n`;


    summary +=
      `Delivery (${deliveryZoneText}): ${deliveryCharge} Taka\n`;


    summary +=
      "-----------------------\n";


    summary +=
      `TOTAL PAYABLE: ${grandTotal} Taka\n`;


    const decreasedItems = [];


    try {

      for (
        const item of cart
      ) {

        const stockName =
          item.type ||
          item.name;


        const decreased =
          await decreaseStock(
            stockName,
            item.quantity,
            item.name
          );


        if (!decreased) {

          for (
            const completedItem
            of decreasedItems
          ) {

            await restoreStock(
              completedItem.stockName,
              completedItem.quantity,
              completedItem.parentName
            );

          }


          alert(
            `We couldn't update the stock for "${stockName}". Your order was NOT sent. Please try again.`
          );


          return;

        }


        decreasedItems.push({

          stockName:
            stockName,

          quantity:
            item.quantity,

          parentName:
            item.name

        });

      }


      const response =
        await fetch(
          FORMSPREE_URL,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Accept":
                "application/json"

            },

            body: JSON.stringify({

              name:
                name,

              phone:
                phone,

              address:
                address,

              socialAccount:
                socialAccount,

              subtotal:
                subtotal,

              deliveryCharge:
                deliveryCharge,

              totalAmount:
                grandTotal,

              order:
                summary

            })

          }
        );


      if (!response.ok) {

        throw new Error(
          "Order email submission failed."
        );

      }


      alert(
        `Order sent! Total: ${grandTotal} Taka. Thank you so much for your order! 💌`
      );


      cart = [];


      updateCartDisplay();


      checkoutForm.reset();


      checkoutModal.classList.remove(
        "checkout-open"
      );


    } catch (error) {

      console.error(
        "Order error:",
        error
      );


      for (
        const completedItem
        of decreasedItems
      ) {

        await restoreStock(
          completedItem.stockName,
          completedItem.quantity,
          completedItem.parentName
        );

      }


      try {

        await navigator.clipboard.writeText(
          summary
        );


        alert(
          "Couldn't send the order automatically, and your stock has been restored. Your order was copied — please paste it into an Instagram DM to @orbeadjewellery to confirm 💌"
        );


      } catch (copyError) {

        alert(
          "Couldn't send the order automatically. Your stock has been restored.\n\n" +
          summary
        );

      }

    }

  }
);


// =====================================================
// SYNC STOCK & TEST SUPABASE CONNECTION ON LOAD
// =====================================================

async function syncStockFromSupabase() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select("id, stock");


  if (error) {

    console.error(
      "Supabase error:",
      error
    );

    return;

  }


  data.forEach((item) => {
    updateProductStockUI(item.id, item.stock);
  });


  console.log(
    "Supabase connected and stock synced successfully:",
    data
  );

}


// Apply whatever stock numbers are already hardcoded in the HTML
// immediately, so there's no "flash" of an available product before
// Supabase responds. syncStockFromSupabase() will then overwrite this
// with the real live numbers a moment later.
document
  .querySelectorAll(".product, .featured-info")
  .forEach(refreshProductCardState);

syncStockFromSupabase();
