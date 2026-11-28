// Progressão automática da ficha de Ordem Paranormal (livro de regras v1.3).
// Guarda só a mecânica: nomes, NEX em que cada coisa chega, custos e números.
// Os resumos são curtos e escritos para o app; a regra completa fica no livro
// (a página aparece ao lado de cada habilidade).
import type { OpAttr, OpSheet } from "./op";

export interface OpAbilityRow {
  n: string;
  c: string;
  p: string;
  d: string;
  /** Origem automática da linha (vazio = o jogador criou). */
  src?: string;
}

/** Página impressa do livro de regras. */
type Page = number;

// ───────────────────────── Origens ─────────────────────────

export const OP_ORIGIN_DATA: Record<string, { skills: string[]; power: string; summary: string; page: Page }> = {
  academico: { skills: ["ciencias", "investigacao"], power: "Saber é Poder", summary: "2 PE: +5 num teste de Intelecto.", page: 16 },
  agente_saude: { skills: ["intuicao", "medicina"], power: "Técnica Medicinal", summary: "Soma Intelecto aos PV que cura.", page: 16 },
  amnesico: { skills: [], power: "Vislumbres do Passado", summary: "1×/sessão, teste de INT (DT 10) para reconhecer algo do passado; ganha 1d4 PE temporários.", page: 16 },
  artista: { skills: ["artes", "enganacao"], power: "Magnum Opus", summary: "1×/missão alguém te reconhece: +5 em testes de Presença contra essa pessoa.", page: 17 },
  atleta: { skills: ["acrobacia", "atletismo"], power: "110%", summary: "2 PE: +5 num teste de FOR ou AGI (exceto Luta e Pontaria).", page: 17 },
  chef: { skills: ["fortitude", "profissao"], power: "Ingrediente Secreto", summary: "No interlúdio, quem se alimenta com você recebe o benefício de dois pratos.", page: 17 },
  criminoso: { skills: ["crime", "furtividade"], power: "O Crime Compensa", summary: "Leva um item encontrado para a próxima missão sem contar no limite da patente.", page: 18 },
  cultista_arrependido: { skills: ["ocultismo", "religiao"], power: "Traços do Outro Lado", summary: "Um poder paranormal à escolha, mas começa com metade da Sanidade.", page: 18 },
  desgarrado: { skills: ["fortitude", "sobrevivencia"], power: "Calejado", summary: "+1 PV para cada 5% de NEX (já somado no PV máximo).", page: 18 },
  engenheiro: { skills: ["profissao", "tecnologia"], power: "Ferramenta Favorita", summary: "Um item (exceto armas) conta como uma categoria abaixo.", page: 18 },
  executivo: { skills: ["diplomacia", "profissao"], power: "Processo Otimizado", summary: "2 PE: +5 em testes estendidos ou ao revisar documentos.", page: 18 },
  investigador: { skills: ["investigacao", "percepcao"], power: "Faro para Pistas", summary: "1×/cena, 1 PE: +5 num teste para procurar pistas.", page: 19 },
  lutador: { skills: ["luta", "reflexos"], power: "Mão Pesada", summary: "+2 no dano de ataques corpo a corpo.", page: 19 },
  magnata: { skills: ["diplomacia", "pilotagem"], power: "Patrocinador da Ordem", summary: "Seu limite de crédito conta como um acima.", page: 19 },
  mercenario: { skills: ["iniciativa", "intimidacao"], power: "Posição de Combate", summary: "No 1º turno de cada cena de ação, 2 PE: ação de movimento extra.", page: 19 },
  militar: { skills: ["pontaria", "tatica"], power: "Para Bellum", summary: "+2 no dano com armas de fogo.", page: 19 },
  operario: { skills: ["fortitude", "profissao"], power: "Ferramenta de Trabalho", summary: "Uma arma-ferramenta da sua profissão ganha +1 em ataque e dano.", page: 20 },
  policial: { skills: ["percepcao", "pontaria"], power: "Patrulha", summary: "+2 na Defesa (já somado na Defesa).", page: 20 },
  religioso: { skills: ["religiao", "vontade"], power: "Acalentar", summary: "+5 em Religião para acalmar; quem você acalma recupera 1d6 + PRE de Sanidade.", page: 20 },
  servidor_publico: { skills: ["intuicao", "vontade"], power: "Espírito Cívico", summary: "Ao ajudar, 1 PE: +2 a mais no bônus.", page: 20 },
  teorico: { skills: ["investigacao", "ocultismo"], power: "Eu Já Sabia", summary: "Resistência a dano mental igual ao seu Intelecto.", page: 20 },
  ti: { skills: ["investigacao", "tecnologia"], power: "Motor de Busca", summary: "Com internet, 2 PE: troca um teste de perícia por Tecnologia.", page: 21 },
  trabalhador_rural: { skills: ["adestramento", "sobrevivencia"], power: "Desbravador", summary: "2 PE: +5 em Adestramento ou Sobrevivência; ignora terreno difícil.", page: 21 },
  trambiqueiro: { skills: ["crime", "enganacao"], power: "Impostor", summary: "1×/cena, 2 PE: troca um teste de perícia por Enganação.", page: 21 },
  universitario: { skills: ["atualidades", "investigacao"], power: "Dedicação", summary: "+1 PE e mais 1 a cada NEX ímpar; +1 no limite de PE por rodada (já somados).", page: 21 },
  vitima: { skills: ["reflexos", "vontade"], power: "Cicatrizes Psicológicas", summary: "+1 de Sanidade para cada 5% de NEX (já somado).", page: 21 },
};

