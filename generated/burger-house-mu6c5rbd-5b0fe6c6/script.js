const products = [
  { id: 1, name: 'Le Classic', description: 'Steak haché, cheddar, salade, tomate et sauce maison.', price: 9.9, category: 'burgers', icon: '🍔' },
  { id: 2, name: 'Le Bacon Lover', description: 'Double bacon croustillant, cheddar et sauce barbecue.', price: 12.9, category: 'burgers', icon: '🥓' },
  { id: 3, name: 'Le Veggie', description: 'Galette végétale, avocat, roquette et sauce fraîche.', price: 10.9, category: 'burgers', icon: '🥬' },
  { id: 4, name: 'Frites maison', description: 'Des frites dorées, croustillantes et assaisonnées.', price: 3.5, category: 'accompagnements', icon: '🍟' },
  { id: 5, name: 'Onion rings', description: 'Rondelles d'oignon panées et ultra croustillantes.', price: 4.5, category: 'accompagnements', icon: '🧅' },
  { id: 6, name: 'Limonade fraîche', description: 'Limonade artisanale, citron et menthe fraîche.', price: 3.2, category: 'boissons', icon: '🍋' }
];

let cart = JSON.parse(localStorage.getItem('burgerHouseCart') || '[]');
const grid = document.querySelector('#products-grid');
const cartPanel = document.querySelector('#cart-panel');
const overlay = document.querySelector('#overlay');

function formatPrice(price) { return price.toFixed(2).replace('.', ',') + ' €'; }

function renderProducts(category = 'all') {
  const visible = category === 'all' ? products : products.filter(product => product.category === category);
  grid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-visual">${product.icon}</div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="add-button" data-add="${product.id}" aria-label="Ajouter ${product.name} au panier">+</button>
        </div>
      </div>
    </article>`).join('');
}

function saveCart() { localStorage.setItem('burgerHouseCart', JSON.stringify(cart)); }

function addToCart(id) {
  const item = cart.find(entry => entry.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveCart();
  renderCart();
  openCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(entry => entry.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(element => element.textContent = totalItems);
  const container = document.querySelector('#cart-items');
  if (!cart.length) {
    container.innerHTML = '<p class="empty-cart">Votre panier est vide.<br>Ajoutez un burger pour commencer !</p>';
    document.querySelector('#cart-total').textContent = '0,00 €';
    return;
  }
  let total = 0;
  container.innerHTML = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    total += product.price * item.quantity;
    return `<div class="cart-item"><span class="cart-item-icon">${product.icon}</span><div class="cart-item-info"><strong>${product.name}</strong><small>${formatPrice(product.price)}</small></div><div class="quantity"><button data-minus="${product.id}" aria-label="Retirer une unité">−</button><span>${item.quantity}</span><button data-plus="${product.id}" aria-label="Ajouter une unité">+</button></div></div>`;
  }).join('');
  document.querySelector('#cart-total').textContent = formatPrice(total);
}

function openCart() { cartPanel.classList.add('open'); overlay.classList.add('visible'); cartPanel.setAttribute('aria-hidden', 'false'); }
function closeCart() { cartPanel.classList.remove('open'); overlay.classList.remove('visible'); cartPanel.setAttribute('aria-hidden', 'true'); }

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-add]');
  if (button) addToCart(Number(button.dataset.add));
});

document.querySelector('#cart-items').addEventListener('click', event => {
  const plus = event.target.closest('[data-plus]');
  const minus = event.target.closest('[data-minus]');
  if (plus) changeQuantity(Number(plus.dataset.plus), 1);
  if (minus) changeQuantity(Number(minus.dataset.minus), -1);
});

document.querySelectorAll('.category').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.category.active').classList.remove('active');
  button.classList.add('active');
  renderProducts(button.dataset.category);
}));

document.querySelector('#open-cart').addEventListener('click', openCart);
document.querySelector('#close-cart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.querySelector('#checkout').addEventListener('click', () => {
  if (!cart.length) return alert('Votre panier est vide.');
  alert('Merci ! Votre commande est prête à être confirmée.');
});

document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#form-message').textContent = 'Merci pour votre message ! Nous vous répondrons très vite.';
  event.target.reset();
});

document.querySelector('.menu-toggle').addEventListener('click', event => {
  const links = document.querySelector('.nav-links');
  const isOpen = links.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('open')));
renderProducts();
renderCart();