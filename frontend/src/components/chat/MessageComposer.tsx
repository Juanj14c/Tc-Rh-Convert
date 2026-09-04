import { useRef, useState } from "react";
import {
  Bot,
  FileText,
  Paperclip,
  Reply,
  Send,
  X,
} from "lucide-react";

import OliviaModal from "./OliviaModal";
import type {
  MessageAttachment,
  MessageReply,
} from "./MessageList";

interface MessageComposerProps {
  disabled?: boolean;
  isAdmin: boolean;
  replyTo?: MessageReply | null;
  onCancelReply: () => void;
  onSendMessage: (
    text: string,
    
    attachment?: MessageAttachment,
    replyTo?: MessageReply,
  ) => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageComposer({
  disabled = false,
  isAdmin,
  replyTo = null,
  onCancelReply,
  onSendMessage,
}: MessageComposerProps) {
  const [message, setMessage] =
    useState("");

  const [
    selectedAttachment,
    setSelectedAttachment,
  ] = useState<MessageAttachment | null>(
    null,
  );

  const [isOliviaOpen, setIsOliviaOpen] =
    useState(false);

  const [attachmentError, setAttachmentError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (
      !cleanMessage &&
      !selectedAttachment
    ) {
      return;
    }

    if (disabled) {
      return;
    }

    onSendMessage(
      cleanMessage,
      selectedAttachment ?? undefined,
      replyTo ?? undefined,
    );

    setMessage("");
    setSelectedAttachment(null);
    setAttachmentError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onCancelReply();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setAttachmentError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result !==
        "string"
      ) {
        setAttachmentError(
          "No fue posible cargar el archivo.",
        );

        return;
      }

      const attachment: MessageAttachment = {
        type: file.type.startsWith(
          "image/",
        )
          ? "image"
          : "file",
        name: file.name,
        size: file.size,
        url: reader.result,
        mimeType: file.type,
      };

      setSelectedAttachment(
        attachment,
      );
    };

    reader.onerror = () => {
      setAttachmentError(
        "No fue posible cargar el archivo.",
      );
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setSelectedAttachment(null);
    setAttachmentError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <form
        className="message-composer"
        onSubmit={handleSubmit}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileChange}
        />

        {replyTo && (
          <div className="message-composer__reply">
            <div className="message-composer__reply-icon">
              <Reply size={17} />
            </div>

            <div className="message-composer__reply-info">
          <strong>
            {replyTo.sender ===
            (isAdmin ? "tyc" : "employee")
              ? "Tu mensaje"
              : isAdmin
                ? "Caso anónimo"
                : "T&C"}
          </strong>

              <span>{replyTo.text}</span>
            </div>

            <button
              type="button"
              className="message-composer__reply-close"
              onClick={onCancelReply}
              aria-label="Cancelar respuesta"
              title="Cancelar respuesta"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {selectedAttachment && (
          <div className="message-composer__attachment">
            <div className="message-composer__attachment-preview">
              {selectedAttachment.type ===
              "image" ? (
                <img
                  src={
                    selectedAttachment.url
                  }
                  alt={
                    selectedAttachment.name
                  }
                />
              ) : (
                <FileText size={19} />
              )}
            </div>

            <div className="message-composer__attachment-info">
              <strong>
                {selectedAttachment.name}
              </strong>

              <span>
                {formatFileSize(
                  selectedAttachment.size,
                )}
              </span>
            </div>

            <button
              type="button"
              className="message-composer__attachment-remove"
              onClick={
                handleRemoveAttachment
              }
              aria-label="Quitar archivo adjunto"
              title="Quitar archivo"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {attachmentError && (
          <div className="message-composer__attachment-error">
            {attachmentError}
          </div>
        )}

        <div className="message-composer__row">
          <button
            type="button"
            className="message-composer__attach"
            aria-label="Adjuntar archivo"
            title="Adjuntar archivo"
            disabled={disabled}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <Paperclip size={19} />
          </button>

          <button
            type="button"
            className="message-composer__olivia"
            aria-label="Consultar OlivIA"
            title="Consultar OlivIA"
            disabled={disabled}
            onClick={() =>
              setIsOliviaOpen(true)
            }
          >
            <Bot size={19} />
          </button>

          <input
            className="message-composer__input"
            type="text"
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value,
              )
            }
            placeholder={
              disabled
                ? "Selecciona una conversación..."
                : replyTo
                  ? "Escribe una respuesta..."
                  : "Escribe un mensaje..."
            }
            aria-label="Escribir mensaje"
            disabled={disabled}
          />

          <button
            type="submit"
            className="message-composer__send"
            aria-label="Enviar mensaje"
            disabled={
              disabled ||
              (!message.trim() &&
                !selectedAttachment)
            }
          >
            <Send size={19} />
          </button>
        </div>
      </form>

      <OliviaModal
        isOpen={isOliviaOpen}
        onClose={() =>
          setIsOliviaOpen(false)
        }
      />
    </>
  );
}

export default MessageComposer;