// ───────────────────────── Classes ─────────────────────────

interface ClassInfo {
  name: string;
  page: Page;
  skills: string;
  prof: string;
  gradeBase: number;
  powerLabel: string;
  powers: { name: string; req?: string; summary: string }[];
}

export const OP_CLASS_INFO: Record<string, ClassInfo> = {
  "1": {
    name: "Combatente",
    page: 24,
    skills: "Luta ou Pontaria, Fortitude ou Reflexos, mais 1 + Intelecto perícias à escolha.",
    prof: "Armas simples, armas táticas e proteções leves.",
    gradeBase: 2,
    powerLabel: "Poder de combatente",
    powers: [
      { name: "Armamento Pesado", req: "FOR 2", summary: "Proficiência com armas pesadas." },
      { name: "Artista Marcial", summary: "Desarmado causa 1d6 (1d8 em 35%, 1d10 em 70%) e conta como arma ágil." },
      { name: "Ataque de Oportunidade", summary: "Reação + 1 PE: ataca quem sai do seu alcance." },
      { name: "Combater com Duas Armas", req: "AGI 3, treinado em Luta ou Pontaria", summary: "Dois ataques por ação agredir, com penalidade." },
      { name: "Combate Defensivo", req: "INT 2", summary: "Ataca com penalidade e ganha +5 na Defesa." },
      { name: "Golpe Demolidor", req: "FOR 2, treinado em Luta", summary: "1 PE: +2 dados de dano contra objetos/manobra quebrar." },
      { name: "Golpe Pesado", summary: "Armas corpo a corpo causam +1 dado de dano." },
      { name: "Incansável", summary: "1×/cena, 2 PE: ação de investigação extra usando FOR ou AGI." },
      { name: "Presteza Atlética", summary: "1 PE: usa FOR ou AGI para facilitar a investigação." },
      { name: "Proteção Pesada", req: "NEX 30%", summary: "Proficiência com proteções pesadas." },
      { name: "Reflexos Defensivos", req: "AGI 2", summary: "+2 na Defesa e em testes de resistência." },
      { name: "Saque Rápido", req: "treinado em Iniciativa", summary: "Saca e guarda itens como ação livre." },
      { name: "Segurar o Gatilho", req: "NEX 60%", summary: "Ao acertar com arma de fogo, ataca de novo pagando PE crescente." },
      { name: "Sentido Tático", req: "INT 2, treinado em Percepção e Tática", summary: "Movimento + 2 PE: bônus em Defesa e resistência igual ao Intelecto." },
      { name: "Tanque de Guerra", req: "Proteção Pesada", summary: "Proteção pesada dá +2 de Defesa e de RD." },
      { name: "Tiro Certeiro", req: "treinado em Pontaria", summary: "Soma AGI no dano de armas de disparo e ignora penalidade de corpo a corpo." },
      { name: "Tiro de Cobertura", summary: "Padrão + 1 PE: prende o alvo no lugar e dá −5 nos ataques dele." },
      { name: "Transcender", summary: "Um poder paranormal (sem ganhar Sanidade neste NEX)." },
      { name: "Treinamento em Perícia", summary: "Treina duas perícias (ou sobe o grau a partir de 35%/70%)." },
    ],
  },
  "2": {
    name: "Especialista",
    page: 28,
    skills: "7 + Intelecto perícias à escolha.",
    prof: "Armas simples e proteções leves.",
    gradeBase: 5,
    powerLabel: "Poder de especialista",
    powers: [
      { name: "Artista Marcial", summary: "Desarmado causa 1d6 (1d8 em 35%, 1d10 em 70%) e conta como arma ágil." },
      { name: "Balística Avançada", summary: "Proficiência com armas táticas de fogo e +2 no dano com armas de fogo." },
      { name: "Conhecimento Aplicado", req: "INT 2", summary: "2 PE: troca o atributo-base de uma perícia por Intelecto." },
      { name: "Hacker", req: "treinado em Tecnologia", summary: "+5 para invadir sistemas, mais rápido." },
      { name: "Mãos Rápidas", req: "AGI 3, treinado em Crime", summary: "1 PE: teste de Crime como ação livre." },
      { name: "Mochila de Utilidades", summary: "Um item conta uma categoria abaixo e ocupa 1 espaço a menos." },
      { name: "Movimento Tático", req: "treinado em Atletismo", summary: "1 PE: ignora terreno difícil e escalada no turno." },
      { name: "Na Trilha Certa", summary: "Ao achar pista, paga PE para bônus crescente no próximo teste." },
      { name: "Nerd", summary: "1×/cena, 2 PE: teste de Atualidades para uma informação útil." },
      { name: "Ninja Urbano", summary: "Proficiência com armas táticas corpo a corpo e de disparo (exceto de fogo)." },
      { name: "Pensamento Ágil", summary: "1×/rodada na investigação, 2 PE: procurar pistas de novo." },
      { name: "Perito em Explosivos", summary: "Soma INT na DT dos seus explosivos e exclui alvos da explosão." },
      { name: "Primeira Impressão", summary: "Bônus no primeiro teste social de cada cena." },
      { name: "Transcender", summary: "Um poder paranormal (sem ganhar Sanidade neste NEX)." },
      { name: "Treinamento em Perícia", summary: "Treina duas perícias (ou sobe o grau a partir de 35%/70%)." },
    ],
  },
  "3": {
    name: "Ocultista",
    page: 32,
    skills: "Ocultismo e Vontade, mais 3 + Intelecto perícias à escolha.",
    prof: "Armas simples.",
    gradeBase: 3,
    powerLabel: "Poder de ocultista",
    powers: [
      { name: "Camuflar Ocultismo", summary: "Esconde símbolos e conjura sem chamar atenção." },
      { name: "Criar Selo", summary: "Fabrica selos de rituais que conhece." },
      { name: "Envolto em Mistério", summary: "Bônus para manipular e assustar pessoas supersticiosas." },
      { name: "Especialista em Elemento", summary: "+2 na DT dos rituais de um elemento." },
      { name: "Ferramentas Paranormais", summary: "Itens paranormais contam uma categoria abaixo e ativam sem PE." },
      { name: "Fluxo de Poder", req: "NEX 60%", summary: "Mantém dois rituais sustentados com uma ação livre." },
      { name: "Guiado pelo Paranormal", summary: "1×/cena, 2 PE: ação de investigação extra." },
      { name: "Identificação Paranormal", summary: "+10 em Ocultismo para identificar criaturas, objetos e rituais." },
      { name: "Improvisar Componentes", summary: "1×/cena, teste de Investigação para achar componentes." },
      { name: "Intuição Paranormal", summary: "Soma INT ou PRE ao facilitar a investigação." },
      { name: "Mestre em Elemento", req: "Especialista em Elemento, NEX 45%", summary: "Rituais de um elemento custam −1 PE." },
      { name: "Ritual Potente", req: "INT 2", summary: "Soma INT no dano ou cura dos rituais." },
      { name: "Ritual Predileto", summary: "Um ritual que conhece custa −1 PE." },
      { name: "Tatuagem Ritualística", summary: "Rituais pessoais que te têm como alvo custam −1 PE." },
      { name: "Transcender", summary: "Um poder paranormal (sem ganhar Sanidade neste NEX)." },
      { name: "Treinamento em Perícia", summary: "Treina duas perícias (ou sobe o grau a partir de 35%/70%)." },
    ],
  },
};

