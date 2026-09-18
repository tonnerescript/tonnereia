# Burger House

Site internet responsive pour un restaurant de burgers.

## Fonctionnalités

- Page d'accueil avec présentation du restaurant
- Menu filtrable par catégorie
- Ajout de produits au panier
- Gestion des quantités dans le panier
- Panier conservé dans le navigateur avec `localStorage`
- Formulaire de contact avec confirmation visuelle
- Navigation mobile responsive
- Design adapté aux téléphones, tablettes et ordinateurs

## Lancement

Aucune installation n'est nécessaire. Ouvrez simplement `index.html` dans un navigateur web.

Pour un lancement local recommandé, utilisez un serveur statique comme l'extension Live Server de VS Code ou la commande suivante avec Python :

```bash
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

Le formulaire de contact et le bouton de commande sont actuellement des démonstrations côté client. Ils peuvent être reliés à une API ou à un service de paiement pour une utilisation en production.