import express from "express";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configurar Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Archivo JSON donde guardamos productos
const productsFilePath = path.join(__dirname, "data", "products.json");

// Asegurarse de que el archivo exista
if (!fs.existsSync(productsFilePath)) {
  fs.mkdirSync(path.dirname(productsFilePath), { recursive: true });
  fs.writeFileSync(productsFilePath, JSON.stringify([]));
}

// Leer productos
const getProducts = () => {
  const data = fs.readFileSync(productsFilePath, "utf-8");
  return JSON.parse(data);
};

// Guardar productos
const saveProducts = (products) => {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
};

// --- Rutas ---

// Home (vista normal)
app.get("/", (req, res) => {
  const products = getProducts();
  res.render("home", { products });
});

// Real-time products (con WebSockets)
app.get("/realtimeproducts", (req, res) => {
  const products = getProducts();
  res.render("realTimeProducts", { products });
});

// API REST para productos
app.get("/api/products", (req, res) => {
  res.json(getProducts());
});

app.post("/api/products", (req, res) => {
  const { title, price, description, stock } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const products = getProducts();
  const newProduct = {
    id: Date.now().toString(),
    title,
    price,
    description: description || "",
    stock: stock || 0,
  };

  products.push(newProduct);
  saveProducts(products);

  io.emit("updateProducts", products); // Notificar a todos los clientes
  res.status(201).json(newProduct);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  let products = getProducts();

  const productExists = products.some((p) => p.id === id);
  if (!productExists) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  products = products.filter((p) => p.id !== id);
  saveProducts(products);

  io.emit("updateProducts", products); // Actualiza la vista en tiempo real
  res.json({ message: "Producto eliminado correctamente" });
});

// --- WebSockets ---
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado vía WebSocket");

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

// --- Detección automática de puerto ---
const DEFAULT_PORT = 8080;

// Intentar iniciar en 8080, si falla, probar con 8081, 8082, ...
const startServer = (port = DEFAULT_PORT) => {
  const serverInstance = httpServer.listen(port, () => {
    console.log(`🚀 Servidor escuchando en: http://localhost:${port}`);
  });

  serverInstance.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Puerto ${port} en uso, probando el siguiente...`);
      startServer(port + 1);
    } else {
      console.error("❌ Error al iniciar el servidor:", err);
    }
  });
};

startServer();