// ───────────────────────── Trilhas ─────────────────────────

type TrilhaStep = [name: string, summary: string];
export const OP_TRILHA_DATA: Record<string, { page: Page; steps: [TrilhaStep, TrilhaStep, TrilhaStep, TrilhaStep] }> = {
  Aniquilador: { page: 26, steps: [
    ["A Favorita", "Uma arma escolhida conta uma categoria abaixo."],
    ["Técnica Secreta", "A favorita cai mais uma categoria; gaste PE para efeitos extras (Amplo, Destruidor) no ataque."],
    ["Técnica Sublime", "Novos efeitos para a técnica secreta (Letal, Perfurante)."],
    ["Máquina de Matar", "A favorita cai mais uma categoria e fica mais letal."],
  ] },
  "Comandante de Campo": { page: 27, steps: [
    ["Inspirar Confiança", "Reação + PE: um aliado rola de novo um teste."],
    ["Estrategista", "Gaste ação e PE para dar ações de movimento a aliados."],
    ["Brecha na Guarda", "1×/rodada, um aliado ataca o inimigo que errou você."],
    ["Oficial Comandante", "Ação padrão + PE: aliados recebem uma ação padrão extra."],
  ] },
  Guerreiro: { page: 27, steps: [
    ["Técnica Letal", "+2 na margem de ameaça corpo a corpo."],
    ["Revidar", "Ao bloquear, contra-ataca como reação."],
    ["Força Opressora", "Ao acertar corpo a corpo, PE para derrubar ou empurrar."],
    ["Potência Máxima", "Ataque especial com dano máximo."],
  ] },
  "Operações Especiais": { page: 27, steps: [
    ["Iniciativa Aprimorada", "+5 em Iniciativa e ação de movimento extra na primeira rodada."],
    ["Ataque Extra", "1×/rodada, PE para um ataque adicional."],
    ["Surto de Adrenalina", "1×/rodada, PE para uma ação extra."],
    ["Sempre Alerta", "Ação padrão extra no começo de cada combate."],
  ] },
  "Tropa de Choque": { page: 27, steps: [
    ["Casca Grossa", "+1 PV para cada 5% de NEX (já somado) e soma VIG no bloqueio."],
    ["Cai Dentro", "Reação + PE: obriga um inimigo a atacar você."],
    ["Duro de Matar", "Reação + PE: reduz um dano à metade."],
    ["Inquebrável", "Machucado, recebe +5 na Defesa e resistência a dano."],
  ] },
  "Atirador de Elite": { page: 30, steps: [
    ["Mira de Elite", "Proficiência com armas de balas longas e soma INT no dano delas."],
    ["Disparo Letal", "Ao mirar, 1 PE: +2 na margem de ameaça do próximo ataque."],
    ["Disparo Impactante", "2 PE: troca o dano de um tiro por uma manobra."],
    ["Atirar para Matar", "Crítico com arma de fogo causa dano máximo."],
  ] },
  Infiltrador: { page: 30, steps: [
    ["Ataque Furtivo", "Dano extra contra alvos desprevenidos ou flanqueados (cresce com o NEX)."],
    ["Gatuno", "+5 em Atletismo e Crime; se esconde sem perder deslocamento."],
    ["Assassinar", "Movimento + 3 PE: dobra os dados do próximo ataque furtivo."],
    ["Sombra Fugaz", "3 PE: ignora a penalidade de Furtividade após agir."],
  ] },
  "Médico de Campo": { page: 31, steps: [
    ["Paramédico", "Padrão + 2 PE: cura 2d10 PV (mais dados com o NEX)."],
    ["Equipe de Trauma", "Padrão + 2 PE: remove uma condição negativa de um aliado."],
    ["Resgate", "Se aproxima de aliado caído como ação livre e protege quem socorre."],
    ["Reanimação", "1×/cena, 10 PE: traz de volta quem morreu na cena."],
  ] },
  Negociador: { page: 31, steps: [
    ["Eloquência", "Completa + PE por alvo: fala que fascina ou paralisa."],
    ["Discurso Motivador", "Padrão + 4 PE: aliados ganham bônus em perícias na cena."],
    ["Eu Conheço um Cara", "1×/missão, um favor da sua rede de contatos."],
    ["Truque de Mestre", "5 PE: copia uma habilidade que viu um aliado usar."],
  ] },
  "Técnico": { page: 31, steps: [
    ["Inventário Otimizado", "Soma INT à FOR para a carga (já somado)."],
    ["Remendão", "Conserta equipamento na hora; equipamentos gerais caem uma categoria."],
    ["Improvisar", "Completa + PE: improvisa um equipamento geral."],
    ["Preparado para Tudo", "Movimento + PE: sempre tem o item de que precisa."],
  ] },
  "Conduíte": { page: 34, steps: [
    ["Ampliar Ritual", "+2 PE: aumenta o alcance ou dobra a área de um ritual."],
    ["Acelerar Ritual", "1×/rodada, +4 PE: conjura como ação livre."],
    ["Anular Ritual", "PE + teste oposto de Ocultismo para anular um ritual contra você."],
    ["Canalizar o Medo", "Aprende o ritual Canalizar o Medo."],
  ] },
  Flagelador: { page: 34, steps: [
    ["Poder do Flagelo", "Paga o custo de rituais com PV."],
    ["Abraçar a Dor", "Reação + 2 PE: reduz dano não paranormal à metade."],
    ["Absorver Agonia", "Ao derrubar inimigos com ritual, ganha PE temporários."],
    ["Medo Tangível", "Aprende o ritual Medo Tangível."],
  ] },
  Graduado: { page: 35, steps: [
    ["Saber Ampliado", "Aprende um ritual extra a cada novo círculo."],
    ["Grimório Ritualístico", "Grimório com rituais extras (quantidade = INT)."],
    ["Rituais Eficientes", "+5 na DT dos seus rituais."],
    ["Conhecendo o Medo", "Aprende o ritual Conhecendo o Medo."],
  ] },
  Intuitivo: { page: 35, steps: [
    ["Mente Sã", "Resistência paranormal +5."],
    ["Presença Poderosa", "Soma PRE no limite de PE por turno para rituais."],
    ["Inabalável", "Resistência a dano mental e paranormal 10."],
    ["Presença do Medo", "Aprende o ritual Presença do Medo."],
  ] },
  "Lâmina Paranormal": { page: 35, steps: [
    ["Lâmina Maldita", "Aprende Amaldiçoar Arma e pode atacar com Ocultismo."],
    ["Gladiador Paranormal", "Ganha PE temporários ao acertar corpo a corpo."],
    ["Conjuração Marcial", "Ao conjurar, 2 PE: ataque corpo a corpo livre."],
    ["Lâmina do Medo", "Aprende o ritual Lâmina do Medo."],
  ] },
};

