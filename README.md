# ENIA v6

Site institucional de sete páginas + **Radar IA Act**, o observatório regulatório
diário que substitui `eniaportugal.netlify.app`.

Sem build step, sem framework, sem dependências em runtime. HTML estático, um
CSS, um JS e JSON.

---

## 1. Estrutura

```
enia-v3/
├── index.html          Home — 7 slides, rail alterna de lado por slide
├── radar.html          Radar IA Act — 9 secções, dados INE / AICEP / ANIA
├── sobre.html          Sobre a ENIA e a estrutura em Colégios
├── estrategia.html     Estratégia Nacional — produtividade e IA agêntica
├── certificacao.html   Certificação AI Act — risco, 42 documentos, prazos
├── capacitacao.html    Capacitação — CENSUS IA e literacia (Art. 4.º)
├── teste.html          Teste de classificação de risco AI Act (9 perguntas)
├── noticias.html       Arquivo de notícias com calendário e pesquisa
├── contactos.html      Contactos → jorge.saraiva@enia.pt
├── assets/
│   ├── enia.css              sistema de design completo
│   ├── enia.js               rail, alternância de lado, utilitários
│   ├── teste-dados.js        conteúdo do teste, PT e EN lado a lado
│   ├── enia-mark.svg         marca oficial (branca) + variante preta
│   ├── enia-monogram.svg     monograma de linha (branco) + variante preta
│   ├── favicon.svg           gerado a partir da marca
│   └── hero-sky.jpg          fotografia extraída do site.af
├── data/
│   ├── radar.json            todos os indicadores curados
│   ├── news.json             feed regulatório (reescrito diariamente)
│   ├── news.manual.json      publicações próprias, sempre incluídas
│   ├── sources.json          registo de fontes oficiais (todas verificadas)
│   ├── news-archive.json     arquivo integral, nunca truncado
│   ├── history/              retratos diários + series.json
│   └── bundle.js             gerado — permite abrir o site em file://
├── en/                       gerado — as 9 páginas em inglês (commitado)
├── marketplace.html          Marketplace de IA Ética — listagem + agregado
├── standalone/               gerado — 20 páginas autónomas, PT + EN
├── scripts/  sync.mjs · history.mjs · bundle.mjs · i18n.mjs · dict.mjs · standalone.mjs
├── api/refresh-data.js  ·  .github/workflows/radar-daily.yml
└── netlify.toml · vercel.json · package.json · robots.txt · sitemap.xml
```

```bash
npm run serve        # http://localhost:4000
npm run sync         # recolha manual das fontes oficiais
npm run i18n         # regenera en/ a partir do dicionário
npm run build        # histórico + bundle + inglês + build autónoma
npm run standalone   # só as páginas autónomas
```

### ⚠ Abrir o site fora do servidor

O site é multi-ficheiro: `index.html` precisa de `assets/enia.css`,
`assets/enia.js` e `data/bundle.js`. **Descarregar só o HTML dá uma página sem
estilo nenhum** — é o comportamento normal de um browser quando o CSS não
existe, não uma avaria.

Três formas de o ver bem:

1. **`enia-v3.zip`** — descompactar e abrir `index.html` de dentro da pasta.
2. **`npm run serve`** — servidor local em `localhost:4000`. É o mais fiel.
3. **`standalone/`** — nove páginas com CSS, JS, dados e logótipos embutidos.
   Cada ficheiro funciona sozinho: abre por duplo clique de qualquer sítio,
   envia-se por e-mail, cabe numa pen. É a pasta a usar para mostrar a alguém
   sem publicar nada.

A build autónoma pesa cerca de 85 KB por página contra 8 a 27 KB na versão
normal, porque cada ficheiro carrega a sua própria cópia do CSS. Em produção usa-se
sempre a versão normal — uma só cópia do CSS, em cache para todo o site.

---

## 2. Branding

