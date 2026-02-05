const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // id_prod del diagrama: Usaremos 'codigo' para que sea más fácil de leer
  codigo: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // nombre del diagrama
  nombre: { 
    type: String, 
    required: true 
  },
  
  // costo_unitario del diagrama: Lo llamaremos precio para la venta
  precio: { 
    type: Number, 
    required: true 
  },
  
  // stock_actual del diagrama
  stock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  
  // Campo extra para cumplir con la estrategia de "Nichos" vs "Canasta Básica"
  categoria: {
    type: String,
    enum: ['nicho', 'basico'], // Solo permite estos dos valores
    default: 'basico'
  },

  // Para guardar la imagen del producto (opcional por ahora, pero útil para la tienda)
  imagen: {
    type: String,
    default: 'default.jpg' 
  }

}, { collection: 'productos' }); // Se guardará en la colección 'productos' en Mongo

module.exports = mongoose.model('Product', productSchema);