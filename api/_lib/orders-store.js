// api/_lib/orders-store.js
//
// Guarda y consulta los pedidos en una base de datos Redis (Upstash),
// conectada mediante la pestaña "Storage" de tu proyecto en Vercel.
//
// Al crear esa base de datos y conectarla a tu proyecto, Vercel crea
// automáticamente las variables de entorno KV_REST_API_URL y
// KV_REST_API_TOKEN — no hay que copiarlas a mano, como sí tuvimos que
// hacer con el secreto de Wompi.

const BASE_URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

function isConfigured() {
  return Boolean(BASE_URL && TOKEN);
}

async function command(cmd) {
  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function pipeline(commands) {
  const resp = await fetch(`${BASE_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  return resp.json();
}

// Guarda un pedido nuevo (estado inicial: pendiente) y lo agrega al
// índice de pedidos recientes.
async function saveOrder(order) {
  const key = `order:${order.reference}`;
  await pipeline([
    ['SET', key, JSON.stringify(order)],
    ['LPUSH', 'orders:list', order.reference],
  ]);
}

// Actualiza el estado de un pedido existente (ej. de "pending" a
// "approved") y le agrega cualquier dato extra (como el ID de la
// transacción de Wompi).
async function updateOrderStatus(reference, status, extra) {
  const key = `order:${reference}`;
  const raw = await command(['GET', key]);
  if (!raw) return null;
  const order = JSON.parse(raw);
  const updated = Object.assign({}, order, { status }, extra || {});
  await command(['SET', key, JSON.stringify(updated)]);
  return updated;
}

// Devuelve los pedidos más recientes (el más nuevo primero).
async function listOrders(limit) {
  const max = limit || 200;
  const refs = await command(['LRANGE', 'orders:list', 0, max - 1]);
  if (!refs || refs.length === 0) return [];
  const results = await pipeline(refs.map((r) => ['GET', `order:${r}`]));
  return results
    .map((r) => (r && r.result ? JSON.parse(r.result) : null))
    .filter(Boolean);
}

module.exports = { isConfigured, saveOrder, updateOrderStatus, listOrders };
