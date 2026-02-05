const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user'); // Importamos tu modelo
const Product = require('./models/Product'); // <--- Importamos el modelo de productos
const Order = require('./models/Order');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public')); // Para que cargue el index.html automáticamente

// Conexión a MongoDB Local
mongoose.connect('mongodb://localhost:27017/andima')
  .then(() => console.log("Conectado a la base de datos: andima"))
  .catch(err => console.error("Error al conectar a MongoDB", err));


//#########################################################
//############ USUARIOS Y AUTENTICACIÓN #######################
//#########################################################
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        
        if (user) {
            // Enviamos el rol al frontend para que decida a qué página ir
            res.json({ 
                success: true, 
                role: user.role 
            });
        } else {
            res.status(401).json({ success: false, message: "Credenciales inválidas" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});

//#########################################################
//############ PRODUCTOS #######################
//#########################################################

// 1. Guardar un nuevo producto (POST)
app.post('/api/productos', async (req, res) => {
    try {
        // Contamos cuántos productos existen para generar el consecutivo
        const totalProductos = await Product.countDocuments();
        
        // Generamos el código: AND + número relleno con ceros (Ej: AND-005)
        const consecutivo = totalProductos + 1;
        const codigoAutomatico = `AND-${consecutivo.toString().padStart(3, '0')}`;

        // Creamos el objeto con los datos del formulario + el código generado
        const nuevoProducto = new Product({
            codigo: codigoAutomatico, // <--- Aquí va el automático
            nombre: req.body.nombre,
            precio: req.body.precio,
            stock: req.body.stock,
            categoria: req.body.categoria
        });

        await nuevoProducto.save();
        res.json({ success: true, message: "Producto guardado con código: " + codigoAutomatico });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al guardar el producto" });
    }
});

// 2. Obtener todos los productos (GET)
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Product.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

app.put('/api/productos/stock', async (req, res) => {
    const { codigo, cantidad } = req.body;
    try {
        // Usamos $inc para INCREMENTAR el valor actual (no lo reemplaza, lo suma)
        const productoActualizado = await Product.findOneAndUpdate(
            { codigo: codigo },
            { $inc: { stock: Number(cantidad) } }, 
            { new: true } // Nos devuelve el dato ya actualizado
        );

        if (productoActualizado) {
            res.json({ success: true, nuevoStock: productoActualizado.stock });
        } else {
            res.status(404).json({ success: false, message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al actualizar stock" });
    }
});

//#########################################################
//############ TICKET DE VENTA #######################
//#########################################################

app.post('/api/pedidos', async (req, res) => {
    try {
        // 1. VALIDACIÓN DE HORARIO (7:00 AM - 21:00 PM)
        const ahora = new Date();
        const horaActual = ahora.getHours(); // Obtiene la hora (0-23) del sistema local

        // Si es antes de las 7 o después de las 21 (9 PM), rechazamos
        if (horaActual < 7 || horaActual >= 21) {
            return res.status(400).json({ 
                success: false, 
                message: "⛔ La tienda está CERRADA. Horario de atención: 7:00 - 21:00" 
            });
        }
        const { cliente, productos, total, direccion } = req.body;

        // 1. Generar código de pedido automático (PED-001)
        const totalPedidos = await Order.countDocuments();
        const codigoAuto = `PED-${(totalPedidos + 1).toString().padStart(3, '0')}`;

        // 2. Crear la orden
        const nuevaOrden = new Order({
            codigo: codigoAuto,
            cliente,
            productos,
            total,
            direccion
        });

        await nuevaOrden.save();

        // 3. (Opcional) Descontar Stock: Iteramos los productos y restamos 1 a cada uno
        // Esto cumple con el requisito de "Integridad de Datos" [cite: 73]
        for (const item of productos) {
             await Product.updateOne(
                 { nombre: item.nombre }, 
                 { $inc: { stock: -1 } } 
             );
        }

        res.json({ success: true, message: "Pedido realizado con éxito", ticket: codigoAuto });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al procesar el pedido" });
    }
});


//#########################################################
//############ REPARTIDOR #######################
//#########################################################

// 1. Obtener solo los pedidos PENDIENTES
app.get('/api/pedidos/pendientes', async (req, res) => {
    try {
        const pedidos = await Order.find({ estado: 'Pendiente' });
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener pedidos" });
    }
});

// 2. Marcar pedido como ENTREGADO
app.put('/api/pedidos/entregar', async (req, res) => {
    const { id } = req.body;
    try {
        await Order.findByIdAndUpdate(id, { estado: 'Entregado' });
        res.json({ success: true, message: "Pedido entregado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar estado" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});