import { useNavigate, useLocation } from "react-router-dom";
import { S } from "../../styles/common";

export default function BackToForum({ label = "Back", style = {} }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div style={{ marginBottom: 18, ...style }}>
      <button
        type="button"
        onClick={goBack}
        style={{
          ...S.btn,
          ...S.btnSecondary,
          width: "fit-content",
        }}
      >
        ← {label}
      </button>
    </div>
  );
}
