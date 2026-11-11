import React, { useEffect, useState } from "react";
import type { AngiographyPose } from "../angiographyPose";
import {
  checkedPose,
  collection,
  mergeViews,
  parseViews,
  savedViewsKey,
  type SavedView,
} from "./savedViews";
export default function SavedViews({
  pose,
  onRestore,
}: {
  pose: AngiographyPose;
  onRestore: (pose: AngiographyPose) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [loaded, setLoaded] = useState(false),
    [pending, setPending] = useState<SavedView[] | null>(null),
    [removed, setRemoved] = useState<SavedView | null>(null);
  useEffect(() => {
    try {
      const text = localStorage.getItem(savedViewsKey);
      setViews(text ? parseViews(text) : []);
      setLoaded(true);
    } catch {
      setMessage(
        "Não foi possível abrir as vistas salvas. O registro anterior foi preservado.",
      );
    }
  }, []);
  function persist(next: SavedView[]) {
    try {
      if (!loaded) throw Error("Armazenamento local indisponível.");
      const current = localStorage.getItem(savedViewsKey);
      if (
        JSON.stringify(current ? parseViews(current) : []) !==
        JSON.stringify(views)
      )
        throw Error(
          "A coleção mudou em outra aba. Recarregue antes de salvar para preservar as alterações.",
        );
      localStorage.setItem(savedViewsKey, JSON.stringify(collection(next)));
      setViews(next);
      return true;
    } catch (e) {
      setMessage("Não foi possível salvar: " + (e as Error).message);
      return false;
    }
  }
  async function importViews(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100000) throw Error("Limite de 100 KB por arquivo.");
      const incoming = parseViews(await file.text());
      mergeViews(views, incoming);
      setPending(incoming);
      setMessage("Prévia pronta. Confirme para acrescentar as vistas.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  function exportViews() {
    const u = URL.createObjectURL(
        new Blob([JSON.stringify(collection(views), null, 2)], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = u;
    a.download = "atlas_vistas_aquisicao.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  return (
    <details className="nps-saved">
      <summary>Minhas vistas de aquisição ({views.length}/50)</summary>
      <p>
        Guarde ângulo, centro e ampliação. Recuperar uma vista mantém a seleção
        e as camadas atuais. Dados salvos somente neste navegador.
      </p>
      <div className="nps-save-row">
        <label>
          Nome da vista
          <input
            value={name}
            maxLength={80}
            placeholder="Ex.: comparação lateral"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          disabled={!loaded || !name.trim() || views.length >= 50}
          onClick={() => {
            try {
              const row = {
                id: crypto.randomUUID(),
                name: name.trim(),
                createdAt: new Date().toISOString(),
                pose: checkedPose(pose),
              };
              if (persist([...views, row])) {
                setName("");
                setMessage("Vista de aquisição salva.");
              }
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Salvar aquisição atual
        </button>
        <button disabled={!views.length} onClick={exportViews}>
          Exportar vistas
        </button>
        <label className="nps-import">
          Importar vistas JSON
          <input
            type="file"
            accept=".json,application/json"
            disabled={!loaded}
            onChange={(e) => {
              void importViews(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {message && <p role="status">{message}</p>}
      {pending && (
        <div className="nps-import-preview">
          <strong>{pending.length} vistas para conferir</strong>
          {pending.map((v) => (
            <p key={v.id}>
              {v.name} · α {v.pose.yaw.toFixed(1)}° · β{" "}
              {v.pose.pitch.toFixed(1)}° · {v.pose.zoom.toFixed(2)}×
            </p>
          ))}
          <button
            onClick={() => {
              try {
                if (persist(mergeViews(views, pending))) {
                  setPending(null);
                  setMessage(
                    "Vistas acrescentadas; coleção anterior preservada.",
                  );
                }
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            Confirmar importação de vistas
          </button>
          <button onClick={() => setPending(null)}>Cancelar importação</button>
        </div>
      )}
      {views.map((v) => (
        <div className="nps-saved-row" key={v.id}>
          <div>
            <strong>{v.name}</strong>
            <small>
              α {v.pose.yaw.toFixed(1)}° · β {v.pose.pitch.toFixed(1)}° ·{" "}
              {v.pose.zoom.toFixed(2)}×
            </small>
          </div>
          <button
            onClick={() => {
              onRestore(checkedPose(v.pose));
              setMessage(`Vista recuperada: ${v.name}.`);
            }}
          >
            Recuperar {v.name}
          </button>
          <button
            aria-label={`Remover vista ${v.name}`}
            onClick={() => {
              if (persist(views.filter((x) => x.id !== v.id))) setRemoved(v);
            }}
          >
            Remover
          </button>
        </div>
      ))}
      {removed && (
        <button
          onClick={() => {
            try {
              if (persist(mergeViews(views, [removed]))) {
                setRemoved(null);
                setMessage("Vista restaurada.");
              }
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Desfazer remoção de {removed.name}
        </button>
      )}
    </details>
  );
}
