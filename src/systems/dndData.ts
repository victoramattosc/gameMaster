// Dados mecânicos do Livro do Jogador de D&D (2024), extraídos do PDF da mesa:
// nomes das características, nível em que chegam e página. Nada de texto de regra.
// Gerado por script; para corrigir algo, edite aqui mesmo.
import type { DndAb } from "./dnd";

export interface DndFeature { level: number; name: string; page: number }
export interface DndSubclass { name: string; page: number; features: DndFeature[] }
export interface DndClassData {
  page: number;
  hd: number;
  primary: string;
  saves: DndAb[];
  skills: string;
  weapons: string;
  armor: string;
  features: DndFeature[];
  subclasses: DndSubclass[];
}
export interface DndBackground { name: string; page: number; attrs: DndAb[]; feat: string; skills: string[]; tool: string }

const f = (rows: [number, string, number][]): DndFeature[] => rows.map(([level, name, page]) => ({ level, name, page }));

export const DND_CLASSES: Record<string, DndClassData> = {
  "Bárbaro": {
    page: 51, hd: 12, primary: "Força", saves: ["for", "con"],
    skills: "Escolha 2: Atletismo, Intimidação, Lidar com Animais, Natureza, Percepção ou Sobrevivência",
    weapons: "Armas Simples e Marciais", armor: "Armaduras Leve e Média e Escudos",
    features: f([[1, "Fúria", 51], [1, "Defesa sem Armadura", 51], [1, "Maestria em Arma", 51], [2, "Ataque Imprudente", 52], [2, "Sentido de Perigo", 52], [3, "Conhecimento Primordial", 52], [3, "Subclasse de Bárbaro", 52], [4, "Aumento no Valor de Atributo", 52], [5, "Ataque Extra", 52], [5, "Movimento Rápido", 52], [7, "Bote Instintivo", 53], [7, "Instintos Primitivos", 53], [9, "Golpe Brutal", 53], [11, "Fúria Implacável", 53], [13, "Golpe Brutal Fortalecido", 53], [15, "Fúria Persistente", 53], [17, "Golpe Brutal Fortalecido", 53], [18, "Força Indomável", 53], [19, "Dádiva Épica", 53], [20, "Campeão Primitivo", 53]]),
    subclasses: [
      { name: "Trilha da Árvore do Mundo", page: 54, features: f([[3, "Vitalidade da Árvore", 54], [6, "Ramos da Árvore", 54], [10, "Raízes Devastadoras", 54], [14, "Percorrer a Árvore", 55]]) },
      { name: "Trilha do Berserker", page: 55, features: f([[3, "Frenesi", 55], [6, "Fúria Irracional", 55], [10, "Retaliação", 55], [14, "Presença Intimidante", 55]]) },
      { name: "Trilha do Coração Selvagem", page: 56, features: f([[3, "Arauto da Fauna", 56], [3, "Fúria dos Selvagens", 56], [6, "Aspecto dos Selvagens", 56], [10, "Arauto da Natureza", 56], [14, "Poder dos Selvagens", 56]]) },
      { name: "Trilha do Fanático", page: 57, features: f([[3, "Campeão dos Deuses", 57], [3, "Fúria Divina", 57], [6, "Concentração Fanática", 57], [10, "Presença Zelosa", 57], [14, "Fúria dos Deuses", 57]]) },
    ],
  },
  "Bardo": {
    page: 59, hd: 8, primary: "Carisma", saves: ["des", "car"],
    skills: "Escolha quaisquer 3 perícias (veja o capítulo 1)",
    weapons: "Armas Simples", armor: "Armadura Leve",
    features: f([[1, "Inspiração de Bardo", 59], [1, "Conjuração", 59], [2, "Especialista", 60], [2, "Pau pra Toda Obra", 60], [3, "Subclasse de Bardo", 60], [4, "Aumento no Valor de Atributo", 61], [5, "Fonte de Inspiração", 61], [7, "Contra-Encantamento", 61], [10, "Segredos Mágicos", 61], [18, "Inspiração Superior", 61], [19, "Dádiva Épica", 61], [20, "Palavras de Criação", 61]]),
    subclasses: [
      { name: "Colégio da Bravura", page: 64, features: f([[3, "Inspiração em Combate", 64], [3, "Treinamento Marcial", 64], [6, "Ataque Extra", 64], [14, "Magia de Batalha", 64]]) },
      { name: "Colégio da Dança", page: 65, features: f([[3, "Ginga Fascinante", 65], [6, "Gingado Coordenado", 65], [6, "Movimento Inspirador", 65], [14, "Evasão Liderada", 65]]) },
      { name: "Colégio do Conhecimento", page: 66, features: f([[3, "Palavras de Interrupção", 66], [3, "Proficiências Bônus", 66], [6, "Descobertas Mágicas", 66], [14, "Perícia Inigualável", 66]]) },
      { name: "Colégio do Glamour", page: 66, features: f([[3, "Magia Fascinante", 66], [3, "Manto de Inspiração", 67], [6, "Manto de Majestade", 67], [14, "Majestade Inquebrável", 67]]) },
    ],
  },
  "Bruxo": {
    page: 69, hd: 8, primary: "Carisma", saves: ["sab", "car"],
    skills: "Escolha 2: Arcanismo, Enganação, História, Intimidação, Investigação, Natureza ou Religião",
    weapons: "Armas Simples", armor: "",
    features: f([[1, "Invocações Místicas", 69], [1, "Magia de Pacto", 69], [2, "Astúcia Mágica", 70], [3, "Subclasse de Bruxo", 71], [4, "Aumento no Valor de Atributo", 71], [9, "Contatar Patrono", 71], [11, "Arcana Mística", 71], [19, "Dádiva Épica", 71], [20, "Mestre Místico", 71]]),
    subclasses: [
      { name: "Patrono Arquifada", page: 75, features: f([[3, "Magias de Pacto da Arquifada", 75], [3, "Passos Feéricos", 75], [6, "Fuga em Névoa", 75], [10, "Defesas Sedutoras", 75], [14, "Magia Sedutora", 75]]) },
      { name: "Patrono Celestial", page: 75, features: f([[3, "Luz Medicinal", 75], [3, "Magia de Pacto do Celestial", 75], [6, "Alma Radiante", 75], [10, "Resiliência Celestial", 77], [14, "Vingança Calcinante", 77]]) },
      { name: "Patrono Ínfero", page: 84, features: f([[3, "Bênção do Tenebroso", 79], [3, "Magias de Pacto do Ínfero", 79], [6, "A Sorte do Próprio Tenebroso", 79], [10, "Resistência Ínfera", 79], [14, "Lançar no Inferno", 79]]) },
      { name: "Patrono Grande Antigo", page: 83, features: f([[3, "Magias de Pacto do Grande Antigo", 83], [3, "Magias Psíquicas", 78], [3, "Mente Desperta", 78], [6, "Combatente Clarividente", 78], [10, "Danação Mística", 78], [10, "Escudo Mental", 78], [14, "Criar Servo", 78]]) },
    ],
  },
  "Clérigo": {
    page: 81, hd: 8, primary: "Sabedoria", saves: ["sab", "car"],
    skills: "Escolha 2: História, Intuição, Medicina, Persuasão ou Religião",
    weapons: "Armas Simples", armor: "Armaduras Leve e Média e Escudos",
    features: f([[1, "Conjuração", 81], [1, "Ordem Divina", 82], [2, "Canalizar Divindade", 82], [3, "Subclasse de Clérigo", 83], [4, "Aumento no Valor de Atributo", 83], [5, "Fulminar Mortos-Vivos", 83], [7, "Golpes Abençoados", 83], [10, "Intervenção Divina", 83], [14, "Golpes Abençoados Aprimorados", 83], [19, "Dádiva Épica", 83], [20, "Intervenção Divina Maior", 83]]),
    subclasses: [
      { name: "Domínio da Guerra", page: 85, features: f([[3, "Magias de Domínio da Guerra", 85], [3, "Ataque Direcionado", 85], [3, "Sacerdote da Guerra", 86], [6, "Bênção do Deus da Guerra", 86], [17, "Avatar da Guerra", 86]]) },
      { name: "Domínio da Luz", page: 86, features: f([[3, "Brilho do Amanhecer", 86], [3, "Labareda Protetora", 86], [3, "Magias de Domínio da Luz", 87], [6, "Labareda Protetora Aprimorada", 87], [17, "Coroa de Luz", 87]]) },
      { name: "Domínio da Trapaça", page: 87, features: f([[3, "Magias de Domínio da Trapaça", 88], [3, "Bênção do Trapaceiro", 88], [3, "Invocar Duplicidade", 88], [6, "Transposição do", 88], [17, "Duplicidade Aprimorada", 88]]) },
      { name: "Domínio da Vida", page: 89, features: f([[3, "Magias de Domínio da Vida", 89], [3, "Discípulo da Vida", 89], [3, "Preservar a Vida", 89], [6, "Curandeiro Abençoado", 89], [17, "Cura Suprema", 89]]) },
    ],
  },
  "Druida": {
    page: 91, hd: 8, primary: "Sabedoria", saves: ["int", "sab"],
    skills: "Escolha 2: Arcanismo, Lidar com Animais, Intuição, Medicina, Natureza, Percepção, Religião ou Sobrevivência",
    weapons: "Armas Simples", armor: "Armadura Leve e Escudos",
    features: f([[1, "Conjuração", 91], [1, "Idioma Druídico", 92], [1, "Ordem Primal", 92], [2, "Companheiro Selvagem", 92], [2, "Forma Selvagem", 92], [3, "Subclasse de Druida", 93], [4, "Aumento no Valor de Atributo", 93], [5, "Ressurgimento Selvagem", 93], [7, "Fúria Elemental", 93], [15, "Fúria Elemental Aprimorada", 93], [18, "Magias Bestiais", 93], [19, "Dádiva Épica", 94], [20, "Arquidruida", 94]]),
    subclasses: [
      { name: "Círculo da Lua", page: 96, features: f([[3, "Formas Animais dos", 96], [3, "Magias do Círculo da Lua", 96], [6, "Formas Animais dos Círculos", 96], [10, "Passo Lunar", 97], [14, "Forma Lunar", 97]]) },
      { name: "Círculo da Terra", page: 97, features: f([[3, "Auxílio da Terra", 97], [3, "Magias do Círculo da Terra", 97], [6, "Recuperação Natural", 98], [10, "Proteção Natural", 98], [14, "Santuário Natural", 98]]) },
      { name: "Círculo das Estrelas", page: 98, features: f([[3, "Forma Estrelada", 98], [3, "Mapa Estelar", 99], [6, "Presságio Cósmico", 100], [10, "Constelações Cintilantes", 100], [14, "Repleto de Estrelas", 100]]) },
      { name: "Círculo do Mar", page: 100, features: f([[3, "Ira do Mar", 101], [3, "Magias do Círculo do Mar", 101], [6, "Afinidade Aquática", 101], [10, "Filho da Tempestade", 101], [14, "Manifestação Oceânica", 101]]) },
    ],
  },
  "Feiticeiro": {
    page: 103, hd: 6, primary: "Carisma", saves: ["con", "car"],
    skills: "",
    weapons: "Armas Simples", armor: "",
    features: f([[1, "Conjuração", 103], [1, "Feitiçaria Inata", 104], [2, "Fonte de Magia", 104], [2, "Metamagia", 105], [3, "Subclasse de Feiticeiro", 105], [4, "Aumento no Valor de Atributo", 105], [5, "Restauração Feiticeira", 105], [7, "Feitiçaria Encarnada", 105], [19, "Dádiva Épica", 105], [20, "Apoteose Arcana", 105]]),
    subclasses: [
      { name: "Feitiçaria Aberrante", page: 109, features: f([[3, "Fala Telepática", 109], [3, "Magias Psiônicas", 109], [6, "Defesas Psíquicas", 110], [6, "Feitiçaria Psiônica", 110], [14, "Revelação em Carne", 110], [18, "Implosão de Distorção", 110]]) },
      { name: "Feitiçaria Dracônica", page: 110, features: f([[3, "Magias Dracônicas", 110], [3, "Resiliência Dracônica", 110], [6, "Afinidade Elemental", 110], [14, "Asas de Dragão", 110], [18, "Companheiro Dracônico", 110]]) },
      { name: "Feitiçaria Mecânica", page: 110, features: f([[3, "Magias Mecânicas", 110], [3, "Restaurar Equilíbrio", 110], [6, "Bastião da Lei", 110], [14, "Transe da Ordem", 110], [18, "Cavalgada Mecânica", 110]]) },
      { name: "Feitiçaria Selvagem", page: 113, features: f([[3, "Marés do Caos", 113], [3, "Surto de Magia Selvagem", 113], [6, "Distorcer a Sorte", 113], [14, "Caos Controlado", 113], [18, "Surto Controlado", 114]]) },
    ],
  },
  "Guardião": {
    page: 117, hd: 10, primary: "Destreza e Sabedoria", saves: ["for", "des"],
    skills: "Escolha 3: Atletismo, Furtividade, Intuição, Investigação, Lidar com Animais, Natureza, Percepção ou Sobrevivência",
    weapons: "Armas Simples e Marciais", armor: "Armaduras Leves, Médias e Escudos",
    features: f([[1, "Conjuração", 117], [1, "Inimigo Favorito", 117], [1, "Maestria em Arma", 118], [2, "Estilo de Luta", 118], [2, "Explorador Hábil", 118], [3, "Subclasse de Guardião", 118], [4, "Aumento no Valor de Atributo", 118], [5, "Ataque Extra", 118], [6, "Errante", 118], [9, "Especialista", 119], [10, "Incansável", 119], [13, "Predador Implacável", 119], [14, "Véu da Natureza", 119], [17, "Caçador Preciso", 119], [18, "Sentidos Selvagens", 119], [19, "Dádiva Épica", 119], [20, "Matador de Inimigos Favoritos", 119]]),
    subclasses: [
      { name: "Andarilho Feérico", page: 120, features: f([[3, "Glamour Transcendental", 120], [3, "Golpes Terríveis", 120], [3, "Magias do Andarilho Feérico", 120], [7, "Detalhe Sedutor", 120], [11, "Reforços Feéricos", 120], [15, "Andarilho Nebuloso", 120]]) },
      { name: "Caçador", page: 120, features: f([[3, "Conhecimento do Caçador", 122], [3, "Presa do Caçador", 122], [7, "Táticas Defensivas", 122], [11, "Presa do Caçador Superior", 122], [15, "Defesa do Caçador", 122]]) },
      { name: "Senhor das Feras", page: 122, features: f([[3, "Companheiro Primal", 122], [7, "Treinamento Excepcional", 124], [11, "Fúria Bestial", 124], [15, "Compartilhar Magias", 124]]) },
      { name: "Vigilante das Sombras", page: 124, features: f([[3, "Magias do Vigilante das Sombras", 125], [3, "Emboscador das Sombras", 124], [3, "Visão Umbrosa", 125], [7, "Mente de Ferro", 125], [11, "Torrente do Vigilante", 125], [15, "Esquiva Sombria", 125]]) },
    ],
  },
  "Guerreiro": {
    page: 127, hd: 10, primary: "Força ou Destreza", saves: ["for", "con"],
    skills: "Escolha 2: Acrobacia, Atletismo, História, Intimidação, Intuição, Lidar com Animais, Percepção, Persuasão ou Sobrevivência",
    weapons: "Armas Simples e Marciais", armor: "Armaduras Leves, Médias e Pesadas e Escudos",
    features: f([[1, "Estilo de Luta", 127], [1, "Maestria em Arma", 127], [1, "Recuperar Fôlego", 127], [2, "Mente Tática", 127], [2, "Surto de Ação", 128], [3, "Subclasse de Guerreiro", 128], [4, "Aumento no Valor de Atributo", 128], [5, "Ajuste Tático", 128], [5, "Ataque Extra", 128], [9, "Indomável", 128], [9, "Mestre Tático", 128], [11, "Dois Ataques Extras", 128], [13, "Ataques Estudados", 128], [19, "Dádiva Épica", 128], [20, "Três Ataques Extras", 129]]),
    subclasses: [
      { name: "Campeão", page: 129, features: f([[3, "Atleta Extraordinário", 129], [3, "Crítico Aprimorado", 129], [7, "Estilo de Luta Adicional", 129], [10, "Combatente Heroico", 129], [15, "Crítico Superior", 129], [18, "Sobrevivente", 129]]) },
      { name: "Cavaleiro Místico", page: 130, features: f([[3, "Conjuração", 130], [3, "Vínculo com Arma", 131], [7, "Magia de Guerra", 131], [10, "Golpe Místico", 131], [15, "Investida Mística", 132], [18, "Magia de Guerra Aprimorada", 132]]) },
      { name: "Combatente Psíquico", page: 132, features: f([[3, "Poder Psiônico", 132], [7, "Adepto Telecinético", 133], [10, "Resguardo Mental", 133], [15, "Baluarte de Energia", 133], [18, "Mestre Telecinético", 133]]) },
      { name: "Mestre da Batalha", page: 133, features: f([[3, "Estudioso da Guerra", 133], [3, "Superioridade em Combate", 133], [7, "Conheça Seu Inimigo", 133], [10, "Superioridade em", 134], [15, "Implacável", 134], [18, "Superioridade em", 134]]) },
    ],
  },
  "Ladino": {
    page: 137, hd: 8, primary: "Destreza", saves: ["des", "int"],
    skills: "Escolha 4: Acrobacia, Atletismo, Enganação, Furtividade, Intimidação, Intuição, Investigação, Percepção, Persuasão ou Prestidigitação",
    weapons: "Armas Simples e Armas Mar- ciais que tem a propriedade Acuidade ou Leve", armor: "Armadura Leve",
    features: f([[1, "Ataque Furtivo", 137], [1, "Especialista", 137], [1, "Gíria do Ladrão", 137], [1, "Maestria em Arma", 137], [2, "Ação Ardilosa", 137], [3, "Mira Firme", 138], [3, "Subclasse de Ladino", 138], [4, "Aumento no Valor de Atributo", 138], [5, "Golpe Astuto", 138], [5, "Esquiva Sobrenatural", 138], [7, "Evasão", 138], [7, "Talento Confiável", 138], [11, "Golpe Astuto Aprimorado", 138], [14, "Golpes Sujos", 138], [15, "Mente Escorregadia", 138], [18, "Elusivo", 138], [19, "Dádiva Épica", 138], [20, "Golpe de Sorte", 138]]),
    subclasses: [
      { name: "Adaga Espiritual", page: 138, features: f([[3, "Lâminas Psíquicas", 140], [3, "Poder Psiônico", 140], [9, "Lâminas da Alma", 140], [13, "Véu Psíquico", 140], [17, "Rasgar Mente", 140]]) },
      { name: "Assassino", page: 140, features: f([[3, "Assassinar", 142], [3, "Ferramentas de Assassino", 142], [9, "Especialista em Infiltração", 142], [13, "Armas Venenosas", 142], [17, "Golpe Mortal", 142]]) },
      { name: "Ladrão", page: 142, features: f([[3, "Andarilho de Telhados", 142], [3, "Mão Leve", 142], [9, "Furtividade Suprema", 143], [13, "Usar Dispositivo Mágico", 143], [17, "Reflexos de Ladrão", 143]]) },
      { name: "Trapaceiro Arcano", page: 143, features: f([[3, "Conjuração", 143], [3, "Mãos Mágicas Ligeiras", 145], [9, "Emboscada Mágica", 145], [13, "Trapaceiro Versátil", 145], [17, "Ladrão de Magias", 145]]) },
    ],
  },
  "Mago": {
    page: 147, hd: 6, primary: "Inteligência", saves: ["int", "sab"],
    skills: "Escolha 2: Arcanismo, História, Intuição, Investigação, Medicina, Natureza ou Religião",
    weapons: "Armas Simples", armor: "",
    features: f([[1, "Adepto de Ritual", 147], [1, "Conjuração", 147], [1, "Recuperação Arcana", 148], [2, "Acadêmico", 148], [3, "Subclasse de Mago", 149], [4, "Aumento no Valor de Atributo", 149], [5, "Memorizar Magia", 149], [18, "Maestria de Magias", 149], [19, "Dádiva Épica", 149], [20, "Assinatura Mágica", 149]]),
    subclasses: [
      { name: "Abjurador", page: 154, features: f([[3, "Proteção Arcana", 154], [3, "Versado em Abjuração", 154], [6, "Proteção Projetada", 154], [10, "Rompe-Magia", 155], [14, "Resistência à Magia", 155]]) },
      { name: "Adivinhador", page: 155, features: f([[3, "Prodígio", 155], [3, "Versado em Adivinhação", 155], [6, "Perito em Adivinhação", 155], [10, "O Terceiro Olho", 155], [14, "Prodígio Maior", 155]]) },
      { name: "Evocador", page: 156, features: f([[3, "Truque Potente", 156], [3, "Versado em Evocação", 156], [6, "Esculpir Magias", 156], [10, "Evocação Potencializada", 156], [14, "Sobrecarga", 156]]) },
      { name: "Ilusionista", page: 156, features: f([[3, "Ilusões Aprimoradas", 156], [3, "Versado em Ilusão", 156], [6, "Criaturas Espectrais", 156], [10, "Autoimagem Ilusória", 156], [14, "Realidade Ilusória", 156]]) },
    ],
  },
  "Monge": {
    page: 159, hd: 8, primary: "Destreza e Sabedoria", saves: ["for", "des"],
    skills: "Escolha 2: Acrobacia, Atletismo, Furtividade, História, Intuição ou Religião",
    weapons: "Armas Simples e Marciais que têm a propriedade Leve", armor: "Nenhuma",
    features: f([[1, "Artes Marciais", 159], [1, "Defesa sem Armadura", 159], [2, "Foco do Monge", 160], [2, "Metabolismo Incomum", 160], [2, "Movimento sem Armadura", 160], [3, "Defletir Ataques", 160], [3, "Subclasse de Monge", 161], [4, "Aumento no Valor de Atributo", 161], [4, "Queda Lenta", 161], [5, "Ataque Extra", 161], [5, "Golpe Atordoante", 161], [6, "Golpes Potencializados", 161], [7, "Evasão", 161], [9, "Movimento Acrobático", 161], [10, "Foco Aprimorado", 161], [10, "Restauro Pessoal", 161], [13, "Defletir Energia", 161], [14, "Sobrevivente Disciplinado", 161], [15, "Foco Perfeito", 161], [18, "Defesa Superior", 161], [19, "Dádiva Épica", 161], [20, "Corpo e Mente", 161]]),
    subclasses: [
      { name: "Combatente da Misericórdia", page: 168, features: f([[3, "Implementos de Misericórdia", 162], [3, "Mão de Cura", 163], [3, "Mão de Dolo", 163], [6, "Toque de Médico", 163], [11, "Torrente de Cura e Dolo", 163], [17, "Mão da Misericórdia Final", 163]]) },
      { name: "Combatente da Mão Espalmada", page: 162, features: f([[3, "Técnica da Mão Espalmada", 162], [6, "Integridade Corporal", 162], [11, "Passo Veloz", 162], [17, "Palma Vibrante", 162]]) },
      { name: "Combatente das Sombras", page: 169, features: f([[3, "Artes das Sombras", 164], [6, "Passo da Sombra", 164], [11, "Passo da Sombra Aprimorado", 164], [17, "Manto da Sombra", 164]]) },
      { name: "Combatente dos Elementos", page: 164, features: f([[3, "Manipular Elementos", 164], [3, "Sintonia Elemental", 164], [6, "Explosão Elemental", 165], [11, "Passo dos Elementos", 165], [17, "Ápice Elemental", 165]]) },
    ],
  },
  "Paladino": {
    page: 167, hd: 10, primary: "Força e Carisma", saves: ["sab", "car"],
    skills: "Escolha 2: Atletismo, Intimidação, Intuição, Medicina, Persuasão ou Religião",
    weapons: "Armas Simples e Marciais", armor: "Armaduras Leves, Médias, Pesadas e Escudos",
    features: f([[1, "Conjuração", 167], [1, "Maestria em Arma", 168], [1, "Mãos Consagradas", 168], [2, "Destruição do Paladino", 168], [2, "Estilo de Luta", 168], [3, "Canalizar Divindade", 168], [3, "Subclasse de Paladino", 169], [4, "Aumento no Valor de Atributo", 169], [5, "Ataque Extra", 169], [5, "Montaria Fiel", 169], [6, "Aura de Proteção", 169], [9, "Repudiar Inimigos", 169], [10, "Aura de Coragem", 169], [11, "Golpes Radiantes", 169], [14, "Toque Restaurador", 169], [18, "Aura Expandida", 169], [19, "Dádiva Épica", 169]]),
    subclasses: [
      { name: "Juramento da Devoção", page: 171, features: f([[3, "Magias do Juramento da Devoção", 171], [3, "Arma Sagrada", 171], [7, "Aura de Devoção", 172], [15, "Destruição Protetora", 172], [20, "Resplendor Sagrado", 172]]) },
      { name: "Juramento da Glória", page: 172, features: f([[3, "Magias do Juramento da Glória", 173], [3, "Atleta Inigualável", 173], [3, "Destruição Inspiradora", 173], [7, "Aura de Vivacidade", 173], [15, "Defesa Gloriosa", 173], [20, "Lenda Viva", 173]]) },
      { name: "Juramento dos Anciões", page: 174, features: f([[3, "Magias do Juramento dos Anciões", 174], [3, "A Ira da Natureza", 174], [7, "Aura de Resistência", 175], [15, "Sentinela Imortal", 175], [20, "Campeão Ancestral", 175]]) },
      { name: "Juramento da Vingança", page: 179, features: f([[3, "Magias do Juramento da Vingança", 179], [3, "Voto de Inimizade", 173], [7, "Vingador Implacável", 174], [15, "Alma Vingativa", 174], [20, "Anjo Vingador", 174]]) },
    ],
  },
};

