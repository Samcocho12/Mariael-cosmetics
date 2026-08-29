# Mariael Cosmetics — Tienda completa (catálogo + carrito + pago Wompi)

Todo en un solo proyecto: el catálogo público, el carrito de compras, y la
función que genera la firma de integridad de Wompi de forma segura.

## Estructura

```
public/
  index.html      ← el catálogo con carrito y botón de pago
  logo.jpg
  images/         ← las 35 fotos de productos
api/
  wompi-signature.js  ← genera la firma de integridad (usa el secreto)
package.json
```

## Pasos para publicarlo (de una sola vez)

### 1. Crea el repositorio en GitHub

- Ve a github.com → **New repository**.
- Nómbralo, por ejemplo, `mariael-tienda`.
- Márcalo como **público**.
- Créalo **vacío** (sin README, sin .gitignore).

### 2. Sube TODO el contenido de esta carpeta

- Entra al repositorio recién creado → **Add file > Upload files**.
- Arrastra las carpetas `api/` y `public/`, y el archivo `package.json`,
  tal cual están aquí (respetando la estructura de carpetas).
- Confirma el commit.

### 3. Importa el proyecto en Vercel

- Ve a [vercel.com](https://vercel.com) → **Add New... > Project**.
- Selecciona el repositorio `mariael-tienda`.

### 4. Configura la variable de entorno ANTES de desplegar

- En la pantalla de importación, abre **Environment Variables**.
- Key: `WOMPI_INTEGRITY_SECRET`
- Value: pega el secreto de integridad de Wompi (dashboard de comercios →
  Desarrolladores → Secretos para integración técnica → Integridad →
  Mostrar → copiar). Debe empezar con `test_integrity_` (modo pruebas).
- **Consejo para copiar sin errores**: en vez de seleccionar el texto a
  mano, usa el botón de copiar (ícono de portapapeles) si el dashboard de
  Wompi lo tiene junto al campo. Pega directo con Ctrl+V sin escribir nada
  extra antes o después.
- Marca los 3 entornos (Production, Preview, Development).
- Dale clic en **Deploy**.

### 5. Anota tu dominio de producción

- Cuando termine, Vercel te da una URL fija, por ejemplo:
  `https://mariael-tienda.vercel.app`
- **Usa siempre esta URL** (la que aparece en Project Settings > Domains
  como dominio principal) para probar y para compartir con tus clientes.
  Evita usar los links que terminan en `-git-main-tuusuario.vercel.app`
  (esos son "previews" y pueden comportarse distinto).

### 6. Pon tu llave pública real

- Abre `public/index.html` en GitHub (botón de lápiz para editar).
- Busca la línea:
  ```js
  const WOMPI_PUBLIC_KEY = 'pub_test_...';
  ```
- Reemplázala por tu llave pública real (la de `pub_test_` para pruebas,
  o `pub_prod_` cuando vayas a cobrar de verdad).
- Guarda (commit). Vercel vuelve a desplegar solo.

### 7. Prueba el pago

- Abre tu dominio de producción.
- Agrega un producto al carrito → **Pagar con Wompi**.
- Usa la tarjeta de prueba: `4242 4242 4242 4242`, fecha futura cualquiera,
  CVC `123`.
- Debe salir **"Pago aprobado"**.

## Si algo falla

Revisa la consola del navegador (F12 → Console) y la pestaña **Network**
filtrando por `wompi-signature` — el estado (status code) y la respuesta
ahí dicen exactamente qué pasó:

- **"La firma es inválida"** → el secreto guardado en Vercel no coincide
  con el de Wompi (revisa que no tenga espacios extra, o que sea del
  ambiente correcto: test vs prod).
- **CORS error** → no debería pasar con este proyecto (la función ya
  acepta cualquier origen), pero si pasa, confirma que subiste
  `api/wompi-signature.js` tal cual está aquí.
- **404 en /api/wompi-signature** → revisa que la carpeta `api/` esté en
  la raíz del repositorio (no dentro de `public/`).