| Ficheiro entregue | Origem | Onde é usado |
|---|---|---|
| `enia-mark.svg` | `LogoWhite.svg` | topo da rail, rodapé de todas as páginas |
| `enia-mark-black.svg` | `LogoBlack.svg` | reserva para fundos claros |
| `enia-monogram.svg` | `logolinewhite.svg` | monograma gigante da página principal |
| `enia-monogram-black.svg` | `logolineblack.svg` | reserva |
| `favicon.svg` | gerado da marca | separador do browser, atalhos |

O favicon é a marca em lima sobre navy, com cantos arredondados a 640/3000 do
raio — legível a 16 px.

---

## 3. Sistema de design

### Tipografia — Inter

A Helvetica Neue foi substituída por **Inter** em todo o site. A razão é
concreta: a Helvetica fecha as aberturas das letras e perde legibilidade abaixo
dos 14px, que é exatamente onde vive a maior parte do texto de um observatório —
notas de fonte, legendas de gráficos, corpo de cartão. A Inter foi desenhada
para ecrã nesses tamanhos: altura-x alta, aberturas abertas, algarismos
tabulares nativos.

Carregada como fonte variável com eixo óptico (`opsz 14..32`), o que ajusta
automaticamente o contraste dos traços entre um título de 5rem e uma legenda de
0,66rem.

Três mudanças acompanham a fonte, e são elas que resolvem o problema que
apontou na figura:

| | v4 | v5 |
|---|---|---|
| Peso do corpo | 300 | **400** |
| Opacidade das notas | .55 | **.75** |
| Opacidade do corpo dos cartões | .68 | **.86** |
| Entrelinha do corpo | 1.5 | **1.55** |
| `h3` / `h4` | 500 | **600** |

O peso 300 em texto pequeno sobre fundo claro era o principal problema de
leitura. Não é a fonte que estava errada — era o peso.

### Cor — regra única para quadrados

Antes, os cartões eram transparentes e herdavam o fundo da secção: numa banda
clara ficavam claros, e o texto pequeno a 300 desaparecia. Agora vale uma regra
só, em todo o site:

- **Quadrados sempre escuros, texto branco, números e destaques a lima.**
- **Um por grupo é o destaque: lima com texto escuro.**
- **Se a banda é lima, o destaque passa a quase-preto** (`#05090D`), porque
  lima sobre lima não existe.

Tudo isto vive em seis variáveis que cada banda redefine — `--card-bg`,
`--card-fg`, `--card-line`, `--card-num`, `--hi-bg`, `--hi-fg`. Nenhum
componente sabe em que fundo está.

Sobre fundos escuros o quadrado usa `#22384E`, uma superfície elevada. A
escolha não é estética: `#0C1826` sobre `#132333` dava 1,12 de separação e o
cartão desaparecia no fundo. `#22384E` dá 1,33 e mantém o texto a 12:1.

| Banda | Quadrado | Texto | Nº lima | Destaque | Separação |
|---|---|---|---|---|---|
| ink | `#22384E` | 12.0 | 9.6 | lima | 1.33 |
| deep | `#22384E` | 12.0 | 9.6 | lima | 1.48 |
| paper | `#132333` | 16.0 | 12.8 | lima | 15.96 |
| mist | `#132333` | 16.0 | 12.8 | lima | 13.70 |
| lime | `#132333` | 16.0 | 12.8 | `#05090D` a 20.0 | 12.79 |

Todos acima de AA; a maioria acima de AAA.

## 4. A rail

Navega entre **páginas**, nunca entre slides.

**Fechada** (`clamp(58px, 4.4vw, 78px)`): a marca ENIA **no topo**, o seletor
**PT / EN** no fundo, e nada entre os dois. A língua ativa fica a lima. Uma
seta discreta sob a marca acende ao aproximar o ponteiro — é a única afordância,
e sem ela não haveria como descobrir que a barra abre, sobretudo em toque.

**Aberta** (`clamp(276px, 25vw, 394px)`): as nove páginas do site, começando em
**Home**, mais o botão «Integrar o cluster» e o carimbo da última atualização.
Abre ao aproximar o ponteiro, por clique e por teclado; fecha com `Escape`,
clique fora ou saída do ponteiro.