const TRILHA_NEX = [10, 40, 65, 99];
const POWER_NEX = [15, 30, 45, 60, 75, 90];
const ATTR_NEX = [20, 50, 80, 95];
const GRADE_NEX = [35, 70];

// ───────────────────────── Progressão ─────────────────────────

export type OpStepKind = "auto" | "power" | "attr" | "grade" | "trilha" | "versatility";

export interface OpStep {
  id: string;
  nex: number;
  kind: OpStepKind;
  name: string;
  summary: string;
  page?: Page;
  cost?: string;
}

function scaled(nex: number, steps: [number, string][]): string {
  return steps.filter(([n]) => nex >= n).pop()?.[1] || steps[0][1];
}

/** Tudo o que o personagem já recebeu pela classe e trilha no NEX atual. */
export function opSteps(s: OpSheet): OpStep[] {
  const cls = OP_CLASS_INFO[s.classe];
  if (!cls) return [];
  const out: OpStep[] = [];
  const nex = s.nex;

  if (s.classe === "1") {
    out.push({
      id: "ataque-especial", nex: 5, kind: "auto", name: "Ataque Especial", page: 24,
      cost: scaled(nex, [[5, "2 PE"], [25, "3 PE"], [55, "4 PE"], [85, "5 PE"]]),
      summary: `Gaste PE para somar ${scaled(nex, [[5, "+5"], [25, "+10"], [55, "+15"], [85, "+20"]])} (em blocos de +5) no ataque ou no dano.`,
    });
  } else if (s.classe === "2") {
    out.push({ id: "eclético", nex: 5, kind: "auto", name: "Eclético", page: 28, cost: "2 PE", summary: "Age como treinado em qualquer perícia." });
    out.push({
      id: "perito", nex: 5, kind: "auto", name: "Perito", page: 28,
      cost: scaled(nex, [[5, "2 PE"], [25, "3 PE"], [55, "4 PE"], [85, "5 PE"]]),
      summary: `Em duas perícias treinadas (exceto Luta e Pontaria), soma ${scaled(nex, [[5, "+1d6"], [25, "+1d8"], [55, "+1d10"], [85, "+1d12"]])} no teste.`,
    });
    if (nex >= 40) {
      out.push({
        id: "engenhosidade", nex: 40, kind: "auto", name: "Engenhosidade", page: 30,
        summary: nex >= 75 ? "No Eclético, +2 PE para veterano ou +4 PE para expert." : "No Eclético, +2 PE para agir como veterano.",
      });
    }
  } else if (s.classe === "3") {
    out.push({
      id: "escolhido", nex: 5, kind: "auto", name: "Escolhido pelo Outro Lado", page: 32,
      summary: `Conjura rituais até o ${scaled(nex, [[5, "1º"], [25, "2º"], [55, "3º"], [85, "4º"]])} círculo.`,
    });
  }

  const tr = OP_TRILHA_DATA[s.trilha];
  TRILHA_NEX.forEach((n, i) => {
    if (nex < n) return;
    if (tr) {
      const [name, summary] = tr.steps[i];
      out.push({ id: `trilha-${n}`, nex: n, kind: "auto", name, summary: `${s.trilha} · ${summary}`, page: tr.page });
    } else {
      out.push({ id: `trilha-${n}`, nex: n, kind: "trilha", name: "Habilidade de trilha", summary: "Escolha a trilha para liberar as habilidades." });
    }
  });
  POWER_NEX.forEach((n) => nex >= n && out.push({ id: `poder-${n}`, nex: n, kind: "power", name: cls.powerLabel, summary: "Escolha um poder.", page: cls.page + 1 }));
  ATTR_NEX.forEach((n) => nex >= n && out.push({ id: `atributo-${n}`, nex: n, kind: "attr", name: "Aumento de atributo", summary: "+1 em um atributo (máximo 5 por esta via)." }));
  GRADE_NEX.forEach((n) =>
    nex >= n &&
    out.push({
      id: `grau-${n}`, nex: n, kind: "grade", name: "Grau de treinamento",
      summary: `Suba o grau de ${cls.gradeBase + s.a.int} perícias treinadas (${cls.gradeBase} + INT).`,
    })
  );
  if (nex >= 50) out.push({ id: "versatilidade-50", nex: 50, kind: "versatility", name: "Versatilidade", summary: `Um ${cls.powerLabel.toLowerCase()} ou o 1º poder de outra trilha.` });

  return out.sort((a, b) => a.nex - b.nex);
}

