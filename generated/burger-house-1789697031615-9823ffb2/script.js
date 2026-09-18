const products = [
  { id: 1, name: 'Le Classic', category: 'burgers', price: 11.9, icon: '🍔', description: 'Steak haché, cheddar, salade, tomate, sauce maison.' },
  { id: 2, name: 'Le Spicy', category: 'burgers', price: 12.9, icon: '🌶️', description: 'Steak haché, cheddar, jalapeños, oignons frits, sauce spicy.' },
  { id: 3, name: 'Le Crispy Chicken', category: 'burgers', price: 12.5, icon: '🍔', description: 'Poulet croustillant, cheddar, coleslaw et sauce barbecue.' },
  { id: 4, name: 'Le Veggie', category: 'burgers', price: 11.5, icon: '🥬', description: 'Galette végétale, avocat, salade, tomate et sauce fraîche.' },
  { id: 5, name: 'Frites maison', category: 'accompagnements', price: 3.9, icon: '🍟', description: 'Pommes de terre fraîches, coupées et assaisonnées sur place.' },
  { id: 6, name: 'Onion rings', category: 'accompagnements', price: 4.5, icon: '🧅', description: 'Oignons doux enrobés d’une chapelure ultra croustillante.' },
  { id: 7, name: 'Limonade maison', category: 'boissons', price: 3.5, icon: '🍋', description: 'Citron frais, eau pétillante et juste ce qu’il faut de sucre.' },
  { id: 8, name: 'Milkshake vanille', category: 'boissons', price: 5.5, icon: '🥤', description: 'Onctueux, généreux et préparé à la minute.' }
];

let cart = JSON.parse(localStorage.getItem('burgerHouseCart') || '[]');
const grid = document.getElementById('productsGrid');
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');

function euro(value) { return value.toFixed(2).replace('.', ',') + ' €'; }

function renderProducts(category = 'all') {
  const visible = category === 'all' ? products : products.filter(product => product.category === category);
  grid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-image"><span class="food-art">${product.icon}</span></div>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="product-bottom"><span class="product-price">${euro(product.price)}</span><button class="add-button" data-add="${product.id}" aria-label="Ajouter ${product.name} au panier">+</button></div>
    </article>`).join('');
}

function saveCart() { localStorage.setItem('burgerHouseCart', JSON.stringify(cart)); }
function addToCart(id) {
  const item = cart.find(product => product.id === id);
  if (item) item.quantity += 1;
  else cart.push({ ...products.find(product => product.id === id), quantity: 1 });
  saveCart(); renderCart(); openCart();
}
function changeQuantity(id, amount) {
  const item = cart.find(product => product.id === id);
  if (!item) return;
  item.quantity += amount;
  cart = cart.filter(product => product.quantity > 0);
  saveCart(); renderCart();
}
function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = euro(total);
  const items = document.getElementById('cartItems');
  if (!cart.length) {
    items.innerHTML = '<p class="empty-cart">Votre panier est vide.<br><span>Ajoutez un peu de gourmandise !</span></p>';
    return;
  }
  items.innerHTML = cart.map(item => `<div class="cart-row"><span class="cart-row-icon">${item.icon}</span><div class="cart-row-info"><strong>${item.name}</strong><small>${euro(item.price)}</small></div><div class="quantity"><button data-minus="${item.id}" aria-label="Retirer un ${item.name}">−</button><span>${item.quantity}</span><button data-plus="${item.id}" aria-label="Ajouter un ${item.name}">+</button></div></div>`).join('');
}
function openCart() { cartDrawer.classList.add('open'); overlay.classList.add('visible'); cartDrawer.setAttribute('aria-hidden', 'false'); }
function closeCart() { cartDrawer.classList.remove('open'); overlay.classList.remove('visible'); cartDrawer.setAttribute('aria-hidden', 'true'); }

grid.addEventListener('click', event => { const button = event.target.closest('[data-add]'); if (button) addToCart(Number(button.dataset.add)); });
document.getElementById('cartItems').addEventListener('click', event => { if (event.target.dataset.plus) changeQuantity(Number(event.target.dataset.plus), 1); if (event.target.dataset.minus) changeQuantity(Number(event.target.dataset.minus), -1); });
document.getElementById('cartButton').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeCart(); });

document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelector('.category-tab.active').classList.remove('active'); tab.classList.add('active'); renderProducts(tab.dataset.category); }));

document.getElementById('menuToggle').addEventListener('click', () => { const links = document.getElementById('navLinks'); const open = links.classList.toggle('open'); document.getElementById('menuToggle').setAttribute('aria-expanded', open); });
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open')));

document.getElementById('contactForm').addEventListener('submit', event => { event.preventDefault(); const message = document.getElementById('formMessage'); message.textContent = 'Merci ! Votre message a bien été envoyé.'; event.target.reset(); });
document.getElementById('checkoutButton').addEventListener('click', () => { if (!cart.length) { alert('Votre panier est vide.'); return; } alert('Merci pour votre commande ! La validation en ligne sera bientôt disponible.'); });

renderProducts();
renderCart();