**Bug corrigido na v4:** na v3 o painel fechado continuava a ocupar metade da
barra em flexbox, empurrando a marca para o centro da metade de cima. Era isto
que dava o efeito de logótipo «meio escondido». Fechado, o painel passou a ter
`flex:0 0 0` e altura zero.

**Alternância de lado:**

| Contexto | Comportamento |
|---|---|
| Home | alterna a cada slide — slide 1 à direita, 2 à esquerda, e assim por diante |
| Restantes páginas | lado fixo, definido no mapa de páginas em `enia.js` |

Toda a mecânica vive em dois atributos no `<html>`: `data-page` e `data-side`.

### Acrescentar uma página

Uma só edição, em `assets/enia.js`:

```js
{ id: 'nova', file: 'nova.html', label: 'Nome completo',
  spine: 'Nome curto', side: 'left' }
```

Depois criar `nova.html` com `data-page="nova"` no `<html>` e acrescentar o
`id` a `SPINE` se quiser que apareça na espinha. A rail passa a incluir a página
em todo o site.

---

## 5. Home — 7 slides

Volta ao formato em slides da primeira v3, com scroll vertical e snap. **Não há
navegação entre slides**: revelam-se por scroll, e a rail não os indexa.

| # | Slide | Banda |
|---|---|---|
| 01 | Portugal vai chegar à frente + escada de estatísticas | ink |
| 02 | Medir, comparar e acelerar — 4 territórios | paper |
| 03 | O que construímos enquanto o país decide — 3 motores | deep |
| 04 | O que mudou desde ontem — notícias | paper |
| 05 | O caso finlandês | ink |
| 06 | As verdades que ninguém vos diz | lime |
| 07 | Integrar o cluster — contactos e colégios | deep |

O slide 01 mantém o desenho de `mainpage.pdf`.

- **Slogan reduzido** a «Portugal vai chegar à frente!», com «Era da IA ética»
  como eyebrow.
- **Monograma em grande** no canto inferior esquerdo, sangrado 24% abaixo do
  limite do ecrã, a 12% de opacidade — o posicionamento pouco usual que pedia.
  Ajustável em `.home__brand` (largura, `opacity`, `translate`).
- **Escada de estatísticas** à direita: base larga de três factos, subindo para
  a contagem de dias e culminando na célula lima com a avaliação de Portugal.
  A leitura sobe da esquerda para a direita e termina no número que importa.

### A escada — medida no `mainpage.pdf`, não aproximada

Amostrei as cores do PDF de referência antes de escrever o CSS. O que a medição
devolveu:

| Elemento | Medido no PDF | Implementado |
|---|---|---|
| Fundo da célula | `#132333` | `transparent` — herda a secção |
| Célula de destaque | `#DCF081` sólido | `var(--hi-bg)` |
| Linha | `#354555`, 1px | `rgba(255,255,255,.15)` → `#364452`, desvio 5 |
| Células vazias | sem fundo, sem linha | `box-shadow:none` |

Três decisões que daí saíram:

1. **A célula não tem preenchimento próprio.** É a única exceção à regra dos
   quadrados escuros do resto do site — e é deliberada: aqui o fundo *é* a
   secção, e o que define a célula é a linha, não a superfície.
2. **`box-shadow` em vez de `border`.** Duas células adjacentes com `border:1px`
   dariam uma linha de 2px entre elas. Com `box-shadow: 0 0 0 1px`, as sombras
   das vizinhas ocupam a mesma banda e a linha fica com peso único, como no PDF.
3. **Os números são sempre lima, exceto na célula lima**, onde passam a escuros
   (`--hi-num`). Uma regra, duas linhas de CSS, nenhuma exceção manual.

As quatro posições vazias existem no markup como `.cell--void` sem linha e sem
fundo. São o que quebra a grelha e isola a avaliação.

```
 ·      ·      40%   ← lima, números escuros
 ·     6 dias   ·
17%    8/27   38,7%  ← números lima, linha de 1px
```

**Tudo atualiza diariamente**, a partir de `data/radar.json`:

| Elemento | Origem |
|---|---|
| Faixa `40%` | derivado de `countries` — pontuação de Portugal e posição |
| Célula `7 dias` | calculada ao vivo a partir de `deadlines` |
| Três células | `highlights` — factos curados com fonte |