export const DND_BACKGROUNDS: DndBackground[] = [
  { name: "Acólito", page: 178, attrs: ["int", "sab", "car"], feat: "Iniciado em Magia (Clérigo)", skills: ["Intuição", "Religião"], tool: "Suprimentos de Calígrafo" },
  { name: "Andarilho", page: 178, attrs: ["des", "sab", "car"], feat: "Sortudo", skills: ["Furtividade", "Intuição"], tool: "Ferramentas de Ladrão" },
  { name: "Artesão", page: 179, attrs: ["for", "des", "int"], feat: "Artifista", skills: ["Investigação", "Persuasão"], tool: "Escolha um tipo de Ferramen- tas de Artesão (veja o capítulo 6)" },
  { name: "Artista", page: 179, attrs: ["for", "des", "car"], feat: "Músico", skills: ["Acrobacia", "Atuação"], tool: "Escolha um tipo de Instru- mento Musical (veja o capítulo 6)" },
  { name: "Charlatão", page: 180, attrs: ["des", "con", "car"], feat: "Habilidoso", skills: ["Enganação", "Prestidigitação"], tool: "Kit de Falsificação" },
  { name: "Criminoso", page: 180, attrs: ["des", "con", "int"], feat: "Alerta", skills: ["Furtividade", "Prestidigitação"], tool: "Ferramentas de Ladrão" },
  { name: "Eremita", page: 181, attrs: ["con", "sab", "car"], feat: "Curandeiro", skills: ["Medicina", "Religião"], tool: "Kit de Herbalismo" },
  { name: "Escriba", page: 181, attrs: ["des", "int", "sab"], feat: "Habilidoso", skills: ["Investigação", "Percepção"], tool: "Suprimentos de Calígrafo" },
  { name: "Fazendeiro", page: 182, attrs: ["for", "con", "sab"], feat: "Vigoroso", skills: ["Lidar com Animais", "Natureza"], tool: "Ferramentas de Carpinteiro" },
  { name: "Guarda", page: 182, attrs: ["for", "int", "sab"], feat: "Alerta", skills: ["Atletismo", "Percepção"], tool: "Escolha um tipo de Kit de Jogos (veja o capítulo 6)" },
  { name: "Guia", page: 183, attrs: ["des", "con", "sab"], feat: "Iniciado em Magia (Druida)", skills: ["Furtividade", "Sobrevivência"], tool: "Ferramentas de Cartógrafo" },
  { name: "Marinheiro", page: 183, attrs: ["for", "des", "sab"], feat: "Valentão de Taverna", skills: ["Acrobacia", "Percepção"], tool: "Ferramentas de Navegador" },
  { name: "Mercador", page: 184, attrs: ["con", "int", "car"], feat: "Sortudo", skills: ["Lidar com Animais", "Persuasão"], tool: "Ferramentas de Navegador" },
  { name: "Nobre", page: 184, attrs: ["for", "int", "car"], feat: "Habilidoso", skills: ["História", "Persuasão"], tool: "Escolha um tipo de Kit de Jogos (veja o capítulo 6)" },
  { name: "Sábio", page: 185, attrs: ["con", "int", "sab"], feat: "Iniciado em Magia (Mago)", skills: ["Arcanismo", "História"], tool: "Suprimentos de Calígrafo" },
  { name: "Soldado", page: 185, attrs: ["for", "des", "con"], feat: "Atacante Selvagem", skills: ["Atletismo", "Intimidação"], tool: "Escolha um tipo de Kit de Jogos (veja o capítulo 6)" },
];