/** PV e carga extras vindos de trilhas (somados em opCalc). */
export function opTrilhaBonus(s: Pick<OpSheet, "trilha" | "nex" | "a">): { pv: number; cargaAttr: number } {
  return {
    pv: s.trilha === "Tropa de Choque" && s.nex >= 10 ? Math.ceil(s.nex / 5) : 0,
    cargaAttr: s.trilha === "Técnico" && s.nex >= 10 ? s.a.int : 0,
  };
}

/** Linhas automáticas da tabela de habilidades (origem, classe, trilha e poderes escolhidos). */
export function opAutoAbilities(s: OpSheet): OpAbilityRow[] {
  const rows: OpAbilityRow[] = [];
  const o = OP_ORIGIN_DATA[s.origem];
  if (o) rows.push({ n: o.power, c: "", p: String(o.page), d: o.summary, src: `origem:${s.origem}` });
  const cls = OP_CLASS_INFO[s.classe];
  opSteps(s).forEach((st) => {
    if (st.kind === "auto") rows.push({ n: st.name, c: st.cost || "", p: st.page ? String(st.page) : "", d: st.summary, src: `classe:${st.id}` });
    const pick = s.choices?.[st.id];
    if ((st.kind === "power" || st.kind === "versatility") && pick) {
      const pw = cls?.powers.find((p) => p.name === pick);
      rows.push({ n: pick, c: "", p: pw ? String(cls!.page + 1) : "", d: pw?.summary || "", src: `escolha:${st.id}` });
    }
  });
  return rows;
}

