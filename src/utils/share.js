export const APP_URL = "https://alexbr784.github.io/precioenergia/";

/**
 * Comparte un texto con el menú del sistema (WhatsApp, Telegram…) y, donde no
 * existe (la mayoría de navegadores de escritorio), lo copia al portapapeles.
 *
 * Devuelve "shared", "copied", "cancelled" o "failed" para que el botón diga
 * qué ha pasado.
 */
export const shareText = async ({ title, text, url = APP_URL }) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
      // Si el sistema falla, se intenta copiar.
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
};