O texto «oitavo em 12 países avaliados diariamente» é gerado, não escrito: se a
pontuação de Portugal mudar, a frase muda com ela.

---

## 5b. Bandas de cor

Novidade estrutural da v4. Cada secção de cada página declara o seu tom e
redefine o contexto de cor. Os componentes nunca sabem em que fundo estão — leem
sempre `--line`, `--num`, `--fill-bg`, `--fill-fg` e `--soft` do contexto.

```css
.band--paper{--bg:#FFF;--fg:var(--ink);--num:var(--ink);--fill-bg:var(--lime)}
.band--lime {--bg:var(--lime);--fg:var(--ink);--num:var(--ink);--fill-bg:var(--ink)}
```

Cinco tons: `ink`, `deep`, `paper`, `mist`, `lime`. O ritmo por página:

| Página | Sequência |
|---|---|
| Home | ink · paper · deep · paper · ink · lime · deep |
| Radar | ink · deep · paper · mist · paper · deep · mist · paper · deep · ink |
| Sobre | ink · paper · deep · mist · paper · lime · ink |
| Estratégia | ink · paper · mist · deep · paper · lime · ink |
| Certificação | ink · paper · deep · mist · paper · ink · lime · deep |
| Capacitação | ink · mist · paper · deep · lime · ink |
| Contactos | ink · paper · mist · deep |
| Notícias | ink · paper — o arquivo em papel, para leitura longa |
| Teste | ink · paper · deep — **uma banda por fase**: intro, perguntas, resultado |

No teste de classificação a cor faz trabalho semântico: cada fase muda de fundo,
por isso o progresso sente-se sem ler a barra. As perguntas ficam em papel — são
o único ecrã com leitura longa de listas de opções.

**A troca de `--num` é o que torna isto seguro.** Nos fundos escuros os números
são lima; nos claros passam a ink. Lima sobre branco daria 1,4:1 — ilegível.
Verificado: todas as cinco bandas passam AAA, com o texto entre 12,8:1 e 17,9:1.

---

## 6. Radar IA Act

| # | Secção | Origem |
|---|---|---|
| 01 | Prazos vinculativos | `deadlines`, contagem ao vivo |
| 02 | Índice de Prontidão UE | `countries` |
| 03 | Preparação por sector | `sectors` |
| 04 | **Estado da IA em Portugal · INE** | `ine` |
| 05 | **Economia digital · AICEP** | `aicep` |
| 06 | **Agenda Nacional de IA** | `ania` |
| 07 | Arquitetura de enforcement | `checklist` |
| 08 | Feed regulatório | `news.json` |
| 09 | Metodologia e fontes | `sources` |

### Secção 04 — INE

Dados reais do IUTICE 2025 (Empresas publicado a 21 de novembro de 2025;
Famílias com recolha de maio a agosto de 2025):

- **11,5%** das empresas com 10+ pessoas usam IA, +2,9 p.p. face a 2024
- **49,1%** nas empresas de 250+ pessoas contra **9,4%** nas de 10 a 49
- **38,7%** das pessoas dos 16 aos 74 anos, subindo a **76,5%** nos 16-24 e
  **81,5%** entre estudantes
- Barreiras: falta de conhecimentos **74,4%**, custos **60,4%**, incerteza legal
  **57,3%**, privacidade **55,4%**

### Secção 06 — Agenda Nacional de IA

Acompanhamento de 14 das 32 iniciativas da ANIA (RCM n.º 2/2026, PAANIA
2026-2030), com estado atribuído pela ENIA a partir de informação pública:
confirmada, em curso, ou **sem informação pública** — e a nota explica
explicitamente que isso significa ausência de evidência publicada, não ausência
de execução.

### Regra editorial gravada na arquitetura

O sync automático **nunca** toca nos indicadores. Só escreve `generated` e
`version`. Prontidão, sectores, checklist, INE, AICEP e ANIA mudam por commit
humano. Se a ENIA vende intel fiável, o pipeline não pode ser capaz de inventar
um número sozinho.

---

## 7. Divergência de números — e porque a expusemos

