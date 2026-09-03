// api/orders.js
//
// Devuelve la lista de pedidos guardados. Lo usa tu dashboard privado en
// /admin.html.
//
// Protegido con una contraseña simple: configura la variable de entorno
// ADMIN_PASSWORD en Vercel con la contraseña que quieras usar para
// entrar al dashboard. Se envía en el header "x-admin-password".

const store = require('./_lib/orders-store');

module.exports = async (req, res) => {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      res.status(500).json({ error: 'Falta configurar ADMIN_PASSWORD en Vercel' });
      return;
    }

    const provided = req.headers['x-admin-password'];
    if (provided !== adminPassword) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    if (!store.isConfigured()) {
      res.status(500).json({ error: 'Base de datos no configurada (faltan KV_REST_API_URL / KV_REST_API_TOKEN)' });
      return;
    }

    const orders = await store.listOrders(300);
    res.status(200).json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo los pedidos' });
  }
};
