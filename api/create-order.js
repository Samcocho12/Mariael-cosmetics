// api/create-order.js
//
// Se llama cuando el cliente toca "Enviar pedido por WhatsApp".
// Guarda el pedido (cliente, dirección, productos) en la base de datos
// para que aparezca en tu dashboard de /admin.html, y luego la tienda
// abre WhatsApp con el pedido ya escrito.
//
// Si la base de datos no está configurada, el pedido igual se envía por
// WhatsApp; solo no queda registrado en el dashboard.

const store = require('./_lib/orders-store');

// Limpia texto para que nadie pueda meter HTML/código en el dashboard.
function clean(value, max) {
  return String(value == null ? '' : value)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max || 200);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const body = req.body || {};
    const reference = clean(body.reference, 60);
    const name = clean(body.name, 100);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 120);
    const address = clean(body.address, 250);
    const note = clean(body.note, 400);

    if (!reference || !name || !phone || !address) {
      res.status(400).json({ error: 'Faltan datos del cliente: nombre, teléfono o dirección' });
      return;
    }

    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 100).map((i) => ({
      ref: clean(i.ref, 20),
      name: clean(i.name, 120),
      qty: Math.max(1, Math.min(999, parseInt(i.qty, 10) || 1)),
      price: Math.max(0, Number(i.price) || 0),
    }));
    if (items.length === 0) {
      res.status(400).json({ error: 'El pedido no tiene productos' });
      return;
    }
    const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

    if (!store.isConfigured()) {
      console.warn('[create-order] Base de datos no configurada (faltan KV_REST_API_URL / KV_REST_API_TOKEN). El pedido no se guardó.');
      res.status(200).json({ saved: false });
      return;
    }

    await store.saveOrder({
      reference,
      name,
      phone,
      email,
      address,
      note,
      items,
      total,
      status: 'whatsapp',
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando el pedido' });
  }
};