O DESI da Comissão aponta ~17% de adoção empresarial de IA em Portugal. O INE
apura 11,5% em 2025. **Ambos estão no site, com a fonte à frente.**

Não é contradição, é âmbito: o INE cobre apenas empresas com 10 ou mais pessoas
ao serviço e a pergunta europeia sobre tecnologias de IA mudou de formulação
entre edições. A secção 04 do Radar tem uma caixa dedicada a explicar isto.

Esta decisão é deliberada e vale a pena defendê-la em reunião: um radar que
escolhe o número mais favorável ao seu próprio argumento deixa de ser um radar.
Expor a divergência antes de alguém a apontar é o que separa uma fonte credível
de material de campanha.

---

## 8. Atualização diária

```
23:00 UTC ─┬─ node scripts/sync.mjs
           ├─ lê data/sources.json
           ├─ recolhe RSS/Atom + SPARQL do EUR-Lex
           ├─ filtra por janela de 45 dias + palavras-chave
           ├─ reescreve em pt-PT (API Anthropic, opcional)
           ├─ junta data/news.manual.json (sempre)
           ├─ regenera data/bundle.js
           └─ commit de data/*.json  →  Netlify publica
```

Duas execuções (22:00 e 23:00 UTC) cobrem CET e CEST; a segunda não faz commit
se nada mudou. `ANTHROPIC_API_KEY` é opcional: sem chave, o feed usa o título e
resumo originais; com chave, cada item é reescrito como notícia em português com
uma frase sobre o que muda em concreto para Portugal.

**Opção Vercel:** `vercel.json` traz o cron e `api/refresh-data.js` dispara o
mesmo workflow — o filesystem serverless é read-only, portanto delega no
repositório para não haver duas fontes de verdade.

### Fontes verificadas a 26/07/2026

| Fonte | Estado |
|---|---|
| ANACOM · Notícias | `rssFeed.jsp?categoryId=406877` ✓ |
| ANACOM · Legislação | `rssFeed.jsp?categoryId=1644` ✓ |
| ANACOM · Imprensa | `rssFeed.jsp?categoryId=368995` ✓ |
| ANACOM · Consultas públicas | `rssFeed.jsp?categoryId=140982` ✓ |
| Eurostat · catálogo | endpoint RSS documentado pela Comissão ✓ |
| EUR-Lex · Cellar | SPARQL público ✓ |
| Comissão Europeia | **não tem RSS** — ver abaixo |
| CNPD | feed não confirmado — modo `watch` |

**A ANACOM serve ISO-8859-15, não UTF-8.** O `sync.mjs` passou a ler o charset
do cabeçalho `Content-Type` (com override em `sources.json`) e a descodificar em
conformidade. Sem isto os acentos vinham partidos no feed.

**A Comissão Europeia não publica RSS** e o listing filtrado de notícias é
interdito pelo `robots.txt`. Não é raspado: fica em modo `watch`, registado para
verificação manual e subscrição da newsletter. As notícias relevantes entram por
`data/news.manual.json`.

Isto é uma decisão, não uma limitação. Uma entidade que se apresenta como árbitro
de confiança não pode ser apanhada a raspar um site da Comissão contra o
`robots.txt` — o custo reputacional excede em muito o valor de meia dúzia de
títulos automatizados.

O script tolera falhas, **preserva o feed anterior se a recolha vier vazia** e
escreve tudo em `data/sync-log.json`.

---

## 9. Nota regulatória crítica

O **Digital Omnibus sobre IA foi aprovado**: acordo político a 7 de maio de 2026,
Parlamento a 16 de junho, aprovação final do Conselho a **29 de junho de 2026**.

| Data | Obrigação | Estado |
|---|---|---|
| 2 ago 2026 | Artigo 50.º — transparência | **não foi adiado** |
| 2 dez 2026 | Art. 50.º(2) legados + novas proibições | novo |
| 2 ago 2027 | Sandbox nacional obrigatória | adiado de 2026 |
| 2 dez 2027 | Alto risco — Anexo III | adiado de ago 2026 |
| 2 ago 2028 | Alto risco — Anexo I | adiado de ago 2027 |

