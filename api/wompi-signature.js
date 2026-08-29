// api/wompi-signature.js
//
// Genera la firma de integridad (SHA-256) que exige Wompi para validar
// que una transacción no fue alterada, SIN exponer el secreto de
// integridad en el navegador del cliente.
//
// Configura la variable de entorno WOMPI_INTEGRITY_SECRET en el
// dashboard de Vercel (Project Settings > Environment Variables) con
// el "Secreto de integridad" que te da Wompi en:
// https://comercios.wompi.co > Desarrolladores > Secretos para integración técnica
//
// Nunca pongas ese secreto directamente en el código ni en el frontend.

const crypto = require('crypto');

// Esta API solo calcula un hash a partir de datos que el propio comprador
// controla (referencia, monto, moneda) usando el secreto que vive únicamente
// en el servidor. El hash en sí no es información sensible — sin el secreto
// nadie puede reproducirlo — así que permitimos llamadas desde cualquier
// origen. Esto evita errores de CORS al probar desde distintos dominios de
// Vercel (producción, previews, etc).
function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = (req, res) => {
  setCors(req, res);

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

    const { reference, amountInCents, currency, expirationTime } = req.body || {};

    if (!reference || !amountInCents || !currency) {
      res.status(400).json({ error: 'Faltan parámetros: reference, amountInCents, currency' });
      return;
    }

    // El orden de concatenación importa (documentación oficial de Wompi):
    // referencia + monto_en_centavos + moneda [+ fecha_expiracion] + secreto
    let concatenated = `${reference}${amountInCents}${currency}`;
    if (expirationTime) {
      concatenated += expirationTime;
    }
    concatenated += secret;

    const signature = crypto.createHash('sha256').update(concatenated).digest('hex');

    res.status(200).json({ signature });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando la firma' });
  }
};
