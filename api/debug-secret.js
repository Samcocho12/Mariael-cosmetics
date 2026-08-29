// api/debug-secret.js
//
// ⚠️ ENDPOINT TEMPORAL SOLO PARA DIAGNÓSTICO.
// No expone el secreto completo, solo su longitud y unos pocos caracteres,
// para verificar que se guardó correctamente en Vercel.
// BÓRRALO (o borra este archivo) una vez resuelto el problema.

module.exports = (req, res) => {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) {
    res.status(200).json({ configured: false });
    return;
  }
  res.status(200).json({
    configured: true,
    length: secret.length,
    starts_with: secret.slice(0, 14),
    ends_with: secret.slice(-4),
    has_leading_or_trailing_space: secret !== secret.trim(),
  });
};