Os novos prazos **só produzem efeitos jurídicos com a publicação no Jornal
Oficial**. A ressalva está em `data/radar.json`, aparece no Radar e na página de
Certificação.

---

## 10. Conteúdo reescrito

`estrategia.html` e `certificacao.html` reescrevem e atualizam as páginas
`enia.pt/estrategia-nacional-ia` e `enia.pt/certificacao-ai-act`. O que mudou:

- Calendário de conformidade **reconstruído** para o pós-Omnibus. A página
  antiga dava agosto de 2026 como prazo do alto risco — já não é.
- Dados de produtividade e microempresas mantidos, com fonte explícita e a
  estimativa de IA agêntica marcada como referência para dimensionar, não como
  promessa de resultado.
- Acrescentada leitura crítica da ANIA (o que acerta / onde a ENIA insiste) com
  ligação ao acompanhamento das 32 iniciativas no Radar.
- Acrescentada uma caixa sobre classificar antes de automatizar, ligando as duas
  páginas.
- Links oficiais da UE: quadro regulatório, texto integral no EUR-Lex, AI Office
  e AI Act Service Desk.

`netlify.toml` redireciona os URLs antigos (`/estrategia-nacional-ia`,
`/certificacao-ai-act`, `/contactos`, `/publicacoes`, `/observatorio`).

---

## 10b. Nota sobre pré-visualização

O renderer disponível no ambiente de construção é Qt WebKit (2012) e **não
suporta `clamp()`**, que sustenta toda a métrica do site — tipografia,
espaçamento e a largura da rail. Screenshots gerados por essa via não
representam o resultado real e não foram usados para validar o desenho.

A validação feita foi estrutural e matemática: markup fechado, IDs resolvidos,
âncoras com destino, ausência de bandas adjacentes repetidas, contraste WCAG
calculado para as cinco bandas (todas AAA, entre 12,8:1 e 17,9:1) e simulação da
lógica da rail e das fases do teste em Node.

Para ver o site: `npm run serve`, ou abrir `standalone/index.html`.

---

## 15. O teste, os dados e o Marketplace

### O que o teste captura, e porquê

No fim das nove perguntas o teste pede: **empresa, nome do sistema, nome da
pessoa, e-mail, setor e dimensão**, mais uma **autorização opcional** para
menção pública no Marketplace. Recusar não bloqueia nada — o teste devolve o
mesmo resultado e o mesmo PDF.

A justificação está escrita na própria página, e é honesta: o INE mede se as
empresas *usam* IA; ninguém mede se essa IA está classificada, documentada e
governada. Sem setor e sem dimensão, cada resposta é um ponto sem coordenadas.

### PDF

Gerado no browser, sem biblioteca externa: constrói-se um PDF 1.4 mínimo com
Helvetica e codificação WinAnsi, que cobre o português. Testado — 947 bytes,
uma página, acentuação correta na extração de texto. Um jsPDF daria melhor
tipografia e 250 KB de peso; para um relatório de uma página não compensa.

### ⚠ Envio por e-mail: o que falta

**Um site estático não envia e-mail.** É a limitação honesta desta entrega.

O teste está preparado para os dois cenários:

- **Com endpoint.** Definir `window.ENIA_ENDPOINT` (um script de uma linha antes
  de `enia.js`, ou uma função serverless). O registo vai por `POST` em JSON, e o
  servidor envia o PDF e escreve em `data/marketplace.json`.
- **Sem endpoint.** O registo fica em fila na `sessionStorage` e a página oferece
  um `mailto:` já preenchido para `jorge.saraiva@enia.pt`. **Nunca se perde uma
  submissão em silêncio** — é o que essa fila existe para garantir.

Formato do registo enviado:

```json
{ "empresa": "…", "produto": "…", "nome": "…", "email": "…",
  "setor": "…", "dimensao": "…", "consent": true,
  "date": "2026-07-27", "tier": "limitado", "title": "Risco limitado",
  "gov": 3, "score": 60, "docs": 9, "obs": 4, "lang": "pt" }
```

