// api/create-order.js
//
// Se llama justo antes de mandar al cliente a pagar con Wompi. Hace dos
// cosas:
//   1. Guarda el pedido (cliente, dirección, productos) en la base de
//      datos con estado "pending", para que aparezca en tu dashboard
//      de /admin.html incluso si el cliente cierra la pestaña antes de
//      terminar de pagar.
//   2. Calcula la firma de integridad que Wompi exige, igual que hacía
//      antes /api/wompi-signature.js.

const crypto = require('crypto');
const store = require('./_lib/orders-store');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const secret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'Falta configurar WOMPI_INTEGRITY_SECRET en Vercel' });
      return;
    }

    const {
      reference, amountInCents, currency,
      name, phone, email, address, items, total,
    } = req.body || {};

    if (!reference || !amountInCents || !currency) {
      res.status(400).json({ error: 'Faltan parámetros: reference, amountInCents, currency' });
      return;
    }
    if (!name || !phone || !address) {
      res.status(400).json({ error: 'Faltan datos del cliente: nombre, teléfono o dirección' });
      return;
    }

    // Mismo orden que exige Wompi: referencia + monto_en_centavos + moneda + secreto
    const concatenated = `${reference}${amountInCents}${currency}${secret}`;
    const signature = crypto.createHash('sha256').update(concatenated).digest('hex');

    if (store.isConfigured()) {
      await store.saveOrder({
        reference,
        name,
        phone,
        email: email || '',
        address,
        items: items || [],
        total: total || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } else {
      // No interrumpimos el pago si la base de datos no está lista aún,
      // pero avisamos en los logs de Vercel para que se note.
      console.warn('[create-order] Base de datos no configurada (faltan KV_REST_API_URL / KV_REST_API_TOKEN). El pedido no se guardó.');
    }

    res.status(200).json({ signature });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando el pedido' });
  }
};
