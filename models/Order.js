const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Código de preventa (lo generaremos automático como los productos)
  codigo: { 
    type: String, 
    unique: true 
  },

  cliente: { 
    type: String, 
    required: true 
  },

  // Guardamos qué productos compró (Array de objetos)
  productos: [{
    nombre: String,
    precio: Number
  }],

  total: { 
    type: Number, 
    required: true 
  },

  direccion: { 
    type: String, 
    required: true 
  },

  // Estado del pedido: Vital para el Repartidor
  estado: { 
    type: String, 
    enum: ['Pendiente', 'Entregado'], 
    default: 'Pendiente' 
  },
  
  fecha: { 
    type: Date, 
    default: Date.now 
  }

}, { collection: 'pedidos' });

module.exports = mongoose.model('Order', orderSchema);