Serviços que servem sem escrever backend: Formspree, Basin, Netlify Forms
(com função para o PDF), ou uma função Vercel de vinte linhas.

### Marketplace

`marketplace.html` — mesma arquitetura da página de notícias: calendário de
avaliações, motor de busca por empresa, filtro por setor, mais um agregado com
distribuição por nível de risco e por setor.

**Critério de entrada:** `consent: true` e `score >= 60` — ou seja, três das
cinco peças de governação declaradas. O critério é a governação, não o nível de
risco: um sistema de alto risco bem governado vale mais nesta lista do que um
chatbot sem inventário, porque é isso que o AI Act mede.

**A lista arranca vazia, e a página diz porquê** em vez de fingir conteúdo. Essa
vazio é, hoje, a medida exata do problema.

Duas ressalvas escritas na própria página, porque um observatório não pode
publicá-las só no rodapé:

1. **A amostra é auto-selecionada.** Quem faz um teste de conformidade por
   iniciativa própria já está acima da média em consciência regulatória. O
   agregado mede quem se avalia, não o universo das empresas portuguesas.
2. **A listagem não é uma certificação** nem uma recomendação comercial. É o
   registo público de uma auto-avaliação.

---

## 11. Checklist antes do go-live

- [ ] Definir `window.ENIA_ENDPOINT` para ativar o envio do PDF por e-mail
- [ ] Decidir o critério de entrada no Marketplace (hoje: consentimento + 3/5)
- [ ] Correr `npm run sync` e corrigir os URLs marcados `verify: true`
- [ ] Adicionar `ANTHROPIC_API_KEY` aos secrets do repositório
- [ ] Confirmar a licença de `assets/hero-sky.jpg` (o nome original no `.af`,
      `2151870860.jpg`, sugere banco de imagens)
- [ ] Rever a checklist institucional e o acompanhamento da ANIA em
      `data/radar.json` — são as peças com maior risco reputacional
- [ ] Confirmar o estado de publicação do Omnibus no Jornal Oficial
- [ ] Ligar o formulário de contactos a um endpoint real (hoje abre o cliente de
      e-mail com tudo pré-preenchido para `jorge.saraiva@enia.pt`)
- [ ] Apontar `enia.pt` e redirecionar `eniaportugal.netlify.app` → `/radar.html`
- [ ] Decidir se o CENSUS IA e a classificação automática mantêm o rótulo
      «Brevemente» ou passam a ter data anunciada

---

## 12. Série histórica

`scripts/history.mjs` grava um retrato datado por dia em
`data/history/AAAA-MM-DD.json` e reconstrói `data/history/series.json`. Corre
automaticamente no fim do sync. Cada retrato guarda a pontuação de Portugal, a
posição no ranking, a média dos países avaliados, a distância ao líder, todos os
scores por país, os valores por sector, o estado da checklist institucional e a
contagem da ANIA.

O Radar desenha a trajetória na secção 02 assim que existirem duas leituras.
Com uma só, mostra um estado honesto a explicar porque é que a série ainda não
tem forma — em vez de inventar uma linha.

**Porquê:** o retrato de hoje copia-se numa tarde; dezoito meses de leituras
diárias não. É a barreira de replicação do Pulse, e só começa a construir-se a
partir da primeira execução. Quanto mais cedo o cron arrancar, mais cedo a
vantagem é real.

---

## 13. Teste de classificação de risco

`teste.html` — nove perguntas, cinco minutos, tudo no browser do utilizador.
Deixou de ser «Brevemente».

Cobre papel do operador, práticas proibidas do Artigo 5.º, os oito domínios do
Anexo III, a derrogação do Artigo 6.º(3), produtos do Anexo I, regime GPAI com e
sem risco sistémico, gatilhos de transparência do Artigo 50.º, sistemas legados e
maturidade de governação interna.

Devolve: nível de risco, regimes adicionais que acumulam, lista de obrigações
concretas, prazos com contagem decrescente ao vivo, documentação estimada e
posição de maturidade. Com botões para copiar e imprimir.

Duas decisões que valem a pena notar:

