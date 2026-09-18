const products = [
  {id:1,name:'Le Classic',description:'Steak haché, cheddar, salade, tomate et sauce maison.',price:12.9,category:'burgers',emoji:'🍔'},
  {id:2,name:'Le Spicy',description:'Steak haché, cheddar, jalapeños, oignons frits et sauce spicy.',price:14.5,category:'burgers',emoji:'🌶️'},
  {id:3,name:'Le Crispy Chicken',description:'Poulet croustillant, coleslaw, cheddar et sauce barbecue.',price:13.9,category:'burgers',emoji:'🍗'},
  {id:4,name:'Le Veggie',description:'Steak végétal, avocat, roquette, tomate et sauce fraîche.',price:13.5,category:'burgers',emoji:'🥬'},
  {id:5,name:'Frites House',description:'Nos frites maison avec une sauce au choix.',price:4.5,category:'sides',emoji:'🍟'},
  {id:6,name:'Onion Rings',description:'Oignons panés et croustillants, servis par 6.',price:5.5,category:'sides',emoji:'🧅'},
  {id:7,name:'Cola frais',description:'Une boisson pétillante bien fraîche.',price:2.9,category:'drinks',emoji:'🥤'},
  {id:8,name:'Milkshake Vanille',description:'Onctueux, généreux et préparé à la minute.',price:5.9,category:'drinks',emoji:'🥛'}
];
let cart = JSON.parse(localStorage.getItem('burgerHouseCart') || '[]');
const grid = document.getElementById('products-grid');
const cartPanel = document.getElementById('cart-panel');
const overlay = document.getElementById('overlay');

function euro(value){ return value.toFixed(2).replace('.', ',') + ' €'; }
function renderProducts(category = 'all') {
  const visible = category === 'all' ? products : products.filter(product => product.category === category);
  grid.innerHTML = visible.map(product => `<article class="product-card"><div class="product-image">${product.emoji}</div><h3>${product.name}</h3><p>${product.description}</p><div class="product-bottom"><span class="price">${euro(product.price)}</span><button class="add-button" data-add="${product.id}" aria-label="Ajouter ${product.name}">+</button></div></article>`).join('');
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addToCart(Number(button.dataset.add))));
}
function addToCart(id){
  const item = cart.find(product => product.id === id);
  if(item) item.quantity++;
  else cart.push({id, quantity:1});
  saveCart();
  openCart();
}
function saveCart(){ localStorage.setItem('burgerHouseCart', JSON.stringify(cart)); renderCart(); }
function renderCart(){
  const count = cart.reduce((total,item) => total + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
  const items = document.getElementById('cart-items');
  if(!cart.length){ items.innerHTML = '<p class="empty-cart">Votre panier est vide.<br><span>Ajoutez une petite merveille !</span></p>'; document.getElementById('cart-total').textContent = '0,00 €'; return; }
  let total = 0;
  items.innerHTML = cart.map(item => { const product = products.find(product => product.id === item.id); total += product.price * item.quantity; return `<div class="cart-item"><div class="cart-emoji">${product.emoji}</div><div class="cart-item-info"><strong>${product.name}</strong><small>${euro(product.price)}</small></div><div class="quantity"><button data-minus="${product.id}" aria-label="Retirer un article">−</button><span>${item.quantity}</span><button data-plus="${product.id}" aria-label="Ajouter un article">+</button></div></div>`; }).join('');
  document.getElementById('cart-total').textContent = euro(total);
  document.querySelectorAll('[data-minus]').forEach(button => button.addEventListener('click', () => updateQuantity(Number(button.dataset.minus), -1)));
  document.querySelectorAll('[data-plus]').forEach(button => button.addEventListener('click', () => updateQuantity(Number(button.dataset.plus), 1)));
}
function updateQuantity(id, change){ const item = cart.find(product => product.id === id); if(!item) return; item.quantity += change; if(item.quantity <= 0) cart = cart.filter(product => product.id !== id); saveCart(); }
function openCart(){ cartPanel.classList.add('open'); overlay.classList.add('show'); cartPanel.setAttribute('aria-hidden','false'); }
function closeCart(){ cartPanel.classList.remove('open'); overlay.classList.remove('show'); cartPanel.setAttribute('aria-hidden','true'); }
document.getElementById('open-cart').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.querySelectorAll('.category-tabs button').forEach(button => button.addEventListener('click', () => { document.querySelector('.category-tabs .active').classList.remove('active'); button.classList.add('active'); renderProducts(button.dataset.category); }));
document.getElementById('contact-form').addEventListener('submit', event => { event.preventDefault(); document.getElementById('form-status').textContent = 'Merci ! Votre message a bien été envoyé.'; event.target.reset(); });
document.getElementById('checkout').addEventListener('click', () => { if(!cart.length){ alert('Votre panier est vide.'); return; } alert('Merci pour votre commande ! Le paiement en ligne sera bientôt disponible.'); });
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle.addEventListener('click', () => { const isOpen = nav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', isOpen); });
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
renderProducts();
renderCart();