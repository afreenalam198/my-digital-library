import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import libraryDoor from "../assets/library-door.jpg";
import SignInDialog from "./SignInDialog.jsx";

const IMAGE = { width: 1280, height: 720 };
const ARCH = { x: 0.426, y: 0.194, width: 0.158, height: 0.599 };

function archBox(viewWidth, viewHeight) {
  const scale = Math.max(viewWidth / IMAGE.width, viewHeight / IMAGE.height);
  const offsetX = (IMAGE.width * scale - viewWidth) / 2;
  const offsetY = (IMAGE.height * scale - viewHeight) / 2;
  return {
    left: ARCH.x * IMAGE.width * scale - offsetX,
    top: ARCH.y * IMAGE.height * scale - offsetY,
    width: ARCH.width * IMAGE.width * scale,
    height: ARCH.height * IMAGE.height * scale,
  };
}

export default function Door() {
  const navigate = useNavigate();
  const [openSide, setOpenSide] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [frame, setFrame] = useState(null);
  const roomRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    document.title = "Welcome to Afreen's Library";
    return () => window.clearTimeout(timer.current);
  }, []);

  useLayoutEffect(() => {
    const room = roomRef.current;
    if (!room) return undefined;
    const place = () => {
      setFrame(archBox(room.clientWidth, room.clientHeight));
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(room);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  function openDoor(side) {
    if (openSide) return;
    setOpenSide(side);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = window.setTimeout(() => {
      navigate(side === "left" ? "/tbr" : "/read");
    }, reduce ? 0 : 720);
  }

  return (
    <main className="door-room" ref={roomRef} style={{ backgroundImage: `url(${libraryDoor})` }}>
      <button type="button" className="welcome-sign" onClick={() => setSigningIn(true)}>
        Welcome to Afreen's Library
      </button>
      {signingIn ? <SignInDialog onClose={() => setSigningIn(false)} /> : null}
      <div
        className="door-frame"
        style={
          frame
            ? {
                left: `${frame.left}px`,
                top: `${frame.top}px`,
                width: `${frame.width}px`,
                height: `${frame.height}px`,
              }
            : undefined
        }
      >
        <button
          type="button"
          className={openSide === "left" ? "door left is-open" : "door left"}
          aria-label="Left door, To Be Read"
          onClick={() => openDoor("left")}
        >
          <DoorFace sign={<>To Be<br />Read</>} />
        </button>
        <button
          type="button"
          className={openSide === "right" ? "door right is-open" : "door right"}
          aria-label="Right door, Books I've Read"
          onClick={() => openDoor("right")}
        >
          <DoorFace sign={<>Books<br />I've Read</>} />
        </button>
      </div>
    </main>
  );
}

function DoorFace({ sign }) {
  return (
    <>
      <span className="plaque-hanger" aria-hidden="true">
        <span className="plaque-nail" />
        <svg className="plaque-rope" viewBox="0 0 120 46" aria-hidden="true">
          <path d="M60 4 C46 18 28 32 14 44" />
          <path d="M60 4 C74 18 92 32 106 44" />
          <path className="rope-twist" d="M60 4 C46 18 28 32 14 44" />
          <path className="rope-twist" d="M60 4 C74 18 92 32 106 44" />
        </svg>
        <span className="plaque">{sign}</span>
      </span>
      <span className="knob" aria-hidden="true" />
    </>
  );
}
