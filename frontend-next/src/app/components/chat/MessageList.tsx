"use client";

import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";

import type {
  ChatMode,
  Conversation,
} from "./conversationData";

const companyLogo = "/assets/brand/simbolo_claro.png";

export interface MessageAttachment {
  type: "image" | "file";
  name: string;
  size: number;
  url: string;
  mimeType: string;
}

export interface MessageReply {
  messageId: number;
  text: string;
  sender: "employee" | "tyc";
}

export interface Message {
  id: number;
  sender: "employee" | "tyc";
  text: string;
  time: string;
  date: string;
  status?: "sent" | "delivered" | "read";
  attachment?: MessageAttachment;
  replyTo?: MessageReply;
}

interface MessageListProps {
  conversation: Conversation | null;
  messages: Message[];
  isAdmin: boolean;
  chatMode: ChatMode;
  onReply: (message: Message) => void;
}

function getDateLabel(date: string) {
  const messageDate = new Date(`${date}T00:00:00`);

  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    messageDate.toDateString() === today.toDateString();

  const isYesterday =
    messageDate.toDateString() ===
    yesterday.toDateString();

  if (isToday) {
    return "Hoy";
  }

  if (isYesterday) {
    return "Ayer";
  }

  return messageDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function getReplyLabel(
  sender: "employee" | "tyc",
  isAdmin: boolean,
  chatMode: ChatMode,
) {
  const ownSender = isAdmin ? "tyc" : "employee";

  if (sender === ownSender) {
    return "Tu mensaje";
  }

  if (chatMode === "anonymous") {
    return isAdmin ? "Caso anónimo" : "T&C";
  }

  return isAdmin ? "Empleado" : "T&C";
}

export default function MessageList({
  conversation,
  messages,
  isAdmin,
  chatMode,
  onReply,
}: MessageListProps) {
  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [conversation?.id, messages]);

  if (!conversation) {
    return (
      <div className="message-list message-list--welcome">
        <div className="message-list__welcome">
          <div className="message-list__welcome-logo">
            <img
              src={companyLogo}
              alt="Convertia"
            />
          </div>

          <span className="message-list__welcome-eyebrow">
            Talento & Cultura
          </span>

          <h3>Centro T&C</h3>

          <p>
            Selecciona un caso desde el panel de
            conversaciones para comenzar la atención.
          </p>

          <span className="message-list__welcome-note">
            Atención anónima y confidencial
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      <div className="message-list__messages">
        {messages.map((message, index) => {
          const isSent = isAdmin
            ? message.sender === "tyc"
            : message.sender === "employee";

          const previousMessage =
            messages[index - 1];

          const shouldShowDate =
            !previousMessage ||
            previousMessage.date !== message.date;

          return (
            <div key={message.id}>
              {shouldShowDate && (
                <div className="message-list__date-divider">
                  <span>
                    {getDateLabel(message.date)}
                  </span>
                </div>
              )}

              <div
                className={`message-row ${
                  isSent
                    ? "message-row--sent"
                    : "message-row--received"
                }`}
              >
                <div className="message-bubble-wrapper">
                  <div className="message-bubble">
                    {message.replyTo && (
                      <div className="message-bubble__reply-preview">
                        <span>
                          {getReplyLabel(
                            message.replyTo.sender,
                            isAdmin,
                            chatMode,
                          )}
                        </span>

                        <p>
                          {message.replyTo.text}
                        </p>
                      </div>
                    )}

                    {message.attachment && (
                      <>
                        {message.attachment.type ===
                        "image" ? (
                          <a
                            href={message.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="message-attachment message-attachment--image"
                          >
                            <img
                              src={
                                message.attachment.url
                              }
                              alt={
                                message.attachment.name
                              }
                            />
                          </a>
                        ) : (
                          <a
                            href={message.attachment.url}
                            download={
                              message.attachment.name
                            }
                            className="message-attachment message-attachment--file"
                          >
                            <FileText size={21} />

                            <span className="message-attachment__info">
                              <strong>
                                {message.attachment.name}
                              </strong>

                              <small>
                                {formatFileSize(
                                  message.attachment.size,
                                )}
                              </small>
                            </span>
                          </a>
                        )}
                      </>
                    )}

                    {message.text && (
                      <p>{message.text}</p>
                    )}

                    <div className="message-bubble__meta">
                      <span className="message-bubble__time">
                        {message.time}
                      </span>

                      {isSent && (
                        <span
                          className={`message-bubble__status message-bubble__status--${
                            message.status ?? "sent"
                          }`}
                          aria-label={
                            message.status === "read"
                              ? "Mensaje leído"
                              : message.status ===
                                  "delivered"
                                ? "Mensaje entregado"
                                : "Mensaje enviado"
                          }
                        >
                          {message.status === "sent"
                            ? "✓"
                            : "✓✓"}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="message-bubble__reply"
                    onClick={() => onReply(message)}
                    aria-label="Responder a este mensaje"
                    title="Responder"
                  >
                    ↩
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div
          ref={messagesEndRef}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}