/** Mantém as linhas automáticas em dia sem mexer nas que o jogador criou. */
export function syncOpAbilities(s: OpSheet): OpSheet["abilities"] {
  const auto = opAutoAbilities(s);
  const want = new Map(auto.map((r) => [r.src!, r]));
  const kept = s.abilities.filter((r) => !r.src || want.has(r.src));
  const next = kept.map((r) => {
    if (!r.src) return r;
    const w = want.get(r.src)!;
    // Custos e resumos que mudam com o NEX são atualizados; o resto o jogador pode editar.
    return { ...r, n: w.n, c: w.c || r.c, d: r.d && r.d !== w.d && !r.src.startsWith("classe:") ? r.d : w.d };
  });
  const have = new Set(next.map((r) => r.src).filter(Boolean));
  auto.forEach((r) => !have.has(r.src) && next.push(r));
  return next;
}

/**
 * Aplica as automações depois de qualquer mudança na ficha:
 * perícias da origem, aumento de atributo escolhido e habilidades automáticas.
 */
export function applyOpAutomation(prev: OpSheet, next: OpSheet): OpSheet {
  let s = { ...next, choices: { ...(next.choices || {}) }, autoSk: [...(next.autoSk || [])] };

  // Perícias treinadas pela origem.
  if (prev.origem !== s.origem || !next.autoSk) {
    const sk = { ...s.sk };
    s.autoSk.forEach((k) => {
      if (sk[k]?.t === 1) sk[k] = { ...sk[k], t: 0 };
    });
    const gained: string[] = [];
    (OP_ORIGIN_DATA[s.origem]?.skills || []).forEach((k) => {
      if (!sk[k]) return;
      if (sk[k].t === 0) {
        sk[k] = { ...sk[k], t: 1 };
        gained.push(k);
      }
    });
    s = { ...s, sk, autoSk: gained };
  }

  // Trocar de classe apaga a trilha e as escolhas da classe anterior.
  if (prev.classe !== s.classe) s.choices = {};

  // Aumentos de atributo: a escolha aplica (ou desfaz) o +1.
  const a = { ...s.a };
  ATTR_NEX.forEach((n) => {
    const id = `atributo-${n}`;
    const before = prev.choices?.[id];
    let after: string | undefined = s.choices[id];
    if (after && s.nex < n) {
      delete s.choices[id];
      after = undefined;
    }
    if (before === after) return;
    if (before && before in a && before !== "importado") a[before as OpAttr] = Math.max(0, a[before as OpAttr] - 1);
    if (after && after in a) a[after as OpAttr] = Math.min(7, a[after as OpAttr] + 1);
  });
  s.a = a;

  // Escolhas acima do NEX atual somem.
  Object.keys(s.choices).forEach((id) => {
    const n = Number(id.split("-").pop());
    if (Number.isFinite(n) && n > s.nex && !id.startsWith("atributo-")) delete s.choices[id];
  });

  s.abilities = syncOpAbilities(s);
  return s;
}
