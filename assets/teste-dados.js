/**
 * ENIA — conteúdo do teste de classificação, nas duas línguas
 * ---------------------------------------------------------------------------
 * Separado de teste.html por uma razão concreta: na v5 estas strings viviam
 * dentro do JS da página e o build de tradução, que só percorre HTML, não lhes
 * chegava. O resultado era uma página portuguesa a devolver «Limited risk».
 *
 * Aqui cada string existe explicitamente nas duas línguas. Não há build a
 * adivinhar: se faltar uma tradução, falta visivelmente.
 *
 * Carregado por <script src>, expõe window.ENIA_TEST.
 */
(() => {
  'use strict';
  const EN = document.documentElement.lang.slice(0, 2) === 'en';
  const t = (pt, en) => (EN ? en : pt);

  /* ══════════════════════ perguntas ══════════════════════ */
  const Q = [
    {
      id: 'papel', type: 'single',
      t: t('Qual é o seu papel em relação ao sistema de IA?',
           'What is your role in relation to the AI system?'),
      h: t('O AI Act distribui obrigações diferentes por papel. Se desenvolve e coloca no mercado com o seu nome, é fornecedor. Se usa sob a sua autoridade um sistema de outrem, é implementador.',
           'The AI Act assigns different obligations by role. If you develop it and place it on the market under your own name, you are a provider. If you use someone else’s system under your own authority, you are a deployer.'),
      o: [
        { v: 'fornecedor', l: t('Fornecedor', 'Provider'),
          n: t('Desenvolvo o sistema ou coloco-o no mercado com o meu nome ou marca.',
               'I develop the system or place it on the market under my own name or trademark.') },
        { v: 'implementador', l: t('Implementador', 'Deployer'),
          n: t('Uso um sistema de IA de terceiros sob a minha autoridade, no contexto profissional.',
               'I use a third-party AI system under my own authority, in a professional context.') },
        { v: 'importador', l: t('Importador ou distribuidor', 'Importer or distributor'),
          n: t('Coloco no mercado da UE um sistema de um operador estabelecido fora da União.',
               'I place a system from an operator established outside the Union on the EU market.') },
        { v: 'ambos', l: t('Mais do que um destes', 'More than one of these'),
          n: t('Frequente: quem integra um modelo de terceiros num produto próprio acumula papéis.',
               'Common: integrating a third-party model into your own product stacks the roles.') }
      ]
    },
    {
      id: 'proibidas', type: 'multi', none: t('Nenhuma das anteriores', 'None of the above'),
      t: t('O sistema faz alguma destas coisas?', 'Does the system do any of these things?'),
      h: t('Artigo 5.º — práticas proibidas. Estão banidas desde 2 de fevereiro de 2025, sem período de transição e com a coima mais alta do regulamento.',
           'Article 5 — prohibited practices. Banned since 2 February 2025, with no transition period and the highest fines in the regulation.'),
      o: [
        { v: 'p1', l: t('Classificação social de pessoas', 'Social scoring of people'),
          n: t('Avaliar ou classificar pessoas pelo comportamento social, com tratamento desfavorável em contextos não relacionados.',
               'Evaluating or scoring people by social behaviour, leading to detrimental treatment in unrelated contexts.') },
        { v: 'p2', l: t('Técnicas subliminares ou manipulativas', 'Subliminal or manipulative techniques'),
          n: t('Distorcer materialmente o comportamento de forma a causar dano significativo.',
               'Materially distorting behaviour in a way that causes significant harm.') },
        { v: 'p3', l: t('Exploração de vulnerabilidades', 'Exploiting vulnerabilities'),
          n: t('Aproveitar idade, deficiência ou situação socioeconómica para distorcer comportamento.',
               'Using age, disability or socioeconomic situation to distort behaviour.') },
        { v: 'p4', l: t('Categorização biométrica sensível', 'Sensitive biometric categorisation'),
          n: t('Inferir raça, opinião política, filiação sindical, convicções religiosas, vida ou orientação sexual.',
               'Inferring race, political opinion, trade union membership, religious belief, sex life or sexual orientation.') },
        { v: 'p5', l: t('Reconhecimento de emoções no trabalho ou no ensino', 'Emotion recognition at work or in education'),
          n: t('Salvo por razões médicas ou de segurança.', 'Except for medical or safety reasons.') },
        { v: 'p6', l: t('Identificação biométrica remota em tempo real em espaço público', 'Real-time remote biometric identification in public spaces'),
          n: t('Para efeitos de aplicação da lei, fora das exceções estritas do regulamento.',
               'For law enforcement purposes, outside the regulation’s narrow exceptions.') },
        { v: 'p7', l: t('Raspagem não direcionada de imagens faciais', 'Untargeted scraping of facial images'),
          n: t('Para criar ou expandir bases de dados de reconhecimento facial.',
               'To create or expand facial recognition databases.') },
        { v: 'p8', l: t('Policiamento preditivo individual', 'Individual predictive policing'),
          n: t('Prever a probabilidade de uma pessoa cometer um crime apenas com base em perfil ou traços de personalidade.',
               'Predicting the likelihood of a person committing a crime based solely on profiling or personality traits.') }
      ]
    },
    {
      id: 'anexo3', type: 'multi', none: t('Nenhum destes domínios', 'None of these areas'),
      t: t('Em que domínio o sistema é usado?', 'In what area is the system used?'),
      h: t('Anexo III — domínios de alto risco. Basta que o sistema seja usado num deles para desencadear o regime completo, independentemente da dimensão da organização.',
           'Annex III — high-risk areas. Use in any one of them triggers the full regime, regardless of the size of the organisation.'),
      o: [
        { v: 'a1', l: t('Biometria', 'Biometrics'),
          n: t('Identificação biométrica remota, categorização biométrica ou reconhecimento de emoções fora do que é proibido.',
               'Remote biometric identification, biometric categorisation or emotion recognition outside what is prohibited.') },
        { v: 'a2', l: t('Infraestruturas críticas', 'Critical infrastructure'),
          n: t('Gestão e funcionamento de trânsito rodoviário, água, gás, aquecimento, eletricidade ou infraestrutura digital crítica.',
               'Management and operation of road traffic, water, gas, heating, electricity or critical digital infrastructure.') },
        { v: 'a3', l: t('Educação e formação profissional', 'Education and vocational training'),
          n: t('Admissão, avaliação de resultados, definição de nível de acesso ou monitorização de exames.',
               'Admission, assessment of outcomes, setting access levels or monitoring examinations.') },
        { v: 'a4', l: t('Emprego e gestão de trabalhadores', 'Employment and worker management'),
          n: t('Recrutamento, triagem de candidaturas, promoções, cessação, atribuição de tarefas ou monitorização de desempenho.',
               'Recruitment, screening applications, promotion, termination, task allocation or performance monitoring.') },
        { v: 'a5', l: t('Serviços essenciais, crédito e seguros', 'Essential services, credit and insurance'),
          n: t('Elegibilidade para prestações públicas, avaliação de solvabilidade, scoring de crédito, preços de seguros de vida e saúde, triagem de emergência.',
               'Eligibility for public benefits, creditworthiness assessment, credit scoring, life and health insurance pricing, emergency triage.') },
        { v: 'a6', l: t('Aplicação da lei', 'Law enforcement'),
          n: t('Avaliação de risco de vitimização, polígrafos, avaliação de prova, perfis criminais.',
               'Victimisation risk assessment, polygraphs, evidence evaluation, criminal profiling.') },
        { v: 'a7', l: t('Migração, asilo e fronteiras', 'Migration, asylum and borders'),
          n: t('Avaliação de risco de segurança, exame de pedidos de asilo ou visto, deteção de pessoas.',
               'Security risk assessment, examination of asylum or visa applications, detection of persons.') },
        { v: 'a8', l: t('Justiça e processos democráticos', 'Justice and democratic processes'),
          n: t('Apoio à investigação e interpretação de factos e do direito, ou influência no resultado de eleições e referendos.',
               'Assisting in researching and interpreting facts and the law, or influencing the outcome of elections and referendums.') }
      ]
    },
    {
      id: 'derrogacao', type: 'single',
      when: s => (s.anexo3 || []).length > 0,
      t: t('O sistema tem influência material na decisão final?',
           'Does the system materially influence the final decision?'),
      h: t('Artigo 6.º(3) — derrogação. Um sistema num domínio do Anexo III pode não ser de alto risco se apenas executar tarefas processuais restritas, melhorar resultado de trabalho humano já concluído, detetar padrões de decisão sem substituir a avaliação humana, ou preparar dados. A derrogação exige documentação e registo prévios — não se presume.',
           'Article 6(3) — derogation. A system in an Annex III area may not be high risk if it only performs narrow procedural tasks, improves the result of previously completed human work, detects decision patterns without replacing human assessment, or prepares data. The derogation requires documentation and prior registration — it is not presumed.'),
      o: [
        { v: 'sim', l: t('Sim, influencia ou determina a decisão', 'Yes, it influences or determines the decision'),
          n: t('Pontua, ordena, filtra, recomenda ou decide sobre pessoas.',
               'It scores, ranks, filters, recommends or decides about people.') },
        { v: 'nao', l: t('Não, é puramente acessório', 'No, it is purely ancillary'),
          n: t('Executa tarefa processual restrita ou prepara dados, sem substituir avaliação humana. Vou documentar e registar a derrogação.',
               'It performs a narrow procedural task or prepares data, without replacing human assessment. I will document and register the derogation.') },
        { v: 'duvida', l: t('Tenho dúvidas', 'I am not sure'),
          n: t('Na dúvida, o regulamento presume alto risco. É a resposta prudente.',
               'Where there is doubt, the regulation presumes high risk. This is the prudent answer.') }
      ]
    },
    {
      id: 'anexo1', type: 'single',
      t: t('A IA está embebida num produto já regulado pela UE?',
           'Is the AI embedded in a product already regulated by the EU?'),
      h: t('Anexo I — produtos sujeitos a legislação de harmonização: dispositivos médicos, máquinas, brinquedos, elevadores, equipamento de proteção individual, veículos, aviação, entre outros.',
           'Annex I — products covered by harmonisation legislation: medical devices, machinery, toys, lifts, personal protective equipment, vehicles, aviation and others.'),
      o: [
        { v: 'sim', l: t('Sim, é componente de segurança ou é o próprio produto', 'Yes, it is a safety component or is the product itself'),
          n: t('O sistema exige avaliação de conformidade por terceiro ao abrigo da legislação setorial.',
               'The system requires third-party conformity assessment under the sectoral legislation.') },
        { v: 'nao', l: t('Não', 'No'),
          n: t('É um sistema autónomo, software ou serviço.', 'It is a stand-alone system, software or service.') }
      ]
    },
    {
      id: 'gpai', type: 'single',
      t: t('Desenvolve ou coloca no mercado um modelo de IA de uso geral?',
           'Do you develop or place a general-purpose AI model on the market?'),
      h: t('GPAI — modelos treinados com grande volume de dados, capazes de executar múltiplas tarefas distintas e de ser integrados em vários sistemas a jusante. Usar a API de um modelo de terceiros não o torna fornecedor de GPAI.',
           'GPAI — models trained on large volumes of data, capable of performing multiple distinct tasks and of being integrated into various downstream systems. Using a third-party model’s API does not make you a GPAI provider.'),
      o: [
        { v: 'sistemico', l: t('Sim, e com poder de computação ≥ 10²⁵ FLOPs', 'Yes, with compute ≥ 10²⁵ FLOPs'),
          n: t('Presume-se risco sistémico: obrigações adicionais de avaliação adversarial e reporte.',
               'Systemic risk is presumed: additional adversarial evaluation and reporting obligations.') },
        { v: 'sim', l: t('Sim, abaixo desse limiar', 'Yes, below that threshold'),
          n: t('Regime GPAI base: documentação técnica, política de direitos de autor, sumário público dos dados de treino.',
               'Base GPAI regime: technical documentation, copyright policy, public summary of training data.') },
        { v: 'nao', l: t('Não', 'No'),
          n: t('Uso modelos de terceiros ou não desenvolvo modelos de uso geral.',
               'I use third-party models, or I do not develop general-purpose models.') }
      ]
    },
    {
      id: 'transp', type: 'multi', none: t('Nenhuma das anteriores', 'None of the above'),
      t: t('O sistema faz alguma destas interações?', 'Does the system do any of these things?'),
      h: t('Artigo 50.º — obrigações de transparência. É o prazo mais próximo de todos e não foi adiado pelo Digital Omnibus.',
           'Article 50 — transparency obligations. This is the nearest deadline of all, and it was not postponed by the Digital Omnibus.'),
      o: [
        { v: 't1', l: t('Interage diretamente com pessoas', 'Interacts directly with people'),
          n: t('Assistentes, chatbots, atendimento automatizado.', 'Assistants, chatbots, automated customer service.') },
        { v: 't2', l: t('Gera ou manipula conteúdo sintético', 'Generates or manipulates synthetic content'),
          n: t('Texto, imagem, áudio ou vídeo produzidos ou alterados por IA.',
               'Text, image, audio or video produced or altered by AI.') },
        { v: 't3', l: t('Produz deepfakes', 'Produces deepfakes'),
          n: t('Conteúdo que se assemelha a pessoas, objetos ou eventos reais e pode induzir em erro.',
               'Content resembling real people, objects or events that could mislead.') },
        { v: 't4', l: t('Gera texto para informar o público sobre assuntos de interesse público', 'Generates text to inform the public on matters of public interest'),
          n: t('Publicação de conteúdo noticioso ou informativo sem revisão editorial humana.',
               'Publishing news or informational content without human editorial review.') },
        { v: 't5', l: t('Reconhece emoções ou categoriza biometricamente', 'Recognises emotions or categorises biometrically'),
          n: t('Fora dos contextos proibidos.', 'Outside the prohibited contexts.') }
      ]
    },
    {
      id: 'legado', type: 'single',
      t: t('O sistema já estava no mercado antes de 2 de agosto de 2025?',
           'Was the system already on the market before 2 August 2025?'),
      h: t('O regulamento trata de forma diferente os sistemas legados. Para modelos GPAI já colocados no mercado antes dessa data, a conformidade plena é exigível a 2 de agosto de 2027.',
           'The regulation treats legacy systems differently. For GPAI models already placed on the market before that date, full compliance is required by 2 August 2027.'),
      o: [
        { v: 'sim', l: t('Sim, já estava em produção', 'Yes, it was already in production'), n: '' },
        { v: 'nao', l: t('Não, é novo ou vai ser lançado agora', 'No, it is new or about to launch'), n: '' }
      ]
    },
    {
      id: 'gov', type: 'multi', none: t('Nenhuma destas', 'None of these'),
      t: t('Qual destas peças já existe na sua organização?',
           'Which of these already exist in your organisation?'),
      h: t('Não altera a classificação de risco — mede a distância a que está de a conseguir demonstrar. É a pergunta que quase toda a gente falha.',
           'This does not change the risk classification — it measures how far you are from being able to demonstrate it. It is the question almost everyone fails.'),
      o: [
        { v: 'g1', l: t('Inventário escrito dos sistemas de IA em uso', 'A written inventory of the AI systems in use'), n: '' },
        { v: 'g2', l: t('Política interna de utilização e gestão de IA', 'An internal AI use and management policy'), n: '' },
        { v: 'g3', l: t('Processo formal de avaliação de risco algorítmico', 'A formal algorithmic risk assessment process'), n: '' },
        { v: 'g4', l: t('Responsável identificado pela conformidade com o AI Act', 'A named person accountable for AI Act compliance'), n: '' },
        { v: 'g5', l: t('Plano de literacia em IA para o pessoal (Artigo 4.º)', 'An AI literacy plan for staff (Article 4)'), n: '' }
      ]
    }
  ];

  /* ══════════════════════ prazos ══════════════════════ */
  const DL = {
    proib:    { d: '2025-02-02', t: t('Práticas proibidas', 'Prohibited practices'), c: t('Artigo 5.º', 'Article 5') },
    lit:      { d: '2025-02-02', t: t('Literacia em IA', 'AI literacy'), c: t('Artigo 4.º', 'Article 4') },
    gpai:     { d: '2025-08-02', t: t('Regime GPAI', 'GPAI regime'), c: t('Artigos 51.º a 55.º', 'Articles 51 to 55') },
    transp:   { d: '2026-08-02', t: t('Transparência', 'Transparency'), c: t('Artigo 50.º', 'Article 50') },
    legado50: { d: '2026-12-02', t: t('Transparência para sistemas legados', 'Transparency for legacy systems'), c: t('Artigo 50.º(2)', 'Article 50(2)') },
    novasP:   { d: '2026-12-02', t: t('Novas práticas proibidas', 'New prohibited practices'), c: t('Artigo 5.º revisto', 'Article 5 as revised') },
    sandbox:  { d: '2027-08-02', t: t('Sandbox nacional obrigatória', 'National sandbox becomes mandatory'), c: t('Artigo 57.º', 'Article 57') },
    gpaiLeg:  { d: '2027-08-02', t: t('GPAI legado — conformidade plena', 'Legacy GPAI — full compliance'), c: t('Artigo 111.º', 'Article 111') },
    alto3:    { d: '2027-12-02', t: t('Alto risco — Anexo III', 'High risk — Annex III'), c: t('Artigos 8.º a 27.º', 'Articles 8 to 27') },
    alto1:    { d: '2028-08-02', t: t('Alto risco — Anexo I', 'High risk — Annex I'), c: t('Artigos 8.º a 27.º', 'Articles 8 to 27') }
  };

  /* ══════════════════════ obrigações ══════════════════════ */
  const OB = {
    gestao:   [t('Sistema de gestão de risco contínuo', 'Continuous risk management system'),
               t('Documentado, mantido ao longo de todo o ciclo de vida e revisto sempre que o sistema muda materialmente.',
                 'Documented, maintained across the whole lifecycle and reviewed whenever the system changes materially.')],
    dados:    [t('Governação de dados', 'Data governance'),
               t('Conjuntos de treino, validação e teste relevantes, representativos e examinados quanto a enviesamentos.',
                 'Training, validation and testing sets that are relevant, representative and examined for bias.')],
    doctec:   [t('Documentação técnica', 'Technical documentation'),
               t('Elaborada antes da colocação no mercado e mantida atualizada. É o dossiê que a autoridade pede primeiro.',
                 'Drawn up before placing on the market and kept up to date. It is the file the authority asks for first.')],
    logs:     [t('Registo automático de eventos', 'Automatic event logging'),
               t('Logs que permitam rastrear o funcionamento do sistema durante toda a sua vida útil.',
                 'Logs allowing the system’s operation to be traced throughout its lifetime.')],
    info:     [t('Instruções de utilização', 'Instructions for use'),
               t('Informação clara e completa ao implementador sobre capacidades, limitações e condições de uso.',
                 'Clear, complete information to the deployer on capabilities, limitations and conditions of use.')],
    humano:   [t('Supervisão humana efetiva', 'Effective human oversight'),
               t('Pessoas com competência e autoridade reais para interpretar, ignorar ou reverter o resultado.',
                 'People with real competence and authority to interpret, override or reverse the output.')],
    robust:   [t('Exatidão, robustez e cibersegurança', 'Accuracy, robustness and cybersecurity'),
               t('Níveis adequados e consistentes ao longo do ciclo de vida, declarados nas instruções.',
                 'Appropriate and consistent levels across the lifecycle, declared in the instructions.')],
    conf:     [t('Avaliação de conformidade e marcação CE', 'Conformity assessment and CE marking'),
               t('Antes da colocação no mercado. Para o Anexo I, por organismo notificado.',
                 'Before placing on the market. For Annex I, by a notified body.')],
    registo:  [t('Registo na base de dados da UE', 'Registration in the EU database'),
               t('Inscrição do sistema antes da colocação no mercado ou colocação em serviço.',
                 'Registering the system before placing it on the market or putting it into service.')],
    pos:      [t('Monitorização pós-comercialização', 'Post-market monitoring'),
               t('Plano ativo de recolha e análise de desempenho, com comunicação de incidentes graves.',
                 'An active plan to collect and analyse performance, with reporting of serious incidents.')],
    fria:     [t('Avaliação de impacto sobre direitos fundamentais', 'Fundamental rights impact assessment'),
               t('Exigível a implementadores públicos e a certos serviços privados essenciais (Artigo 27.º).',
                 'Required of public deployers and certain essential private services (Article 27).')],
    t_ident:  [t('Informar que se trata de IA', 'Disclose that this is AI'),
               t('A pessoa tem de saber que está a interagir com um sistema de IA, salvo se for óbvio pelo contexto.',
                 'The person must know they are interacting with an AI system, unless it is obvious from context.')],
    t_marca:  [t('Marcar conteúdo sintético', 'Mark synthetic content'),
               t('Em formato legível por máquina e detetável como gerado ou manipulado artificialmente.',
                 'In machine-readable format and detectable as artificially generated or manipulated.')],
    t_deep:   [t('Divulgar deepfakes', 'Disclose deepfakes'),
               t('Declarar que o conteúdo foi gerado ou manipulado artificialmente.',
                 'State that the content has been artificially generated or manipulated.')],
    t_texto:  [t('Divulgar texto publicado sem revisão humana', 'Disclose text published without human review'),
               t('Quando destinado a informar o público sobre assuntos de interesse público.',
                 'Where it is intended to inform the public on matters of public interest.')],
    g_doc:    [t('Documentação técnica do modelo', 'Model technical documentation'),
               t('Incluindo processo de treino e testes, disponível ao AI Office e a jusante.',
                 'Including the training and testing process, available to the AI Office and downstream.')],
    g_copy:   [t('Política de direitos de autor', 'Copyright policy'),
               t('Com mecanismo de respeito pelas reservas de direitos expressas ao abrigo da diretiva sobre TDM.',
                 'With a mechanism to respect rights reservations expressed under the TDM directive.')],
    g_sum:    [t('Sumário público dos dados de treino', 'Public summary of training data'),
               t('Suficientemente detalhado, segundo o modelo publicado pelo AI Office.',
                 'Sufficiently detailed, following the template published by the AI Office.')],
    g_red:    [t('Avaliação adversarial (red-teaming)', 'Adversarial evaluation (red-teaming)'),
               t('Avaliação e mitigação sistemática de riscos sistémicos a nível da União.',
                 'Systematic assessment and mitigation of systemic risks at Union level.')],
    g_inc:    [t('Reporte de incidentes graves ao AI Office', 'Serious incident reporting to the AI Office'),
               t('Sem demora indevida, com medidas corretivas.', 'Without undue delay, with corrective measures.')],
    g_sec:    [t('Cibersegurança reforçada', 'Reinforced cybersecurity'),
               t('Do modelo e da infraestrutura física que o suporta.', 'Of the model and the physical infrastructure supporting it.')],
    literacia:[t('Literacia em IA no pessoal', 'AI literacy among staff'),
               t('Já exigível desde fevereiro de 2025, a todos os operadores, independentemente do nível de risco.',
                 'Enforceable since February 2025, against all operators, regardless of risk tier.')]
  };

  /* ══════════════════════ veredictos ══════════════════════ */
  const V = {
    inaceitavel: {
      title: t('Risco inaceitável', 'Unacceptable risk'),
      sum: t('Pelo menos uma das práticas que assinalou está proibida pelo Artigo 5.º desde 2 de fevereiro de 2025. Não há conformidade possível: a prática tem de cessar. A coima pode atingir 35 milhões de euros ou 7% do volume de negócios anual mundial, consoante o que for mais elevado.',
             'At least one of the practices you flagged has been prohibited by Article 5 since 2 February 2025. There is no possible compliance: the practice must stop. Fines can reach €35 million or 7% of annual worldwide turnover, whichever is higher.')
    },
    altoA1: {
      title: t('Alto risco', 'High risk'),
      sum: t('O sistema é componente de segurança de um produto já regulado, ou é o próprio produto. Aplica-se o regime completo de alto risco, com avaliação de conformidade por organismo notificado ao abrigo da legislação setorial.',
             'The system is a safety component of an already-regulated product, or is the product itself. The full high-risk regime applies, with conformity assessment by a notified body under the sectoral legislation.')
    },
    altoA3: {
      title: t('Alto risco', 'High risk'),
      sum: t('O sistema opera num domínio do Anexo III com influência material na decisão. Aplica-se o regime completo: gestão de risco, governação de dados, documentação técnica, supervisão humana, registo europeu e monitorização pós-comercialização.',
             'The system operates in an Annex III area with material influence over the decision. The full regime applies: risk management, data governance, technical documentation, human oversight, EU registration and post-market monitoring.')
    },
    derrogado: {
      title: t('Alto risco derrogado', 'High risk, derogated'),
      sum: t('O sistema opera num domínio do Anexo III mas invocou a derrogação do Artigo 6.º(3). Atenção: a derrogação não é automática. Tem de a documentar antes da colocação no mercado e registar o sistema na base de dados da UE mesmo assim. Se a autoridade discordar da avaliação, o regime aplicável passa a ser o de alto risco por inteiro.',
             'The system operates in an Annex III area but you have invoked the Article 6(3) derogation. Note: the derogation is not automatic. You must document it before placing the system on the market, and register the system in the EU database regardless. If the authority disagrees with your assessment, the full high-risk regime applies.')
    },
    limitado: {
      title: t('Risco limitado', 'Limited risk'),
      sum: t('O sistema não é de alto risco, mas está sujeito às obrigações de transparência do Artigo 50.º. É o prazo mais próximo do regulamento e não foi adiado pelo Digital Omnibus.',
             'The system is not high risk, but it is subject to the transparency obligations of Article 50. That is the nearest deadline in the regulation, and it was not postponed by the Digital Omnibus.')
    },
    minimo: {
      title: t('Risco mínimo', 'Minimal risk'),
      sum: t('Pelo que descreveu, o sistema não cai em nenhuma categoria regulada de forma específica. Não está isento de tudo: o dever de literacia em IA do Artigo 4.º aplica-se a todos os operadores desde fevereiro de 2025, e a classificação deve ser revista sempre que o caso de uso mudar.',
             'From what you have described, the system does not fall into any specifically regulated category. It is not exempt from everything: the Article 4 AI literacy duty applies to all operators since February 2025, and the classification should be revisited whenever the use case changes.')
    }
  };

  /* ══════════════════════ interface ══════════════════════ */
  const UI = {
    question: (i, n) => t(`Pergunta ${i} de ${n}`, `Question ${i} of ${n}`),
    prev: t('← Anterior', '← Back'),
    next: t('Seguinte', 'Next'),
    seeResult: t('Ver resultado', 'See result'),
    gpaiSys: t('GPAI com risco sistémico', 'GPAI with systemic risk'),
    gpaiBase: t('Regime GPAI', 'GPAI regime'),
    alsoTransp: t('Transparência · Artigo 50.º', 'Transparency · Article 50'),
    bothAnnex: t('Anexo I e Anexo III', 'Annex I and Annex III'),
    stackedRoles: t('Papéis acumulados', 'Stacked roles'),
    verdictLabel: t('Resultado da auto-avaliação', 'Self-assessment result'),
    obsCount: t('obrigações principais identificadas para o seu caso', 'principal obligations identified for your case'),
    docsCount: t('documentos e procedimentos estimados para conformidade plena', 'documents and procedures estimated for full compliance'),
    govCount: t('peças de governação interna que já tem', 'internal governance pieces you already have'),
    regSource: t('Reg. (UE) 2024/1689', 'Reg. (EU) 2024/1689'),
    eniaEstimate: t('Estimativa ENIA', 'ENIA estimate'),
    selfDeclared: t('Auto-declarado', 'Self-declared'),
    obsTitle: t('O que tem de garantir', 'What you must ensure'),
    obsHead: t('As suas obrigações.', 'Your obligations.'),
    dlTitle: t('Contagem decrescente', 'Countdown'),
    dlHead: t('Os prazos que<br>correm contra si.', 'The deadlines<br>running against you.'),
    dlNote: t('Calendário conforme o Digital Omnibus sobre IA, com aprovação final do Conselho a 29 de junho de 2026. Os novos prazos só produzem efeitos jurídicos com a publicação no Jornal Oficial — confirme o estado no',
              'Timeline per the Digital Omnibus on AI, finally approved by the Council on 29 June 2026. The new deadlines only take legal effect once published in the Official Journal — check the status in the'),
    radar: t('Radar', 'Radar'),
    inForce: t('Em vigor', 'In force'),
    days: t('dias', 'days'),
    matTitle: t('Maturidade interna', 'Internal maturity'),
    matHead: t('A que distância está<br>de o conseguir provar.', 'How far you are<br>from being able to prove it.'),
    mat: [
      t('Não se protege o que não se conhece. Sem inventário, política e responsável identificado, qualquer plano de conformidade começa no escuro — e este é o ponto onde a maioria das organizações portuguesas está.',
        'You cannot protect what you cannot see. Without an inventory, a policy and a named owner, any compliance plan starts in the dark — and this is where most Portuguese organisations are.'),
      t('Tem parte da base montada. As peças em falta são normalmente as que a autoridade pede primeiro.',
        'You have part of the foundation in place. The missing pieces are usually the ones the authority asks for first.'),
      t('A sua organização já tem quase toda a base de governação montada. Falta ligar essa base à documentação exigida pelo nível de risco.',
        'Your organisation already has almost the whole governance foundation. What remains is connecting it to the documentation your risk tier requires.')
    ],
    recapTitle: t('As suas respostas', 'Your answers'),
    recap: {
      papel: t('Papel', 'Role'),
      proibidas: t('Práticas proibidas assinaladas', 'Prohibited practices flagged'),
      anexo3: t('Domínios do Anexo III', 'Annex III areas'),
      derrogacao: t('Derrogação do Artigo 6.º(3)', 'Article 6(3) derogation'),
      anexo1: t('Produto do Anexo I', 'Annex I product'),
      gpai: t('Modelo de uso geral', 'General-purpose model'),
      transp: t('Gatilhos de transparência', 'Transparency triggers'),
      legado: t('Sistema legado', 'Legacy system')
    },
    yes: t('Sim', 'Yes'), no: t('Não', 'No'),
    invoked: t('Invocada', 'Invoked'), notInvoked: t('Não invocada', 'Not invoked'), na: t('Não aplicável', 'Not applicable'),
    gpaiSysShort: t('Sim, com risco sistémico', 'Yes, with systemic risk'),
    roles: {
      fornecedor: t('Fornecedor', 'Provider'),
      implementador: t('Implementador', 'Deployer'),
      importador: t('Importador ou distribuidor', 'Importer or distributor'),
      ambos: t('Papéis acumulados', 'Stacked roles')
    },
    download: t('Descarregar PDF', 'Download PDF'),
    copy: t('Copiar resultado', 'Copy result'),
    copied: t('Copiado ✓', 'Copied ✓'),
    copyFail: t('Não foi possível copiar', 'Could not copy'),
    print: t('Imprimir', 'Print'),
    again: t('Repetir o teste', 'Take the test again'),
    discTitle: t('O que isto é e o que não é', 'What this is and what it is not'),
    disc1: t('Esta é uma auto-avaliação orientativa construída sobre o texto do Regulamento (UE) 2024/1689. Não é aconselhamento jurídico, não é uma certificação e não vincula nenhuma autoridade. A classificação final e a sua documentação são responsabilidade do operador.',
             'This is an indicative self-assessment built on the text of Regulation (EU) 2024/1689. It is not legal advice, it is not a certification and it binds no authority. The final classification and its documentation are the operator’s responsibility.'),
    discuss: t('Discutir este resultado connosco, gratuitamente', 'Discuss this result with us, free of charge')
  };

  window.ENIA_TEST = { Q, DL, OB, V, UI, t, EN };
})();
