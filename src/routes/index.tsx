import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calibrar · Prescrição conferida para farmácia de manipulação" },
      {
        name: "description",
        content:
          "Plataforma que valida campos obrigatórios e incompatibilidades da fórmula antes de a prescrição chegar à farmácia de manipulação.",
      },
      { property: "og:title", content: "Calibrar · Prescrição conferida antes do envio" },
      {
        property: "og:description",
        content:
          "Menos retrabalho entre prescritor e farmacêutico: alertas de incompatibilidade e campos obrigatórios verificados antes do envio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Campos = {
  prescritor: string;
  conselho: string;
  paciente: string;
  enderecoPaciente: string;
  modoUso: string;
  ativo1: string;
  conc1: string;
  ativo2: string;
  conc2: string;
  base: string;
  quantidade: string;
  posologia: string;
  assinatura: string;
  telefone: string;
  email: string;
  instagram: string;
};

const inicial: Campos = {
  prescritor: "Dra. Marina Alencar",
  conselho: "CRM-SP 148.220",
  paciente: "João Pedro Sanches, 34",
  enderecoPaciente: "Rua das Acácias, 210 · São Paulo/SP",
  modoUso: "Tópico",
  ativo1: "Vitamina C",
  conc1: "10%",
  ativo2: "Triptofano",
  conc2: "10%",
  base: "Gel",
  quantidade: "30 g",
  posologia: "2× ao dia, pela manhã e à noite",
  assinatura: "assinado · 12/05/2026",
  telefone: "",
  email: "contato@clinicaalencar.br",
  instagram: "@clinicaalencar",
};

type Alerta = { campo: keyof Campos | "formula"; nivel: "urgente" | "atencao"; titulo: string; motivo: string };

const obrigatorios: { campo: keyof Campos; rotulo: string }[] = [
  { campo: "prescritor", rotulo: "Prescritor" },
  { campo: "conselho", rotulo: "Conselho de classe" },
  { campo: "paciente", rotulo: "Paciente" },
  { campo: "enderecoPaciente", rotulo: "Endereço do paciente" },
  { campo: "modoUso", rotulo: "Modo de uso" },
  { campo: "ativo1", rotulo: "Princípio ativo" },
  { campo: "conc1", rotulo: "Concentração do ativo" },
  { campo: "base", rotulo: "Base / veículo" },
  { campo: "quantidade", rotulo: "Quantidade total" },
  { campo: "posologia", rotulo: "Posologia" },
  { campo: "assinatura", rotulo: "Assinatura e data" },
  { campo: "telefone", rotulo: "Telefone da clínica" },
  { campo: "email", rotulo: "E-mail da clínica" },
];

const num = (v: string) => parseFloat(v.replace(",", ".").replace(/[^0-9.]/g, ""));

function conferir(c: Campos): Alerta[] {
  const alertas: Alerta[] = [];
  const ativos = [c.ativo1, c.ativo2].map((a) => a.trim().toLowerCase());
  const base = c.base.trim().toLowerCase();

  for (const { campo, rotulo } of obrigatorios) {
    if (!c[campo].trim()) {
      alertas.push({
        campo,
        nivel: "urgente",
        titulo: `Campo obrigatório em branco: ${rotulo}`,
        motivo: "A farmácia não recebe a prescrição sem esta informação. Preencha para liberar o envio.",
      });
    }
  }

  if (c.conselho.trim() && !/^(CRM|CRO|CRMV|CRN|CRBM)-[A-Z]{2}\s?[\d.]{4,}$/i.test(c.conselho.trim())) {
    alertas.push({
      campo: "conselho",
      nivel: "atencao",
      titulo: "Registro de conselho em formato não reconhecido",
      motivo: "Use o padrão do conselho de classe, por exemplo CRM-SP 148.220, para a verificação automática.",
    });
  }

  if (ativos.includes("vitamina c") && ativos.includes("triptofano")) {
    alertas.push({
      campo: "formula",
      nivel: "urgente",
      titulo: "Incompatibilidade: Vitamina C + Triptofano",
      motivo: "Ambos são ácidos; juntos instabilizam a base de gel. Remova um ativo ou troque a base para solução.",
    });
  }

  if (ativos.includes("niacinamida") && base.includes("gel")) {
    const conc = ativos[0] === "niacinamida" ? num(c.conc1) : num(c.conc2);
    if (!Number.isNaN(conc) && conc > 10) {
      alertas.push({
        campo: "formula",
        nivel: "atencao",
        titulo: `Concentração fora da DBC: Niacinamida ${conc}%`,
        motivo: "Excede o limite indicado para base de gel. O máximo recomendado é 10%.",
      });
    }
  }

  if (ativos.includes("retinol") && base.includes("álcool")) {
    alertas.push({
      campo: "formula",
      nivel: "urgente",
      titulo: "Incompatibilidade: Retinol + base alcoólica",
      motivo: "O solvente degrada o ativo. Utilize base oleosa ou hidrogel neutro.",
    });
  }

  const pares: { ativo: string; conc: string }[] = [
    { ativo: c.ativo1, conc: c.conc1 },
    { ativo: c.ativo2, conc: c.conc2 },
  ];
  for (const { ativo, conc } of pares) {
    const v = num(conc);
    if (ativo.trim() && conc.trim() && (Number.isNaN(v) || v <= 0 || v > 100)) {

      alertas.push({
        campo: "formula",
        nivel: "urgente",
        titulo: `Concentração inválida em ${ativo}`,
        motivo: "Informe um percentual entre 0% e 100%, seguindo a DBC.",
      });
    }
  }

  return alertas;
}

