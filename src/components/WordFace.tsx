import type { Word } from "../lib/words";
import { SpeakButton } from "./Pronounce";

const isZh = (s: string) => /[\u4e00-\u9fff]/.test(s);

export function Senses({ w, lang, big = false }: { w: Word; lang: "en" | "ja"; big?: boolean }) {
  const en = lang === "ja" && !isZh(w.meaning);
  const senses = en ? [w.meaning] : w.meaning.split("；");
  return (
    <div>
      <ul className={`space-y-1.5 ${big ? "text-xl leading-snug" : ""}`}>
        {senses.map((m, i) => {
          const [, pos, rest] = m.match(/^([a-z]+\.)\s*(.*)$/) ?? m.match(/^(名词|动词|形容词|副词|形容动词|连词)\s+(.*)$/) ?? [null, "", m];
          return (
            <li key={i} className="flex items-baseline gap-2">
              {pos && <span className="shrink-0 font-word text-sm italic text-subtle">{pos}</span>}
              <span>{rest}</span>
            </li>
          );
        })}
      </ul>
      {en && <p className="mt-1 text-xs text-subtle">英文释义</p>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-3">
      <h3 className="eyebrow mb-2">{title}</h3>
      {children}
    </section>
  );
}

export function Mnemonic({ w, lang }: { w: Word; lang: "en" | "ja" }) {
  if (!w.parts?.length && !w.hook) return null;
  return (
    <Block title={lang === "ja" ? "汉字 · 记忆" : "词根 · 记忆"}>
      {w.parts && w.parts.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {w.parts.map((p) => (
            <li key={p.t + p.g} className="rounded-lg border border-border bg-elevated/60 px-2.5 py-1">
              <span className={lang === "ja" ? "font-jp text-lg" : "font-word text-lg"}>{p.t}</span>
              <span className="ml-2 text-xs text-muted">{p.g}</span>
            </li>
          ))}
        </ul>
      )}
      {w.hook && <p className="mt-2 text-sm leading-relaxed text-muted">{w.hook}</p>}
    </Block>
  );
}

/** Answer side: meaning, mnemonic, example, phrases, word forms. */
export function WordFace({ w, lang }: { w: Word; lang: "en" | "ja" }) {
  return (
    <div className="space-y-4">
      <Senses w={w} lang={lang} big />
      <Mnemonic w={w} lang={lang} />
      {w.example && (
        <Block title="例句">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p lang={lang} className={lang === "ja" ? "font-jp" : "font-word text-[17px]"}>{w.example}</p>
              <p className="mt-0.5 text-sm text-muted">{w.exampleZh}</p>
            </div>
            <SpeakButton text={w.example} lang={lang} size="sm" label="朗读例句" />
          </div>
        </Block>
      )}
      {w.phrases.length > 0 && (
        <Block title="常用短语">
          <ul className="space-y-1.5 text-[15px]">
            {w.phrases.map(([en, zh]) => (
              <li key={en}><span className="font-word">{en}</span><span className="ml-2 text-sm text-muted">{zh}</span></li>
            ))}
          </ul>
        </Block>
      )}
      {w.forms && w.forms.length > 0 && (
        <Block title="词形变化">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {w.forms.map(([k, v]) => <li key={k}><span className="text-subtle">{k}</span> <span className="font-word">{v}</span></li>)}
          </ul>
        </Block>
      )}
    </div>
  );
}
