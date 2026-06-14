import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";

let socket = null;

export default function ChatRoom() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedCounselorId = searchParams.get("counselorId");
  const selectedCounselorName =
    searchParams.get("name") || "selected counselor";

  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | waiting | active | closed
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [starting, setStarting] = useState(false);

  const bottomRef = useRef(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    socket = io("http://localhost:8000", {
      path: "/socket.io",
      withCredentials: true,
    });

    socket.on(
      "room-created",
      ({ roomId, existing, counselorName, status: roomStatus, messages }) => {
        requestInFlightRef.current = false;
        setRoomId(roomId);
        setStatus(roomStatus === "active" ? "active" : "waiting");
        setStarting(false);
        setError("");
        setMessages(Array.isArray(messages) ? messages : []);

        if (roomStatus === "active") {
          setInfo("");
          return;
        }

        if (existing) {
          setInfo(
            `You already requested a session with ${
              counselorName || selectedCounselorName
            }. Please wait for the counselor to join.`
          );
        } else {
          setInfo(
            `Chat request sent to ${counselorName || selectedCounselorName}.`
          );
        }
      }
    );

    socket.on("counselor-joined", ({ roomId: joinedRoomId, message }) => {
      if (joinedRoomId && roomId && joinedRoomId !== roomId) return;
      setStatus("active");
      setInfo("");
      setMessages((m) => [
        ...m,
        {
          alias: "System",
          text: message,
          timestamp: new Date().toISOString(),
          system: true,
        },
      ]);
    });

    socket.on("receive-message", (msg) => {
      setMessages((m) => [...m, msg]);
    });

    socket.on("room-closed", ({ message }) => {
      requestInFlightRef.current = false;
      setStatus("closed");
      setStarting(false);
      setMessages((m) => [
        ...m,
        {
          alias: "System",
          text: message || "Chat session ended.",
          timestamp: new Date().toISOString(),
          system: true,
        },
      ]);
    });

    socket.on("room-error", ({ message }) => {
      requestInFlightRef.current = false;
      setStarting(false);
      setError(message);
      setInfo("");
      alert(message);
    });

    return () => {
      socket?.disconnect();
    };
  }, [selectedCounselorName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const requestRoom = () => {
    if (requestInFlightRef.current || starting || status === "waiting" || status === "active") {
      setInfo("Session already started.");
      return;
    }

    if (!selectedCounselorId) {
      setError("Please choose a counselor first.");
      return;
    }

    requestInFlightRef.current = true;
    setStarting(true);
    setError("");
    setInfo("");

    socket.emit("request-room", {
      counselorId: selectedCounselorId,
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();

    if (!input.trim() || !roomId || status !== "active") return;

    socket.emit("send-message", {
      roomId,
      message: input.trim(),
    });

    setInput("");
  };

  const closeRoom = () => {
    if (!roomId) return;
    socket.emit("close-room", { roomId });
  };

  return (
    <div style={S.page}>
      <BackToForum />

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ ...S.heading, fontSize: 26, marginBottom: 6 }}>
          Private Chat
        </h1>

        <p style={{ ...S.muted, marginBottom: 20 }}>
          Messages are ephemeral — they are not stored and disappear when the
          session ends.
        </p>

        {error && (
          <div
            style={{
              ...S.card,
              background: "var(--danger-soft)",
              color: "var(--danger)",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {info && (
          <div
            style={{
              ...S.card,
              background: "var(--success-soft)",
              color: "var(--success)",
              marginBottom: 16,
            }}
          >
            {info}
          </div>
        )}

        {status === "idle" && (
          <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>

            <h2 style={{ fontSize: 20, marginBottom: 8 }}>
              Request a private session
            </h2>

            {selectedCounselorId ? (
              <p style={{ ...S.muted, marginBottom: 20 }}>
                Your request will be sent only to{" "}
                <b>{selectedCounselorName}</b>.
              </p>
            ) : (
              <p style={{ ...S.muted, marginBottom: 20 }}>
                Please select a counselor before starting a chat session.
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={requestRoom}
                style={{
                  ...S.btn,
                  ...S.btnPrimary,
                  fontSize: 15,
                  padding: "11px 24px",
                  opacity:
                    !selectedCounselorId ||
                    starting ||
                    status === "waiting" ||
                    status === "active"
                      ? 0.6
                      : 1,
                  cursor:
                    !selectedCounselorId ||
                    starting ||
                    status === "waiting" ||
                    status === "active"
                      ? "not-allowed"
                      : "pointer",
                }}
                disabled={
                  !selectedCounselorId ||
                  starting ||
                  status === "waiting" ||
                  status === "active"
                }
              >
                {starting
                  ? "Starting..."
                  : status === "waiting"
                  ? "Session Requested"
                  : status === "active"
                  ? "Session Active"
                  : "Start Chat Session"}
              </button>

              {!selectedCounselorId && (
                <button
                  onClick={() => navigate("/counselors")}
                  style={{
                    ...S.btn,
                    ...S.btnSecondary,
                    fontSize: 15,
                    padding: "11px 24px",
                  }}
                >
                  Choose counselor
                </button>
              )}
            </div>
          </div>
        )}

        {status === "waiting" && (
          <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
            <div
              style={{
                fontSize: 32,
                marginBottom: 12,
                animation: "pulse 2s infinite",
              }}
            >
              ⏳
            </div>

            <h2 style={{ fontSize: 18, marginBottom: 6 }}>
              Waiting for {selectedCounselorName}…
            </h2>

            <p style={S.muted}>
              Room ID:{" "}
              <code
                style={{
                  background: "var(--surface2)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {roomId}
              </code>
            </p>

            <p style={{ ...S.muted, marginTop: 8 }}>
              Please stay on this page. The counselor will join shortly.
            </p>
          </div>
        )}

        {(status === "active" || status === "closed") && (
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                background:
                  status === "active"
                    ? "var(--counselor-soft)"
                    : "var(--surface2)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color:
                    status === "active"
                      ? "var(--counselor)"
                      : "var(--text-muted)",
                }}
              >
                {status === "active" ? "● Session active" : "Session ended"}
              </span>

              {status === "active" && (
                <button
                  onClick={closeRoom}
                  style={{
                    ...S.btn,
                    background: "none",
                    color: "var(--danger)",
                    fontSize: 12,
                    padding: "4px 10px",
                    border: "1px solid var(--danger)",
                  }}
                >
                  End session
                </button>
              )}
            </div>

            <div
              style={{
                height: 360,
                overflowY: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: m.system
                      ? "center"
                      : m.alias === (user?.alias || "Anonymous")
                      ? "right"
                      : "left",
                  }}
                >
                  {m.system ? (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        background: "var(--surface2)",
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {m.text}
                    </span>
                  ) : (
                    <div style={{ display: "inline-block", maxWidth: "75%" }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginBottom: 3,
                        }}
                      >
                        {m.alias}
                      </div>

                      <div
                        style={{
                          background:
                            m.alias === (user?.alias || "Anonymous")
                              ? "var(--accent)"
                              : "var(--surface2)",
                          color:
                            m.alias === (user?.alias || "Anonymous")
                              ? "#fff"
                              : "var(--text)",
                          padding: "9px 13px",
                          borderRadius: "var(--radius)",
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {status === "active" && (
              <form
                onSubmit={sendMessage}
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: 8,
                }}
              >
                <input
                  style={{ ...S.input, flex: 1 }}
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border)")
                  }
                />

                <button
                  type="submit"
                  style={{ ...S.btn, ...S.btnPrimary }}
                >
                  Send
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}