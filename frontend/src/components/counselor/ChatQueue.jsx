import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../../api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";

let socket = null;

export default function ChatQueue() {
  const { user } = useAuthStore();
  const [waitingRooms, setWaitingRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionStatus, setSessionStatus] = useState("browsing");
  const [crisisAlerts, setCrisisAlerts] = useState([]);
  const bottomRef = useRef(null);
  const activeRoomRef = useRef(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const addWaitingRoom = (room) => {
    if (!room?.roomId) return;

    setWaitingRooms((rooms) => [
      room,
      ...rooms.filter((r) => r.roomId !== room.roomId),
    ]);
  };

  const removeWaitingRoom = (roomId) => {
    setWaitingRooms((rooms) => rooms.filter((r) => r.roomId !== roomId));
  };

  useEffect(() => {
    socket = io("https://anonymous-mental-health-forum.onrender.com", {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const loadWaitingRooms = async () => {
      try {
        const { data } = await api.get("/chat-api/waiting");
        const rooms = (data.rooms || []).filter((room) => room?.roomId);
        setWaitingRooms(rooms);
      } catch {
        setWaitingRooms([]);
      }
    };

    loadWaitingRooms();
    socket.on("connect", loadWaitingRooms);

    // Small safety refresh: if the counselor opened/refreshed the dashboard
    // after the student already requested, the waiting session still appears.
    const refreshTimer = setInterval(loadWaitingRooms, 4000);

    socket.on("room-waiting", (room) => {
      addWaitingRoom(room);
    });

    socket.on("room-removed", ({ roomId }) => {
      removeWaitingRoom(roomId);
    });

    socket.on("crisis-alert", (payload) => {
      setCrisisAlerts((prev) => [payload, ...prev].slice(0, 5));
    });

    socket.on("room-joined", ({ roomId, messages }) => {
      setActiveRoom(roomId);
      setSessionStatus("active");
      removeWaitingRoom(roomId);
      setMessages(Array.isArray(messages) ? messages : []);
    });

    socket.on("receive-message", (msg) => {
      setMessages((m) => [...m, msg]);
    });

    socket.on("room-closed", ({ roomId, message }) => {
      removeWaitingRoom(roomId);

      if (activeRoomRef.current === roomId) {
        setSessionStatus("closed");
        setMessages((m) => [
          ...m,
          {
            alias: "System",
            text: message || "Chat session ended.",
            system: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });

    socket.on("room-error", ({ message }) => {
      alert(message);
    });

    return () => {
      clearInterval(refreshTimer);
      socket?.off("connect", loadWaitingRooms);
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = (roomId) => {
    socket.emit("join-room", { roomId });
  };

  const sendMessage = (e) => {
    e.preventDefault();

    if (!input.trim() || !activeRoom) return;

    socket.emit("send-message", {
      roomId: activeRoom,
      message: input.trim(),
    });

    setInput("");
  };

  const closeRoom = () => {
    if (!activeRoom) return;
    socket.emit("close-room", { roomId: activeRoom });
  };

  return (
    <div style={S.page}>
      <BackToForum />

      <h1 style={{ ...S.heading, fontSize: 26, marginBottom: 20 }}>
        Counselor Dashboard
      </h1>

      {sessionStatus === "browsing" && (
        <>
          {crisisAlerts.length > 0 && (
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {crisisAlerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    ...S.card,
                    background: "var(--crisis-soft)",
                    border: "1px solid var(--crisis-border)",
                    color: "var(--crisis)",
                  }}
                >
                  🚨 Crisis alert: {alert.message} — Severity:{" "}
                  <b>{alert.severity}</b>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              ...S.card,
              marginBottom: 20,
              background: "var(--counselor-soft)",
              border: "1px solid var(--counselor-border)",
            }}
          >
            <p style={{ color: "var(--counselor)", fontWeight: 500 }}>
              Welcome, {user?.counselorProfile?.name || user?.alias}. Students
              assigned to you appear below.
            </p>
          </div>

          {waitingRooms.length === 0 ? (
            <div
              style={{
                ...S.card,
                textAlign: "center",
                padding: 48,
                color: "var(--text-muted)",
              }}
            >
              No students waiting right now. This page updates automatically.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {waitingRooms.map((room) => (
                <div
                  key={room.roomId}
                  style={{
                    ...S.card,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {room.userAlias || "Anonymous student"}
                    </div>

                    <div style={{ ...S.muted }}>
                      Room: {room.roomId.slice(0, 8)}…
                    </div>

                    {room.createdAt && (
                      <div style={{ ...S.muted, fontSize: 12 }}>
                        Waiting since:{" "}
                        {new Date(room.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => joinRoom(room.roomId)}
                    style={{ ...S.btn, ...S.btnSuccess }}
                  >
                    Join session
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(sessionStatus === "active" || sessionStatus === "closed") && (
        <div
          style={{
            ...S.card,
            padding: 0,
            overflow: "hidden",
            maxWidth: 640,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background:
                sessionStatus === "active"
                  ? "var(--counselor-soft)"
                  : "var(--surface2)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color:
                  sessionStatus === "active"
                    ? "var(--counselor)"
                    : "var(--text-muted)",
              }}
            >
              {sessionStatus === "active" ? "● Active session" : "Session ended"}
            </span>

            {sessionStatus === "active" && (
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
              <div key={i} style={{ textAlign: m.system ? "center" : "left" }}>
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
                        background: "var(--surface2)",
                        color: "var(--text)",
                        padding: "9px 13px",
                        borderRadius: "var(--radius)",
                        fontSize: 14,
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

          {sessionStatus === "active" && (
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
                placeholder="Respond to the student…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />

              <button type="submit" style={{ ...S.btn, ...S.btnSuccess }}>
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}