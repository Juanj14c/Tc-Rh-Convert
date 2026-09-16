"use client";

import { useRef, useState } from "react";
import {
  Bot,
  FileText,
  Paperclip,
  Reply,
  Send,
  X,
  Mic,
  MicOff,
} from "lucide-react";

import OliviaModal from "./OliviaModal";
import type {
  MessageAttachment,
  MessageReply,
} from "./MessageList";

import type { ChatMode } from "./conversationData";

interface MessageComposerProps {
  disabled?: boolean;
  isAdmin: boolean;
  chatMode: ChatMode;
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
  chatMode,
  replyTo = null,
  onCancelReply,
  onSendMessage,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");

  const [selectedAttachment, setSelectedAttachment] =
    useState<MessageAttachment | null>(null);

  const [isOliviaOpen, setIsOliviaOpen] = useState(false);

  const [attachmentError, setAttachmentError] = useState("");

  // =========================
  // GRABACIÓN DE VOZ
  // =========================

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceError, setVoiceError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const recordingTimerRef = useRef<number | null>(null);

  // =========================
  // MENSAJES
  // =========================

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage && !selectedAttachment) {
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

  // =========================
  // ARCHIVOS
  // =========================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAttachmentError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setAttachmentError(
          "No fue posible cargar el archivo.",
        );

        return;
      }

      const attachment: MessageAttachment = {
        type: file.type.startsWith("image/")
          ? "image"
          : "file",
        name: file.name,
        size: file.size,
        url: reader.result,
        mimeType: file.type,
      };

      setSelectedAttachment(attachment);
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

  // =========================
  // GRABACIÓN DE VOZ
  // =========================

  const handleStartRecording = async () => {
    if (disabled || isRecording) {
      return;
    }

    setVoiceError("");
    setRecordingTime(0);

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setVoiceError(
        "Tu navegador no permite acceder al micrófono.",
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus",
        )
      ) {
        mimeType = "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        mimeType = "audio/webm";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/ogg;codecs=opus",
        )
      ) {
        mimeType = "audio/ogg;codecs=opus";
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (
        event: BlobEvent,
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              mediaRecorder.mimeType ||
              "audio/webm",
          },
        );

        console.log("Audio grabado:", audioBlob);
        console.log("Tipo:", audioBlob.type);
        console.log(
          "Tamaño:",
          formatFileSize(audioBlob.size),
        );

        // Por ahora solo probamos que el audio se grabe.
        // Después este Blob se enviará al backend
        // para transcribirlo.

        stream
          .getTracks()
          .forEach((track) => track.stop());

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = () => {
        setVoiceError(
          "Ocurrió un error al grabar el audio.",
        );

        stream
          .getTracks()
          .forEach((track) => track.stop());

        setIsRecording(false);
      };

      mediaRecorder.start();

      setIsRecording(true);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(
          (currentTime) => currentTime + 1,
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Error accediendo al micrófono:",
        error,
      );

      setVoiceError(
        "No fue posible acceder al micrófono. Revisa los permisos del navegador.",
      );
    }
  };

  const handleStopRecording = () => {
    const mediaRecorder =
      mediaRecorderRef.current;

    if (
      !mediaRecorder ||
      mediaRecorder.state === "inactive"
    ) {
      return;
    }

    mediaRecorder.stop();

    setIsRecording(false);

    if (recordingTimerRef.current !== null) {
      window.clearInterval(
        recordingTimerRef.current,
      );

      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (
    seconds: number,
  ) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0",
    )}:${String(remainingSeconds).padStart(
      2,
      "0",
    )}`;
  };

  // =========================
  // UI
  // =========================

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
              {selectedAttachment.type === "image" ? (
                <img
                  src={selectedAttachment.url}
                  alt={selectedAttachment.name}
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
              onClick={handleRemoveAttachment}
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

        {voiceError && (
          <div className="message-composer__attachment-error">
            {voiceError}
          </div>
        )}

        <div className="message-composer__row">
          <button
            type="button"
            className="message-composer__attach"
            aria-label="Adjuntar archivo"
            title="Adjuntar archivo"
            disabled={disabled || isRecording}
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
            disabled={disabled || isRecording}
            onClick={() =>
              setIsOliviaOpen(true)
            }
          >
            <Bot size={19} />
          </button>

          {isRecording ? (
            <div className="message-composer__recording">
              <span className="message-composer__recording-dot" />

              <span>
                Grabando{" "}
                {formatRecordingTime(
                  recordingTime,
                )}
              </span>
            </div>
          ) : (
            <input
              className="message-composer__input"
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
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
          )}

          {isRecording ? (
            <button
              type="button"
              className="message-composer__send"
              aria-label="Detener grabación"
              title="Detener grabación"
              onClick={handleStopRecording}
            >
              <MicOff size={19} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="message-composer__attach"
                aria-label="Grabar mensaje de voz"
                title="Grabar mensaje de voz"
                disabled={
                  disabled || !!message.trim()
                }
                onClick={
                  handleStartRecording
                }
              >
                <Mic size={19} />
              </button>

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
            </>
          )}
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