function Campo({
  rotulo,
  valor,
  onChange,
  erro,
  mono,
  obrigatorio,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  erro?: string | undefined;
  mono?: boolean | undefined;
  obrigatorio?: boolean | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 font-body text-sm text-ink/70">
        {rotulo}
        {obrigatorio ? <span className="text-urgent">*</span> : null}
      </span>
      <input
        value={valor}
        placeholder={placeholder}
        aria-invalid={erro ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm text-ink ring-1 focus:outline-none ${
          mono ? "font-mono" : "font-body"
        } ${erro ? "ring-urgent/50" : "ring-black/10"}`}
      />
      {erro ? (
        <span className="mt-1.5 flex items-center gap-1 font-body text-xs font-medium text-urgentdeep">! {erro}</span>
      ) : null}
    </label>
  );
}

function Index() {
  const [c, setC] = useState<Campos>(inicial);
  const [enviado, setEnviado] = useState(false);
  const alertas = useMemo(() => conferir(c), [c]);
  const set = (k: keyof Campos) => (v: string) => {
    setEnviado(false);
    setC((p) => ({ ...p, [k]: v }));
  };
  const erroDe = (k: keyof Campos) => alertas.find((a) => a.campo === k)?.motivo;
  const liberado = alertas.length === 0;
  const preenchidos = obrigatorios.filter((o) => c[o.campo].trim()).length;
  const desvio = (alertas.filter((a) => a.nivel === "urgente").length * 1.6 +
    alertas.filter((a) => a.nivel === "atencao").length * 0.8)
    .toFixed(2)
    .replace(".", ",");

  return (
    <>
      <header className="bg-abyss text-glacier">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold tracking-tight text-white">Calibrar</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-bio sm:inline">
              conferência · manipulação
            </span>
          </div>
          <nav className="flex items-center gap-5 font-body text-sm text-glacier/80">
            <a href="#solucao" className="hidden lg:inline hover:text-white">
              A checagem
            </a>
            <a href="#beneficio" className="hidden lg:inline hover:text-white">
              Quem se beneficia
            </a>
            <a
              href="#prescricao"
              className="rounded-[min(1vw,8px)] bg-bio/15 px-3 py-1.5 font-medium text-glare ring-1 ring-bio/30"
            >
              Nova prescrição
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-abyss via-branddeep to-mist">
        <div className="pointer-events-none absolute -right-24 top-10 size-[380px] rounded-full bg-bio/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 size-[280px] rounded-full bg-bio/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-bio/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-glare ring-1 ring-bio/25">
                <span className="size-1.5 rounded-full bg-bio" /> Ferramenta de conferência pré-envio
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl lg:max-w-[20ch]">
                A balança que <span className="text-glare">confere</span> a fórmula antes de ela virar retrabalho.
              </h1>
              <p className="mt-6 max-w-[52ch] font-body text-base leading-relaxed text-glacier/85 text-pretty">
                O prescritor preenche a prescrição em campos obrigatórios. Antes de chegar ao farmacêutico, o Calibrar
                pesa cada ativo, base e concentração — e só libera o envio quando tudo equilibra.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#prescricao"
                  className="rounded-[min(1vw,10px)] bg-bio py-2 pr-3 pl-4 text-sm font-semibold text-abyss ring-1 ring-bio/40 transition-transform hover:-translate-y-0.5"
                >
                  <span className="mr-2 inline-block size-4 shrink-0 leading-none">⚖</span>
                  Conferir uma prescrição
                </a>
                <a
                  href="#solucao"
                  className="rounded-[min(1vw,10px)] py-2 pr-3 pl-4 text-sm font-medium text-glacier/90 ring-1 ring-white/15 transition-transform hover:-translate-y-0.5"
                >
                  <span className="mr-1 inline-block size-4 shrink-0 leading-none">→</span>
                  Como a checagem funciona
                </a>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-glacier/50">Dúvidas resolvidas</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-white">−72%</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-glacier/50">Ligação evitada</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-white">1 por receita</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-glacier/50">Liberação</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-white">em 40 s</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="rounded-[min(1.5vw,22px)] bg-branddeep/70 p-5 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-glacier/60">
                    Conferência de precisão
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-bio/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-glare ring-1 ring-bio/30">
                    <span className="size-1.5 rounded-full bg-bio" /> estável
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-center">
                  <div className="font-mono text-5xl font-semibold tabular-nums text-white">0,00</div>
                  <div className="mb-1 font-mono text-sm text-glacier/60">g de desvio</div>
                </div>
                <div className="mx-auto mt-3 h-px w-2/3 bg-gradient-to-r from-transparent via-bio to-transparent" />
                <ul className="mt-5 space-y-2 font-body text-sm text-glacier/85">
                  <li className="flex items-center gap-2">
                    <span className="size-4 shrink-0 text-bio">✓</span> Ativos dentro da DBC
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-4 shrink-0 text-bio">✓</span> Base/veículo compatível
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-4 shrink-0 text-bio">✓</span> Concentrações equilibradas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="solucao" className="bg-gradient-to-b from-mist to-glacier/70">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand/60">A solução</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink text-balance max-w-[38ch]">
                Checar antes do envio, não corrigir depois.
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed text-ink/70 text-pretty">
                Cada campo obrigatório é pesado. Incompatibilidade ou dado ausente gera alerta com o motivo — e o envio
                fica bloqueado até o prescritor ajustar.
              </p>
              <ol className="mt-7 space-y-4">
                {[
                  "Preencher os campos obrigatórios da prescrição.",
                  "A balança confere ativos, base, concentrações e dados.",
                  "Somente no equilíbrio, a fórmula é liberada para a farmácia.",
                ].map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand font-mono text-xs text-white">
                      {i + 1}
                    </span>
                    <span className="font-body text-sm text-ink/75">{t}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[min(1.5vw,20px)] bg-branddeep p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-glacier/60">
                  Leitura da balança
                </span>
                <span className="font-mono text-[11px] text-glare">DBC · ativo a ativo</span>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-glacier/90">Equilíbrio geral</span>
                    <span className="font-mono text-glare">96%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-bio" style={{ width: "96%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-glacier/90">Concentrações</span>
                    <span className="font-mono text-caution">atendido</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-caution" style={{ width: "78%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-glacier/90">Campos obrigatórios</span>
                    <span className="font-mono text-urgent">1 faltando</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-urgent" style={{ width: "90%" }} />
                  </div>
                </div>
              </div>
              <p className="mt-6 rounded-lg bg-white/5 p-3 font-body text-sm text-glacier/80">
                Nada é liberado com a balança fora do zero. O motivo de cada alerta aparece na hora.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficio" className="bg-glacier/70">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand/60">Quem se beneficia</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink text-balance max-w-[44ch]">
              Uma conferência certa, três pessoas em dia.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Prescritor", "Revisa na hora", "Vê o alerta antes de enviar e ajusta o campo sem esperar resposta da farmácia."],
              ["Farmacêutico", "Segurança na bancada", "Recebe uma fórmula já conferida, sem interromper a produção para questionar."],
              ["Paciente", "Produto certo, no prazo", "Menos risco de formulação errada e menos espera para receber o seu."],
            ].map(([tag, titulo, texto]) => (
              <div key={tag} className="rounded-[min(1.25vw,14px)] bg-white/70 p-5 ring-1 ring-black/5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-brand">{tag}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">{titulo}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prescricao" className="bg-mist">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand/60">
                Tela de prescrição · estado de conferência
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink text-balance max-w-[36ch]">
                Envio bloqueado até o zero na balança.
              </h2>
            </div>
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                liberado
                  ? "bg-bio/15 text-brand ring-1 ring-bio/40"
                  : "bg-urgent/10 text-urgentdeep ring-1 ring-urgent/25"
              }`}
            >
              <span className={`size-1.5 rounded-full ${liberado ? "bg-bio" : "bg-urgent"}`} />
              {liberado ? "pronta para envio" : `${alertas.length} alerta(s) a resolver`}
            </div>
          </div>

          <div className="overflow-hidden rounded-[min(1.5vw,20px)] bg-white/80 ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-4 border-b border-black/5 bg-glacier/50 px-5 py-3">
              <div className="flex items-center gap-2 font-body text-sm text-ink/80">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-bio text-xs text-abyss">✓</span>
                Prescritor &amp; conselho verificados
              </div>
              <span className="font-mono text-[11px] text-ink/50">Protocolo #CAL-2417</span>
            </div>

            <div className="grid gap-x-8 gap-y-8 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brand/70">
                    <span className="size-1.5 rounded-full bg-bio" /> Profissional &amp; paciente
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo rotulo="Prescritor" obrigatorio valor={c.prescritor} onChange={set("prescritor")} erro={erroDe("prescritor")} />
                    <Campo rotulo="Conselho de classe" obrigatorio mono valor={c.conselho} onChange={set("conselho")} erro={erroDe("conselho")} />
                    <Campo rotulo="Paciente" obrigatorio valor={c.paciente} onChange={set("paciente")} erro={erroDe("paciente")} />
                    <Campo rotulo="Endereço do paciente" obrigatorio valor={c.enderecoPaciente} onChange={set("enderecoPaciente")} erro={erroDe("enderecoPaciente")} />
                    <Campo rotulo="Modo de uso (interno, tópico, oral)" obrigatorio valor={c.modoUso} onChange={set("modoUso")} erro={erroDe("modoUso")} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brand/70">
                    <span className={`size-1.5 rounded-full ${liberado ? "bg-bio" : "bg-urgent"}`} /> Fórmula · ativos,
                    base e concentrações
                  </h3>
                  <div className="space-y-4">
                    {alertas
                      .filter((a) => a.campo === "formula")
                      .map((a) => (
                        <div
                          key={a.titulo}
                          className={`rounded-[min(1vw,10px)] p-4 ring-1 ${
                            a.nivel === "urgente" ? "bg-urgent/[0.06] ring-urgent/30" : "bg-caution/[0.07] ring-caution/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`grid size-5 shrink-0 place-items-center rounded-full text-xs font-semibold text-white ${
                                a.nivel === "urgente" ? "bg-urgent" : "bg-caution"
                              }`}
                            >
                              !
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`font-body text-sm font-semibold ${
                                  a.nivel === "urgente" ? "text-urgentdeep" : "text-caution"
                                }`}
                              >
                                {a.titulo}
                              </p>
                              <p className="mt-1 font-body text-sm leading-relaxed text-ink/70">{a.motivo}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                    <div className="rounded-[min(1vw,10px)] bg-white p-4 ring-1 ring-black/10">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Campo rotulo="Princípio ativo 1" obrigatorio valor={c.ativo1} onChange={set("ativo1")} />
                        <Campo rotulo="Concentração" obrigatorio mono valor={c.conc1} onChange={set("conc1")} />
                        <Campo rotulo="Princípio ativo 2" valor={c.ativo2} onChange={set("ativo2")} />
                        <Campo rotulo="Concentração" mono valor={c.conc2} onChange={set("conc2")} />
                        <Campo rotulo="Base / veículo" obrigatorio valor={c.base} onChange={set("base")} erro={erroDe("base")} />
                        <Campo rotulo="Quantidade total" obrigatorio mono valor={c.quantidade} onChange={set("quantidade")} erro={erroDe("quantidade")} />
                        <Campo rotulo="Posologia" obrigatorio valor={c.posologia} onChange={set("posologia")} erro={erroDe("posologia")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brand/70">
                    <span className={`size-1.5 rounded-full ${c.telefone.trim() ? "bg-bio" : "bg-urgent"}`} /> Assinatura
                    &amp; dados da clínica
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo rotulo="Assinatura validada (GOV) e data" obrigatorio mono valor={c.assinatura} onChange={set("assinatura")} erro={erroDe("assinatura")} />
                    <Campo
                      rotulo="Telefone da clínica"
                      obrigatorio
                      mono
                      placeholder="(11) 9____-____"
                      valor={c.telefone}
                      onChange={set("telefone")}
                      erro={erroDe("telefone")}
                    />
                    <Campo rotulo="E-mail" obrigatorio valor={c.email} onChange={set("email")} erro={erroDe("email")} />
                    <Campo rotulo="Instagram" valor={c.instagram} onChange={set("instagram")} />
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[min(1.25vw,14px)] bg-branddeep p-5 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-glacier/60">Balança</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ring-1 ${
                        liberado ? "bg-bio/20 text-glare ring-bio/40" : "bg-urgent/20 text-[#f0b4ac] ring-urgent/40"
                      }`}
                    >
                      {liberado ? "no zero" : "fora do zero"}
                    </span>
                  </div>
                  <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-white">
                    {liberado ? "0,00" : `+${desvio}`}
                    <small className="ml-1 text-base text-glacier/50">g</small>
                  </div>
                  <p className="mt-1 font-body text-xs text-glacier/70">
                    {liberado ? "Leitura estável. Prescrição pronta." : "Resolva os alertas para zerar a leitura."}
                  </p>
                </div>

                <div className="rounded-[min(1.25vw,14px)] bg-white p-4 ring-1 ring-black/5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink/50">
                    Alertas ativos · {preenchidos}/{obrigatorios.length} campos obrigatórios
                  </p>
                  <ul className="mt-3 space-y-2.5 font-body text-sm">
                    {alertas.length === 0 ? (
                      <li className="flex gap-2">
                        <span className="size-2 shrink-0 translate-y-1 rounded-full bg-bio" />
                        <span className="text-ink/75">Nenhum alerta. Tudo conferido.</span>
                      </li>
                    ) : (
                      alertas.map((a) => (
                        <li key={a.titulo} className="flex gap-2">
                          <span
                            className={`size-2 shrink-0 translate-y-1 rounded-full ${
                              a.nivel === "urgente" ? "bg-urgent" : "bg-caution"
                            }`}
                          />
                          <span className="text-ink/75">{a.titulo}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div
                  className={`rounded-[min(1.25vw,14px)] p-4 ring-1 ${
                    liberado ? "bg-bio/[0.08] ring-bio/30" : "bg-urgent/[0.06] ring-urgent/25"
                  }`}
                >
                  <p className={`font-body text-sm font-semibold ${liberado ? "text-brand" : "text-urgentdeep"}`}>
                    {liberado ? "Pronta para a farmácia" : "Envio bloqueado"}
                  </p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-ink/65">
                    {enviado
                      ? "Prescrição enviada. O farmacêutico recebeu a fórmula já conferida."
                      : "A prescrição só é liberada para a farmácia com todos os campos preenchidos e a balança no zero."}
                  </p>
                </div>

                <button
                  disabled={!liberado}
                  onClick={() => setEnviado(true)}
                  className={`w-full rounded-[min(1vw,10px)] py-2.5 text-sm font-semibold ring-1 ${
                    liberado
                      ? "cursor-pointer bg-bio text-abyss ring-bio/40 hover:-translate-y-0.5 transition-transform"
                      : "cursor-not-allowed bg-urgent/20 text-urgentdeep/80 ring-urgent/20"
                  }`}
                >
                  {enviado ? "Enviada ✓" : "Liberar para a farmácia"}
                </button>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-abyss text-glacier/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold text-white">Calibrar</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bio">conferência · manipulação</span>
          </div>
          <p className="font-body text-xs text-glacier/50">O clique de conferência antes de toda fórmula liberar.</p>
        </div>
      </footer>
    </>
  );
}
