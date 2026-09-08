/** Wraps the browser print handshake so controllers never touch `window` directly. */
export class PrintService {
  private readonly renderDelayMs = 120;
  private readonly fallbackResetMs = 60_000;

  /**
   * Opens the print dialog once the print sheet has had a frame to render.
   * `onFinished` runs after printing, and again on a timer in case the
   * browser never fires `afterprint`.
   */
  print(onFinished: () => void) {
    window.addEventListener("afterprint", onFinished, { once: true });
    window.setTimeout(() => {
      window.print();
      window.setTimeout(onFinished, this.fallbackResetMs);
    }, this.renderDelayMs);
  }
}

export const printService = new PrintService();