- **O GPAI é tratado como regime paralelo, não como nível de risco.** Um modelo
  de uso geral integrado num chatbot dá «Risco limitado + GPAI com risco
  sistémico», que é o que o regulamento diz. A maioria das ferramentas
  equivalentes colapsa isto num único rótulo e erra.
- **A dúvida na derrogação do Artigo 6.º(3) classifica como alto risco.** É a
  leitura prudente e é a que o regulamento presume.

O motor foi testado contra oito cenários reais (chatbot, triagem de RH com e sem
derrogação, scoring de crédito com deepfake, classificação social, LLM próprio
acima de 10²⁵ FLOPs, dispositivo médico e filtro de spam). Nenhuma resposta sai
do browser, e o site di-lo explicitamente.

---

## 13b. Versão inglesa

As nove páginas existem em `/en/`, geradas por `scripts/i18n.mjs` a partir das
portuguesas mais o dicionário em `scripts/dict.mjs`.

**Porquê um build e não ficheiros escritos à mão:** garante paridade estrutural
absoluta. Qualquer correção de markup feita em português aparece em inglês no
build seguinte, e nenhum id, âncora ou classe se perde. O custo é manter o
dicionário — e é o custo certo, porque é a tradução que precisa de revisão
humana, não o HTML.

O dicionário tem **entradas de frase completa, não de palavra**. Traduzir por
fragmentos produz inglês de máquina; e chaves curtas são perigosas — na
primeira execução, `'Estado' → 'Status'` transformou «Ministério da Reforma do
Estado» em «Ministério da Reforma do Status». A chave foi removida e a frase
completa acrescentada.

O build relata a cobertura no fim: strings visíveis que ainda parecem
portuguesas. Estado atual: **714 traduções aplicadas, 0 residuais**.

Convenções seguidas: inglês britânico; terminologia oficial do AI Act
(*provider*, *deployer*, *high-risk*, *prohibited practices*, *notified body*);
nomes próprios intactos (ENIA, ANACOM, INE, AICEP, TRAFICOM, AMÁLIA); decimais
de vírgula para ponto.

**`en/` é gerado mas commitado** — o Netlify publica a partir do repositório.
Nunca editar `en/*.html` à mão: o build seguinte sobrepõe. O workflow diário
regenera-o junto com os dados.

Sem redirect automático por `Accept-Language`. A escolha é do visitante, feita
no seletor da barra. Redirecionar por cabeçalho esconderia a versão portuguesa
a quem tem o browser em inglês — e isto é, antes de tudo, um observatório
português.

---

## 14. Página de notícias

`noticias.html` — o arquivo integral, alimentado por `data/news-archive.json`.

- **Calendário** no topo da coluna lateral, com navegação por mês limitada ao
  intervalo que tem conteúdo. Os dias com entradas ficam marcados com ponto lima
  e contagem no tooltip; clicar filtra a lista para esse dia.
- **Pesquisa** por título, resumo e fonte, insensível a acentos e maiúsculas
  («transparencia» encontra «transparência»), com realce dos termos encontrados.
- **Filtro por fonte** em chips, combinável com o dia e com a pesquisa.
- **Lista agrupada por mês**, ordenada da mais recente para a mais antiga.

O arquivo arranca com 16 entradas verificadas entre agosto de 2025 e julho de
2026 — incluindo as orientações da Comissão sobre o Artigo 50.º publicadas a 20
de julho de 2026, a treze dias do prazo. O sync diário acrescenta o que é novo e
**nunca remove o que já lá está**: a deduplicação é por URL, com o título como
recurso.

---

## 15. Próximo passo natural (v3.2)

O teste é o primeiro produto real da ENIA e gera exatamente o tipo de dado que
mais falta ao país: a distribuição de risco dos sistemas de IA portugueses.
Hoje não guarda nada — por decisão. Se um dia quiserem essa série, o caminho
honesto é pedir consentimento explícito no fim do teste e guardar apenas o
agregado, nunca o caso individual. Vale a pena decidir isso com os Colégios
antes de o construir, não depois.

---

ENIA · Entidade Nacional para a Inteligência Artificial
Av. Liberdade, 318 · 4710-250 Braga · enia.pt
