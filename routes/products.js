const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const productsFile = path.join(__dirname, "../data/products.json");

// Función auxiliar para leer productos
const readProducts = () => {
  if (!fs.existsSync(productsFile)) return [];
  return JSON.parse(fs.readFileSync(productsFile, "utf-8"));
};

// Función auxiliar para escribir productos
const writeProducts = (data) => {
  fs.writeFileSync(productsFile, JSON.stringify(data, null, 2));
};

// 📌 GET: Listar todos los productos
router.get("/", (req, res) => {
  const products = readProducts();
  res.json(products);
});

// 📌 GET: Obtener producto por ID
router.get("/:id", (req, res) => {
  const products = readProducts();
  const product = products.find((p) => p.id === parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ error: "Producto no encontrado" });
});

// 📌 POST: Agregar un nuevo producto
router.post("/", (req, res) => {
  const products = readProducts();
  const newProduct = {
    id: products.length ? products[products.length - 1].id + 1 : 1,
    ...req.body,
  };
  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

// 📌 PUT: Actualizar un producto por ID
router.put("/:id", (req, res) => {
  const products = readProducts();
  const index = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Producto no encontrado" });

  products[index] = { ...products[index], ...req.body };
  writeProducts(products);
  res.json(products[index]);
});

// 📌 DELETE: Eliminar un producto
router.delete("/:id", (req, res) => {
  let products = readProducts();
  const newProducts = products.filter((p) => p.id !== parseInt(req.params.id));
  if (newProducts.length === products.length) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  writeProducts(newProducts);
  res.json({ message: "Producto eliminado correctamente" });
});

module.exports = router;
