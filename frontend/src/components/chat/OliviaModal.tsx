import { useState } from "react";
import { AlertCircle, Bot, Check, Copy, Loader2, X } from "lucide-react";

interface OliviaResult {
  summary: string;
  recommendation: string;
  suggestedResponse: string;
}

interface OliviaModalProps {
  isOpen: boolean;
  onClose: () => void;

  isLoading?: boolean;
  error?: string | null;

  result?: OliviaResult | null;

  onRetry?: () => void;
}

function OliviaModal({
  isOpen,
  onClose,
  isLoading = false,
  error = null,
  result = null,
  onRetry,
}: OliviaModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    if (!result?.suggestedResponse) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.suggestedResponse);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="olivia-modal-overlay" onClick={onClose}>
      <div
        className="olivia-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="olivia-modal__header">
          <div className="olivia-modal__title">
            <div className="olivia-modal__icon">
              <Bot size={20} />
            </div>

            <div>
              <span>Asistente T&C</span>
              <h2>OlivIA</h2>
            </div>
          </div>

          <button
            type="button"
            className="olivia-modal__close"
            onClick={onClose}
            aria-label="Cerrar OlivIA"
          >
            <X size={20} />
          </button>
        </header>

        <div className="olivia-modal__body">
          {isLoading && (
            <div className="olivia-modal__loading">
              <Loader2 size={24} className="olivia-modal__spinner" />

              <div>
                <strong>OlivIA está analizando el caso</strong>
                <p>
                  Estamos revisando la conversación para generar una
                  recomendación adecuada.
                </p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="olivia-modal__error">
              <AlertCircle size={20} />

              <div>
                <strong>No fue posible obtener el análisis</strong>

                <p>{error}</p>

                {onRetry && (
                  <button
                    type="button"
                    className="olivia-modal__retry"
                    onClick={onRetry}
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && result && (
            <>
              <div className="olivia-modal__section">
                <span>Resumen del caso</span>

                <p>{result.summary}</p>
              </div>

              <div className="olivia-modal__section">
                <span>Recomendación</span>

                <p>{result.recommendation}</p>
              </div>

              <div className="olivia-modal__section">
                <div className="olivia-modal__section-heading">
                  <span>Respuesta sugerida</span>

                  <button
                    type="button"
                    className="olivia-modal__copy"
                    onClick={handleCopy}
                    aria-label="Copiar respuesta sugerida"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="olivia-modal__suggestion">
                  {result.suggestedResponse}
                </div>
              </div>
            </>
          )}

          {!isLoading && !error && !result && (
            <div className="olivia-modal__empty">
              <Bot size={28} />

              <h3>Listo para analizar</h3>

              <p>
                Cuando OlivIA reciba la conversación, aquí aparecerán
                el resumen, la recomendación y una respuesta sugerida.
              </p>
            </div>
          )}
        </div>

        <footer className="olivia-modal__footer">
          <button
            type="button"
            className="olivia-modal__cancel"
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default OliviaModal;