import { useEffect, useRef, useState } from "react";
import { CameraOff, ScanBarcode, Search, SearchX, Zap } from "lucide-react";
import { lookupBarcode } from "../../api/foods";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { EmptyState, ScreenHeader } from "../../components/ui";
import { Portion } from "./Portion";
import { QuickAdd } from "./QuickAdd";
import { foodToLoggable } from "../../types/loggable";

// The Shape Detection API isn't in TypeScript's DOM lib yet.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

type CamState = "starting" | "on" | "unsupported" | "denied";

/** "Ler código de barras" — camera scan where the browser supports it, else type the code. */
export function Barcode({ mealId }: { mealId?: number }) {
  const { t } = useLang();
  const nav = useNav();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cam, setCam] = useState<CamState>(() => (window.BarcodeDetector ? "starting" : "unsupported"));
  const [code, setCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const handled = useRef(false);

  const lookup = async (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length < 6 || looking) return;
    setLooking(true);
    setNotFound(null);
    try {
      const food = await lookupBarcode(clean);
      nav.replace(<Portion item={foodToLoggable(food)} mealId={mealId} />);
    } catch {
      setNotFound(clean);
      handled.current = false;
    } finally {
      setLooking(false);
    }
  };

  useEffect(() => {
    if (!window.BarcodeDetector) return;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((tr) => tr.stop());
        stream = s;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = s;
        void v.play();
        setCam("on");
        const scan = async () => {
          if (stopped) return;
          try {
            if (!handled.current && v.readyState >= 2) {
              const found = await detector.detect(v);
              if (found[0]?.rawValue) {
                handled.current = true;
                setCode(found[0].rawValue);
                void lookup(found[0].rawValue);
              }
            }
          } catch {
            /* a frame that couldn't be read — try the next one */
          }
          timer = window.setTimeout(scan, 350);
        };
        void scan();
      })
      .catch(() => setCam("denied"));

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // lookup is stable enough for a scan loop; re-running would restart the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page bare">
      <ScreenHeader title={t("barcode.title")} subtitle={t("barcode.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />

      {cam === "starting" || cam === "on" ? (
        <div className="card flush" style={{ aspectRatio: "4 / 3", background: "#000", position: "relative" }}>
          <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              inset: "28% 12%",
              border: "3px solid rgba(255,255,255,0.9)",
              borderRadius: 16,
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        <EmptyState
          icon={cam === "denied" ? CameraOff : ScanBarcode}
          title={cam === "denied" ? t("barcode.cameraDenied") : t("barcode.noCamera")}
          text={t("barcode.typeInstead")}
        />
      )}

      <p className="label-out">{t("barcode.manual")}</p>
      <form
        className="searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code);
        }}
      >
        <ScanBarcode />
        <input
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("barcode.placeholder")}
          aria-label={t("barcode.manual")}
        />
        <button className="scan" type="submit" disabled={looking} aria-label={t("barcode.lookup")}>
          <Search />
        </button>
      </form>

      {notFound && (
        <EmptyState
          icon={SearchX}
          title={t("barcode.notFound")}
          text={t("barcode.notFoundHint", { code: notFound })}
          action={
            <button className="btn btn-secondary" onClick={() => nav.replace(<QuickAdd mealId={mealId} />)}>
              <Zap />
              {t("food.quick")}
            </button>
          }
        />
      )}
    </div>
  );
}
