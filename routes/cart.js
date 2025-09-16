const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const cartsFile = path.join(__dirname, "../data/carts.json");
const productsFile = path.join(__dirname, "../data/products.json");

// Leer/escribir
const readFile = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : []);
const writeFile = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// 📌 Crear un carrito nuevo
router.post("/", (req, res) => {
  const carts = readFile(cartsFile);
  const newCart = {
    id: carts.length ? carts[carts.length - 1].id + 1 : 1,
    products: [],
  };
  carts.push(newCart);
  writeFile(cartsFile, carts);
  res.status(201).json(newCart);
});

// 📌 Obtener productos de un carrito
router.get("/:id", (req, res) => {
  const carts = readFile(cartsFile);
  const cart = carts.find((c) => c.id === parseInt(req.params.id));
  cart ? res.json(cart) : res.status(404).json({ error: "Carrito no encontrado" });
});

// 📌 Agregar producto a un carrito
router.post("/:id/product/:pid", (req, res) => {
  const carts = readFile(cartsFile);
  const products = readFile(productsFile);
  const cart = carts.find((c) => c.id === parseInt(req.params.id));
  if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

  const product = products.find((p) => p.id === parseInt(req.params.pid));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  const item = cart.products.find((p) => p.productId === product.id);
  if (item) {
    item.quantity += 1;
  } else {
    cart.products.push({ productId: product.id, quantity: 1 });
  }

  writeFile(cartsFile, carts);
  res.json(cart);
});

module.exports = router;
