const products = [
  {id:1,name:'Le Classic',category:'burger',price:12.5,description:'Steak haché, cheddar affiné, salade, tomate et sauce secrète.',image:'https://images.unsplash.com/photo-157 burger?auto=format&fit=crop&w=700&q=80'.replace('157 burger','1568901346375-23c9450c58cd')},
  {id:2,name:'Le Spicy',category:'burger',price:14.5,description:'Steak haché, cheddar, jalapeños, oignons frits et sauce piquante.',image:'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=700&q=80'},
  {id:3,name:'Le Crispy Chicken',category:'burger',price:13.5,description:'Poulet croustillant, coleslaw maison, cheddar et sauce barbecue.',image:'https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=700&q=80'},
  {id:4,name:'Frites House',category:'accompagnement',price:4.5,description:'Frites dorées, sel fumé et notre sauce maison au choix.',image:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80'},
  {id:5,name:'Onion Rings',category:'accompagnement',price:5.5,description:'Rondelles d’oignon croustillantes et sauce barbecue fumée.',image:'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=700&q=80'},
  {id:6,name:'Cookie Skillet',category:'dessert',price:6.5,description:'Cookie moelleux servi chaud, chocolat et boule de glace vanille.',image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=700&q=80'}
];

let cart = JSON.parse(localStorage.getItem('burgerHouseCart') || '[]');
const productsGrid = document.getElementById('productsGrid');
const cartPanel = document.getElementById('cartPanel');
const overlay = document.getElementById('overlay');

function formatPrice(value){ return value.toFixed(2).replace('.', ',') + ' €'; }
function renderProducts(filter = 'all'){
  const visible = filter === 'all' ? products : products.filter(product => product.category === filter);
  productsGrid.innerHTML = visible.map(product => `<article class="product-card"><img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy"><div class="product-body"><div class="product-top"><h3 class="product-name">${product.name}</h3><span class="product-price">${formatPrice(product.price)}</span></div><p class="product-description">${product.description}</p><button class="add-product" data-id="${product.id}">Ajouter au panier +</button></div></article>`).join('');
}
function saveCart(){ localStorage.setItem('burgerHouseCart', JSON.stringify(cart)); }
function renderCart(){
  const count = cart.reduce((sum,item) => sum + item.quantity, 0);
  const total = cart.reduce((sum,item) => sum + item.price * item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = formatPrice(total);
  const cartItems = document.getElementById('cartItems');
  if(!cart.length){ cartItems.innerHTML = '<div class="empty-cart"><span>🍔</span><p>Votre panier est vide.</p><small>Ajoutez un burger pour commencer !</small></div>'; return; }
  cartItems.innerHTML = cart.map(item => `<div class="cart-item"><img src="${item.image}" alt="${item.name}"><div class="cart-item-info"><strong>${item.name}</strong><div class="cart-item-price">${formatPrice(item.price)}</div><div class="quantity"><button data-action="decrease" data-id="${item.id}" aria-label="Retirer une unité">−</button><span>${item.quantity}</span><button data-action="increase" data-id="${item.id}" aria-label="Ajouter une unité">+</button></div></div><button class="remove-item" data-action="remove" data-id="${item.id}" aria-label="Supprimer ${item.name}">×</button></div>`).join('');
}
function openCart(){ cartPanel.classList.add('open');overlay.classList.add('open');cartPanel.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'; }
function closeCart(){ cartPanel.classList.remove('open');overlay.classList.remove('open');cartPanel.setAttribute('aria-hidden','true');document.body.style.overflow=''; }
productsGrid.addEventListener('click', event => { const button = event.target.closest('.add-product'); if(!button) return; const product = products.find(item => item.id === Number(button.dataset.id)); const existing = cart.find(item => item.id === product.id); if(existing) existing.quantity++; else cart.push({...product,quantity:1}); saveCart();renderCart();openCart(); });
document.getElementById('cartItems').addEventListener('click', event => { const button = event.target.closest('[data-action]'); if(!button) return; const item = cart.find(entry => entry.id === Number(button.dataset.id)); if(!item) return; if(button.dataset.action === 'increase') item.quantity++; if(button.dataset.action === 'decrease') item.quantity--; if(button.dataset.action === 'remove' || item.quantity <= 0) cart = cart.filter(entry => entry.id !== item.id); saveCart();renderCart(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { document.querySelector('.filter.active').classList.remove('active');button.classList.add('active');renderProducts(button.dataset.filter); }));
document.getElementById('cartButton').addEventListener('click', openCart);document.getElementById('closeCart').addEventListener('click', closeCart);overlay.addEventListener('click', closeCart);
document.getElementById('checkoutButton').addEventListener('click', () => { if(!cart.length){ alert('Votre panier est vide.'); return; } alert('Merci pour votre commande ! Cette démo ne traite pas encore les paiements.'); });
const menuToggle = document.getElementById('menuToggle');const navLinks = document.getElementById('navLinks');menuToggle.addEventListener('click', () => { const isOpen = navLinks.classList.toggle('open');menuToggle.setAttribute('aria-expanded', isOpen); });document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('open')));
document.getElementById('contactForm').addEventListener('submit', event => { event.preventDefault();const status = document.getElementById('formStatus');status.textContent = 'Merci ! Votre message a bien été envoyé.';event.target.reset(); });
renderProducts();renderCart();