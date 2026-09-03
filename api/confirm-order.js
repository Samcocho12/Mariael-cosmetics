// api/confirm-order.js
//
// El navegador llama a esta función cuando Wompi redirige de vuelta a la
// tienda después del pago (la URL trae ?id=<id_de_la_transacción>).
//
// Nunca confiamos únicamente en lo que dice la URL (alguien podría
// escribir a mano "?id=..." con datos falsos): en vez de eso, con ese id
// le preguntamos directamente al API de Wompi cuál es el estado real de
// la transacción, y solo entonces actualizamos el pedido guardado.
//
// Necesita la variable de entorno WOMPI_PUBLIC_KEY (la misma llave
// pública que ya usas en public/index.html) para saber a qué ambiente
// preguntarle (Sandbox o Producción) y autenticar la consulta.

const store = require('./_lib/orders-store');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    if (!publicKey) {
      res.status(500).json({ error: 'Falta configurar WOMPI_PUBLIC_KEY en Vercel' });
      return;
    }

    const id = (req.query && req.query.id) || '';
    if (!id) {
      res.status(400).json({ error: 'Falta el parámetro id' });
      return;
    }

    const isProd = publicKey.startsWith('pub_prod_');
    const baseUrl = isProd ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';

    const wompiResp = await fetch(`${baseUrl}/transactions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${publicKey}` },
    });
    const wompiData = await wompiResp.json();

    if (!wompiResp.ok || !wompiData.data) {
      console.error('[confirm-order] Wompi respondió con error:', wompiResp.status, wompiData);
      res.status(502).json({ error: 'No se pudo verificar la transacción con Wompi' });
      return;
    }

    const tx = wompiData.data;
    const status = String(tx.status || '').toUpperCase();

    let updated = null;
    if (store.isConfigured()) {
      updated = await store.updateOrderStatus(tx.reference, status.toLowerCase(), {
        wompiTransactionId: tx.id,
      });
    }

    res.status(200).json({
      status,
      reference: tx.reference,
      statusMessage: tx.status_message || '',
      saved: Boolean(updated),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error confirmando el pedido' });
  }
};
