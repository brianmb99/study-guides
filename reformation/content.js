/* The Reformation — all study data.
   Built from Allie's class notes (Catholic vs. Protestant chart, science notes,
   Counter-Reformation page), Activity Page 2.1 (Martin Luther: True or False?),
   and Activity Page 3.1 (Domain Vocabulary: Chapters 1–3).
   Plain objects on purpose, so a person can read and edit the facts.
   Text may use **bold**. Anything in `fixes` is a place where the notes were
   corrected or sharpened; the rest follows the notes' own words. */

const STUDY = {
  title: "The Reformation",

  /* From the notes: "Test format" */
  testParts: [
    { name: "Multiple choice", help: "practice with Quiz and Who am I?" },
    { name: "Vocab matching", help: "practice with Vocab (all 11 crossword words, plus words from the notes)" },
    { name: "Protestant or Catholic", help: "practice with Sort (the big chart from the notes)" },
    { name: "Essays", help: "practice with Essays (a checklist and a sample paragraph for each likely question)" },
  ],

  /* ---------- Story: short cards, in order ---------- */
  story: [
    {
      id: "s-church",
      title: "The Catholic Church in charge",
      when: "Before 1517",
      points: [
        "In Western Europe almost everyone belonged to one church: the **Catholic Church**.",
        "The **pope** was in charge, in Rome.",
        "The **Bible** and church services were in **Latin**, which most people could not read.",
        "People were taught that **priests** were the go-betweens to God, and that priests could **forgive sins** when you **confessed**.",
        "The Church sold **indulgences** and showed **relics**, and it paid for **beautiful art** and **lavish cathedrals**.",
      ],
      hook: "Before the Reformation: one Church, one pope, a Latin Bible.",
    },
    {
      id: "s-gutenberg",
      title: "Gutenberg's printing press",
      when: "About 1450",
      points: [
        "**Johannes Gutenberg**, in Germany, built a **printing press** with movable metal letters.",
        "The first big book he printed was the **Gutenberg Bible**.",
        "Books and pamphlets became fast and cheap to make. Later this let **Luther's ideas spread** all over Europe.",
      ],
      hook: "No printing press, no fast-spreading Reformation.",
    },
    {
      id: "s-luther",
      title: "Martin Luther and the 95 Theses",
      when: "1517",
      points: [
        "**Martin Luther** was a German **monk** and an outstanding university **student and teacher**.",
        "On a trip to **Rome** he was upset by how the clergy behaved.",
        "He studied the Bible and decided God's forgiveness could **not** be bought.",
        "He wrote **95 Theses** (95 arguments) against **indulgences** and tacked them to the door of the **Castle Church in Wittenberg**.",
        "This started the **Reformation**: an effort to **reform** (fix) the Church that ended up splitting it.",
      ],
      hook: "95 Theses, 1517, Wittenberg church door.",
    },
    {
      id: "s-worms",
      title: "The Diet of Worms",
      when: "1521",
      points: [
        "The **pope** issued a **papal bull** (an official letter) against Luther's writings. Luther burned it.",
        "Luther was put on trial at the **Diet of Worms**. A *diet* is a formal meeting, and *Worms* is a town in Germany.",
        "He was told to **recant** (take back what he wrote). He **refused**.",
        "He was declared an **outlaw** and a **heretic**, so he went into **hiding** in a castle.",
        "While hiding, he **translated the New Testament from Greek into German** so ordinary people could read it.",
      ],
      hook: "Told to recant. Refused. Outlaw. Hid and translated the Bible.",
    },
    {
      id: "s-protestant",
      title: "What Protestants believed",
      when: "1520s on",
      points: [
        "People who **protested** against the Catholic Church were called **Protestants**. Luther's followers became **Lutherans**.",
        "**Anyone** can pray to God. You do not need a priest in between.",
        "Bibles should be in the **local language**, like German or English.",
        "**Only God** can forgive sins.",
        "**Faith alone** is enough to get into heaven, not buying indulgences.",
      ],
      hook: "Anyone prays, local Bibles, only God forgives, faith alone.",
    },
    {
      id: "s-branches",
      title: "Protestants split into groups",
      when: "1520s–1530s",
      points: [
        "**Zwingli** (Switzerland) agreed with Luther on many things but thought Luther **didn't go far enough**. They could not agree and **became enemies**.",
        "**Calvin** (Geneva, Switzerland) taught **predestination**: God has already decided who will be saved. He had **extreme views against entertainment** and pastimes, as a **response to \"moral decline.\"**",
        "**Anglican** (England): King **Henry VIII** broke from the pope and made the **king or queen head** of the Church of England. It was a **mix of Catholic and Protestant**, kept **many Catholic traditions**, and stayed **pretty lavish**.",
      ],
      hook: "Zwingli: more than Luther. Calvin: predestination. Anglican: the king is head.",
    },
    {
      id: "s-counter",
      title: "The Counter-Reformation",
      when: "1540s–1560s",
      points: [
        "The **Counter-Reformation** was the **Catholic Church** trying to make **internal changes to combat Protestantism**.",
        "Strategy 1: the **Inquisition**, which **hunted down heretics**.",
        "Strategy 2: the **Council of Trent**, an **18-year meeting** (1545–1563) that fixed problems and kept Catholic beliefs.",
        "Strategy 3: **Forbidden Books**. Books by **Martin Luther, Galileo, Copernicus** and more were **banned**.",
      ],
      hook: "Inquisition, Council of Trent, Forbidden Books.",
    },
    {
      id: "s-jesuits",
      title: "The Jesuits",
      when: "1540",
      points: [
        "The **Jesuits** were founded by **St. Ignatius of Loyola**, a former soldier.",
        "Their strategies were **more effective**:",
        "1. **Organized like an army**, and they **cut down on corruption**.",
        "2. **Missionaries in foreign countries**, to **spread Catholicism**. (Protestant rulers accused some of being **spies**.)",
        "3. **Built schools**, mostly **universities**.",
      ],
      hook: "Jesuits: army, missionaries, schools.",
    },
    {
      id: "s-science",
      title: "Science and the Church",
      when: "1543–1633",
      points: [
        "**Ptolemy**, an ancient Greek, believed the **Earth is at the center** of the universe. The **Catholic Church adopted** his system.",
        "**Copernicus**, a **Polish scientist**, described the **heliocentric** model: the **Sun is at the center**.",
        "**Galileo** **confirmed** Copernicus's system with his telescope and experiments. The **Church shut him down multiple times** and **forced him to recant**.",
        "Their books went on the Church's list of **Forbidden Books**.",
      ],
      hook: "Ptolemy: Earth center. Copernicus: Sun center. Galileo: proved it, forced to recant.",
    },
  ],

  /* ---------- Protestant or Catholic ----------
     side: "catholic" | "protestant"
     group (Protestant only): "lutheran" | "zwingli" | "calvin" | "anglican" | null
     The first block is the chart from the notes, in the notes' words. */
  sort: [
    { text: "Indulgences", side: "catholic", why: "The Catholic Church sold indulgences. Luther's 95 Theses attacked them." },
    { text: "The pope is in charge", side: "catholic", why: "The pope leads the Catholic Church from Rome." },
    { text: "The Bible only in Latin", side: "catholic", why: "Catholic Bibles and services were in Latin." },
    { text: "Only priests pray directly to God", side: "catholic", why: "The notes' wording. It means priests were the go-betweens between people and God. (Catholics did pray to God themselves too.)" },
    { text: "Relics", side: "catholic", why: "Catholics honored relics, like bones or belongings of saints." },
    { text: "Priests could forgive sins", side: "catholic", why: "In confession, a Catholic priest forgives sins. Protestants said only God can." },
    { text: "Beautiful art and lavish cathedrals", side: "catholic", why: "The Catholic Church paid for huge, decorated churches and art." },
    { text: "Anyone can pray to God", side: "protestant", group: "lutheran", why: "Protestants said you do not need a priest in between." },
    { text: "Bibles in the local language", side: "protestant", group: "lutheran", why: "Luther translated the New Testament into German." },
    { text: "Only God can forgive sins", side: "protestant", group: "lutheran", why: "Not a priest, and not an indulgence." },
    { text: "Faith alone is enough to get into heaven", side: "protestant", group: "lutheran", why: "Luther's big idea: faith, not paying or good deeds, saves you." },
    { text: "Thought Luther didn't go far enough", side: "protestant", group: "zwingli", why: "Zwingli agreed with Luther on many things, but wanted more change." },
    { text: "Predestination", side: "protestant", group: "calvin", why: "Calvin taught God already decided who will be saved." },
    { text: "Extreme views against entertainment and pastimes", side: "protestant", group: "calvin", why: "Calvin's strict rules were a response to \"moral decline.\"" },
    { text: "The king or queen is head of the church", side: "protestant", group: "anglican", why: "Henry VIII made the English ruler head of the Church of England." },
    { text: "A mix of Catholic and Protestant", side: "protestant", group: "anglican", why: "The Anglican Church kept many Catholic traditions but broke from the pope." },

    { text: "Council of Trent", side: "catholic", why: "The 18-year Catholic meeting of the Counter-Reformation." },
    { text: "The Inquisition hunts down heretics", side: "catholic", why: "A Counter-Reformation strategy of the Catholic Church." },
    { text: "Forbidden Books list", side: "catholic", why: "The Catholic Church banned books by Luther, Galileo, Copernicus, and others." },
    { text: "Jesuits", side: "catholic", why: "Founded by St. Ignatius of Loyola to spread Catholicism." },
    { text: "St. Ignatius of Loyola", side: "catholic", why: "Founder of the Jesuits." },
    { text: "Adopted Ptolemy's Earth-centered system", side: "catholic", why: "The Catholic Church taught that Earth was at the center." },
    { text: "Forced Galileo to recant", side: "catholic", why: "The Catholic Church put Galileo on trial." },
    { text: "The 95 Theses", side: "protestant", group: "lutheran", why: "Luther's 95 arguments against indulgences, 1517." },
    { text: "Martin Luther", side: "protestant", group: "lutheran", why: "He started the Reformation. His followers are Lutherans." },
    { text: "Led by pastors", side: "protestant", group: null, why: "Protestant churches are led by pastors. Catholic churches are led by priests." },
    { text: "Henry VIII", side: "protestant", group: "anglican", why: "The English king who broke from the pope and started the Anglican Church." },
  ],

  groups: {
    lutheran: { name: "Lutheran", who: "Martin Luther, Germany" },
    zwingli: { name: "Zwingli", who: "Huldrych Zwingli, Zurich, Switzerland" },
    calvin: { name: "Calvin", who: "John Calvin, Geneva, Switzerland" },
    anglican: { name: "Anglican", who: "Henry VIII, England" },
  },

  /* ---------- Vocab ----------
     source "crossword": the 11 words and definitions from Activity Page 3.1.
     source "notes": terms from the class notes, defined simply. */
  vocab: [
    { word: "thesis", def: "an idea or opinion", source: "crossword", example: "Luther's 95 Theses were 95 ideas he wanted to argue about." },
    { word: "astronomer", def: "a scientist who studies the stars, the planets, and other features of outer space", source: "crossword", example: "Copernicus and Galileo were astronomers." },
    { word: "heir", def: "the person who will become king or queen after the current king or queen dies or steps down", source: "crossword", example: "Henry VIII wanted a son as his heir." },
    { word: "pastor", def: "a Christian leader in charge of a church", source: "crossword", example: "Protestant churches are led by pastors." },
    { word: "salvation", def: "being saved from the effects of sin", source: "crossword", example: "Luther said salvation comes through faith alone." },
    { word: "scripture", def: "religious writings or the Bible", source: "crossword", example: "Luther wanted everyone to read scripture in their own language." },
    { word: "recant", def: "to publicly take back something you have said or written", source: "crossword", example: "Luther refused to recant. Galileo was forced to recant." },
    { word: "sermon", def: "a speech on a religious topic given by a religious leader", source: "crossword", example: "The pastor gave a sermon in German, not Latin." },
    { word: "ordain", def: "to officially make a person a religious leader", source: "crossword", example: "Luther was ordained as a priest before he broke with the Church." },
    { word: "confess", def: "to admit having done something wrong", source: "crossword", example: "Catholics confess their sins to a priest." },
    { word: "heretic", def: "a person who does not accept or follow the ideas of a particular religion", source: "crossword", example: "The Inquisition hunted down heretics." },

    { word: "Reformation", def: "the movement, started by Martin Luther in 1517, to reform the Catholic Church; it split the Church and created Protestant churches", source: "notes" },
    { word: "Protestant", def: "a Christian who broke away from the Catholic Church during the Reformation", source: "notes" },
    { word: "indulgence", def: "a pardon sold by the Catholic Church that was supposed to reduce punishment for sins", source: "notes" },
    { word: "relic", def: "a holy object, like a bone or belonging of a saint, honored by Catholics", source: "notes" },
    { word: "pope", def: "the leader of the Catholic Church, in Rome", source: "notes" },
    { word: "papal bull", def: "an official letter from the pope", source: "notes" },
    { word: "Diet of Worms", def: "the meeting in Worms, Germany, where Luther was put on trial in 1521", source: "notes" },
    { word: "predestination", def: "Calvin's belief that God has already decided who will be saved", source: "notes" },
    { word: "Counter-Reformation", def: "the Catholic Church making internal changes to combat Protestantism", source: "notes" },
    { word: "Inquisition", def: "the Catholic court that hunted down heretics", source: "notes" },
    { word: "Council of Trent", def: "an 18-year meeting of Catholic leaders (1545–1563) to fix problems and fight Protestantism", source: "notes" },
    { word: "Jesuits", def: "a Catholic group founded by St. Ignatius of Loyola, organized like an army, that sent missionaries and built schools", source: "notes" },
    { word: "missionary", def: "a person sent to another country to spread a religion", source: "notes" },
    { word: "heliocentric", def: "a model of the universe with the Sun at the center", source: "notes" },
    { word: "printing press", def: "Gutenberg's machine for printing books quickly", source: "notes" },
  ],

  /* ---------- People: "Who am I?" ---------- */
  people: [
    {
      name: "Martin Luther",
      tag: "Started the Reformation",
      facts: [
        "German monk and university teacher.",
        "Wrote the 95 Theses against indulgences in 1517.",
        "Refused to recant at the Diet of Worms, was declared an outlaw, and hid.",
        "Translated the New Testament from Greek into German.",
      ],
      clues: [
        "I tacked 95 Theses to a church door in Wittenberg.",
        "I refused to recant at the Diet of Worms.",
        "I translated the New Testament into German while I was in hiding.",
      ],
    },
    {
      name: "Johannes Gutenberg",
      tag: "Printing press",
      facts: [
        "German inventor of a printing press with movable type, about 1450.",
        "The first big book he printed was the Gutenberg Bible.",
      ],
      clues: [
        "I built the printing press.",
        "The first big book I printed was a Bible named after me.",
      ],
    },
    {
      name: "Huldrych Zwingli",
      tag: "Protestant, Switzerland",
      facts: [
        "Agreed with Luther on many things.",
        "Thought Luther didn't go far enough.",
        "He and Luther became enemies.",
      ],
      clues: [
        "I agreed with Luther on many things, but I thought he didn't go far enough.",
        "Luther and I became enemies.",
      ],
    },
    {
      name: "John Calvin",
      tag: "Protestant, Geneva",
      facts: [
        "Taught predestination.",
        "Had extreme views against entertainment and pastimes.",
        "His strict rules were a response to \"moral decline.\"",
      ],
      clues: [
        "I taught predestination.",
        "I had extreme views against entertainment and pastimes.",
      ],
    },
    {
      name: "Henry VIII",
      tag: "Anglican, England",
      facts: [
        "King of England who broke away from the pope.",
        "Made the king or queen head of the Church of England (the Anglican Church).",
      ],
      clues: [
        "I made the king or queen head of the church in England.",
        "My church was a mix of Catholic and Protestant.",
      ],
    },
    {
      name: "St. Ignatius of Loyola",
      tag: "Founded the Jesuits",
      facts: [
        "A former soldier who founded the Jesuits in 1540.",
        "Organized them like an army.",
      ],
      clues: [
        "I founded the Jesuits.",
        "I organized my followers like an army.",
      ],
    },
    {
      name: "Ptolemy",
      tag: "Earth at the center",
      facts: [
        "Ancient Greek who believed Earth was at the center of the universe.",
        "The Catholic Church adopted his system.",
      ],
      clues: [
        "I believed Earth was at the center of the universe.",
        "The Catholic Church adopted my system.",
      ],
    },
    {
      name: "Nicolaus Copernicus",
      tag: "Sun at the center",
      facts: [
        "Polish scientist.",
        "Described the heliocentric model: the Sun is at the center.",
        "His book was banned on the Forbidden Books list.",
      ],
      clues: [
        "I was a Polish scientist.",
        "I described the heliocentric model, with the Sun at the center.",
      ],
    },
    {
      name: "Galileo Galilei",
      tag: "Proved it, forced to recant",
      facts: [
        "Confirmed Copernicus's Sun-centered system with his telescope and experiments.",
        "The Church shut him down multiple times and forced him to recant.",
      ],
      clues: [
        "I confirmed that the Sun is at the center.",
        "The Church forced me to recant.",
      ],
    },
    {
      name: "The pope",
      tag: "Leader of the Catholic Church",
      facts: [
        "Head of the Catholic Church, in Rome.",
        "Issued a papal bull against Luther's writings.",
      ],
      clues: [
        "I am in charge of the Catholic Church.",
        "I issued a papal bull against Luther's writings.",
      ],
    },
  ],

  /* ---------- Martin Luther: True or False (Activity Page 2.1) ----------
     The first 10 are the worksheet, with the graded answers. A false statement
     carries `fix`: the true version. */
  luther: [
    { text: "After his trial when he was declared an outlaw, Luther went into hiding.", answer: true, worksheet: 1 },
    { text: "Luther believed that priests could forgive sins if people were truly sorry.", answer: false, worksheet: 2, fix: "Luther believed only God can forgive sins." },
    { text: "During a trip to Rome while he was a student, Luther was upset by the behavior of the Catholic clergy.", answer: true, worksheet: 3 },
    { text: "Luther was an outstanding university student and teacher.", answer: true, worksheet: 4 },
    { text: "Luther's studies of the Bible convinced him that God's forgiveness could be purchased from priests as indulgences.", answer: false, worksheet: 5, fix: "His studies convinced him forgiveness could NOT be bought. That is why he attacked indulgences." },
    { text: "Luther summarized his ideas about indulgences on a notice that he tacked onto the door of Wittenberg's Castle Church.", answer: true, worksheet: 6 },
    { text: "Luther was easily discouraged and stopped criticizing the practices of the Catholic Church with which he disagreed.", answer: false, worksheet: 7, fix: "He never stopped. He refused to recant, even when declared an outlaw." },
    { text: "The pope issued a papal bull that supported Luther's writings.", answer: false, worksheet: 8, fix: "The papal bull condemned Luther's writings. Luther burned it." },
    { text: "While he was in hiding, Luther translated the New Testament of the Bible from Greek into German.", answer: true, worksheet: 9 },
    { text: "The printing press helped Luther to widely spread his ideas in the books and pamphlets he wrote.", answer: true, worksheet: 10 },

    { text: "At the Diet of Worms, Luther agreed to recant.", answer: false, fix: "He refused to recant." },
    { text: "Luther's 95 Theses were written against indulgences.", answer: true },
    { text: "Luther believed faith alone is enough to get into heaven.", answer: true },
    { text: "Luther wanted the Bible to stay only in Latin.", answer: false, fix: "He wanted Bibles in the local language, like German." },
    { text: "Luther's followers became known as Lutherans.", answer: true },
  ],

  /* ---------- Multiple choice ----------
     `answer` is the index of the right choice. Choices get shuffled. */
  quiz: [
    { q: "What did Martin Luther attack in his 95 Theses?", choices: ["Indulgences", "The printing press", "The Jesuits", "Predestination"], answer: 0, why: "The 95 Theses argued against selling indulgences." },
    { q: "Where did Luther post the 95 Theses?", choices: ["The door of Wittenberg's Castle Church", "St. Peter's in Rome", "The town hall in Worms", "A cathedral in England"], answer: 0 },
    { q: "In what year did Luther post the 95 Theses?", choices: ["1517", "1450", "1545", "1633"], answer: 0 },
    { q: "What happened to Luther at the Diet of Worms?", choices: ["He refused to recant and was declared an outlaw", "He recanted and went back to the Church", "He was made pope", "He founded the Jesuits"], answer: 0 },
    { q: "What did Luther do while he was in hiding?", choices: ["Translated the New Testament into German", "Built a printing press", "Wrote about predestination", "Led the Council of Trent"], answer: 0 },
    { q: "How did the printing press help the Reformation?", choices: ["Luther's books and pamphlets spread quickly and cheaply", "It printed the Forbidden Books list", "It kept the Bible in Latin", "It helped the Inquisition find heretics"], answer: 0 },
    { q: "Who invented the printing press?", choices: ["Gutenberg", "Galileo", "Calvin", "Zwingli"], answer: 0 },
    { q: "What was the first big book printed on Gutenberg's press?", choices: ["The Gutenberg Bible", "The 95 Theses", "A book by Copernicus", "The Forbidden Books list"], answer: 0 },
    { q: "Which is a Protestant belief?", choices: ["Faith alone is enough to get into heaven", "Priests can forgive sins", "The pope is in charge", "The Bible should only be in Latin"], answer: 0 },
    { q: "Which is a Catholic practice from the notes?", choices: ["Honoring relics", "Predestination", "The king or queen as head of the church", "Bibles in the local language"], answer: 0 },
    { q: "Who thought Luther didn't go far enough?", choices: ["Zwingli", "Henry VIII", "Ignatius of Loyola", "Ptolemy"], answer: 0 },
    { q: "Which Protestant leader taught predestination?", choices: ["Calvin", "Luther", "Zwingli", "Henry VIII"], answer: 0 },
    { q: "What is predestination?", choices: ["The belief that God has already decided who will be saved", "Buying forgiveness from a priest", "A trip to Rome", "A list of banned books"], answer: 0 },
    { q: "Who is head of the Anglican Church?", choices: ["The king or queen of England", "The pope", "John Calvin", "The Jesuits"], answer: 0 },
    { q: "Why do the notes call the Anglican Church a \"mix\"?", choices: ["It kept many Catholic traditions but was Protestant", "It mixed Latin and Greek", "It had two popes", "It was part Lutheran and part Calvinist"], answer: 0 },
    { q: "What was the Counter-Reformation?", choices: ["The Catholic Church making internal changes to combat Protestantism", "Protestants fighting each other", "Luther's trial", "Gutenberg printing Bibles"], answer: 0 },
    { q: "What was the job of the Inquisition?", choices: ["To hunt down heretics", "To build schools", "To translate the Bible", "To elect the pope"], answer: 0 },
    { q: "How long did the Council of Trent meet, on and off?", choices: ["18 years", "18 days", "95 days", "1 year"], answer: 0 },
    { q: "Whose books were on the Forbidden Books list?", choices: ["Martin Luther, Galileo, and Copernicus", "Ignatius of Loyola", "The pope", "Ptolemy"], answer: 0 },
    { q: "Who founded the Jesuits?", choices: ["St. Ignatius of Loyola", "Martin Luther", "John Calvin", "Henry VIII"], answer: 0 },
    { q: "Which was NOT a Jesuit strategy?", choices: ["Selling more indulgences", "Organizing like an army", "Sending missionaries to foreign countries", "Building schools and universities"], answer: 0, why: "The Jesuits cut down on corruption. Selling indulgences was what Luther complained about." },
    { q: "Who believed Earth was at the center of the universe?", choices: ["Ptolemy", "Copernicus", "Galileo", "Gutenberg"], answer: 0 },
    { q: "What does heliocentric mean?", choices: ["The Sun is at the center", "Earth is at the center", "The Moon is at the center", "There is no center"], answer: 0 },
    { q: "Copernicus was a scientist from which country?", choices: ["Poland", "Italy", "Germany", "England"], answer: 0 },
    { q: "What did the Church force Galileo to do?", choices: ["Recant", "Leave for Poland", "Become a Jesuit", "Burn the papal bull"], answer: 0 },
    { q: "A person who does not accept the ideas of a particular religion is a…", choices: ["heretic", "pastor", "heir", "astronomer"], answer: 0 },
    { q: "To publicly take back something you said or wrote is to…", choices: ["recant", "ordain", "confess", "preach"], answer: 0 },
  ],

  /* ---------- Essays ----------
     The real prompts are not known yet. These cover the big topics in the notes. */
  essays: [
    {
      id: "e-luther",
      prompt: "Why did Martin Luther break away from the Catholic Church, and what happened to him?",
      checklist: [
        "Luther was a monk and teacher who was upset by the clergy in Rome",
        "He believed forgiveness could not be bought, so he was against indulgences",
        "95 Theses on the Wittenberg church door (1517)",
        "The pope's papal bull, then the Diet of Worms",
        "He refused to recant, was declared an outlaw, and hid",
        "He translated the New Testament into German",
        "The printing press spread his ideas",
      ],
      sample: "Martin Luther broke away from the Catholic Church because he believed the Church was doing wrong things. He was a German monk and teacher, and on a trip to Rome he was upset by how the clergy acted. The Church sold indulgences, but Luther's study of the Bible convinced him that God's forgiveness could not be bought. In 1517 he wrote the 95 Theses against indulgences and tacked them to the door of the Castle Church in Wittenberg. The pope sent a papal bull against him, and at the Diet of Worms he was told to recant. Luther refused, so he was declared an outlaw and went into hiding. While hiding, he translated the New Testament into German so ordinary people could read it. Thanks to the printing press, his ideas spread all over Europe and started the Reformation.",
    },
    {
      id: "e-compare",
      prompt: "Compare Catholic and Protestant beliefs.",
      checklist: [
        "Who is in charge: the pope vs. no pope",
        "Bible: only in Latin vs. local language",
        "Praying: priests as go-betweens vs. anyone can pray to God",
        "Forgiveness: priests forgive sins vs. only God can",
        "Heaven: indulgences vs. faith alone",
        "Churches: lavish cathedrals, relics, and art",
        "Something they share: both are Christian and use the Bible",
      ],
      sample: "Catholics and Protestants are both Christians, but they disagreed about many things during the Reformation. Catholics followed the pope, but Protestants did not. The Catholic Bible was only in Latin, while Protestants wanted Bibles in the local language so everyone could read them. Catholics believed priests were the go-betweens to God and could forgive sins, but Protestants said anyone can pray to God and only God can forgive sins. The Catholic Church sold indulgences, while Protestants believed faith alone is enough to get into heaven. Catholics also had relics, beautiful art, and lavish cathedrals. These differences split the Church in two.",
    },
    {
      id: "e-counter",
      prompt: "What was the Counter-Reformation? Describe how the Catholic Church fought back.",
      checklist: [
        "Definition: the Catholic Church made internal changes to combat Protestantism",
        "The Inquisition hunted down heretics",
        "The Council of Trent, an 18-year meeting",
        "Forbidden Books: Luther, Galileo, Copernicus",
        "The Jesuits, founded by St. Ignatius of Loyola",
        "Jesuits: organized like an army, missionaries, schools and universities",
        "Which worked better: the Jesuits",
      ],
      sample: "The Counter-Reformation was when the Catholic Church tried to make internal changes to combat Protestantism. First, the Church used the Inquisition to hunt down heretics. Second, it held the Council of Trent, a meeting that lasted 18 years. Third, it made a list of Forbidden Books and banned books by Martin Luther, Galileo, Copernicus, and others. The Jesuits had even more effective strategies. They were founded by St. Ignatius of Loyola and were organized like an army, which cut down on corruption. They sent missionaries to foreign countries to spread Catholicism, and they built schools, mostly universities. Because of the Counter-Reformation, the Catholic Church grew stronger again.",
    },
    {
      id: "e-groups",
      prompt: "Describe the different Protestant groups that came out of the Reformation.",
      checklist: [
        "Lutherans: followers of Luther; faith alone, local-language Bibles",
        "Zwingli: agreed on many things, thought Luther didn't go far enough, became enemies",
        "Calvin: predestination, against entertainment, response to \"moral decline\"",
        "Anglican: king or queen is head, mix of Catholic and Protestant, pretty lavish",
      ],
      sample: "After the Reformation, Protestants split into different groups. Lutherans followed Martin Luther and believed that faith alone is enough to get into heaven and that Bibles should be in the local language. Zwingli agreed with Luther on many things, but he thought Luther didn't go far enough, and the two became enemies. Calvin taught predestination, the belief that God has already decided who will be saved. He had extreme views against entertainment because he was worried about moral decline. In England, the Anglican Church made the king or queen the head of the church. It was a mix of Catholic and Protestant and kept many Catholic traditions. Even though these groups disagreed, they all broke away from the pope.",
    },
    {
      id: "e-science",
      prompt: "Why did scientists like Copernicus and Galileo get in trouble with the Catholic Church?",
      checklist: [
        "Ptolemy: ancient Greek, Earth at the center, adopted by the Church",
        "Copernicus: Polish scientist, heliocentric (Sun at the center)",
        "Galileo: confirmed it with his telescope and experiments",
        "The Church shut Galileo down multiple times and forced him to recant",
        "Their books went on the Forbidden Books list",
      ],
      sample: "Copernicus and Galileo got in trouble because their ideas went against what the Catholic Church taught. The Church had adopted the system of Ptolemy, an ancient Greek who believed Earth was at the center of the universe. Copernicus, a Polish scientist, described the heliocentric model, which puts the Sun at the center. Later, Galileo confirmed this system with his telescope and experiments. The Church shut Galileo down multiple times and forced him to recant. Books by both scientists were put on the list of Forbidden Books. The Church saw their ideas as a challenge to its authority, especially during the Counter-Reformation.",
    },
    {
      id: "e-press",
      prompt: "How did the printing press help the Reformation?",
      checklist: [
        "Gutenberg invented the printing press (about 1450)",
        "First big book: the Gutenberg Bible",
        "Books became faster and cheaper to make",
        "Luther's books and pamphlets spread his ideas widely",
        "Bibles in local languages could reach ordinary people",
      ],
      sample: "The printing press helped the Reformation by spreading new ideas quickly. Johannes Gutenberg invented the printing press, and the first big book he printed was the Gutenberg Bible. Before this, books had to be copied by hand, so they were slow and expensive to make. With the printing press, Martin Luther's books and pamphlets could be printed fast and sent all over Europe. Luther's German translation of the New Testament could also be printed, so ordinary people could read the Bible in their own language. Without the printing press, Luther's ideas might never have spread so far.",
    },
  ],

  essayTips: [
    "Start with a topic sentence that answers the question.",
    "Give at least three facts. Use names and dates: Luther, 1517, Diet of Worms.",
    "Use the vocab words: recant, heretic, salvation, scripture.",
    "End with a sentence that says why it mattered.",
  ],

  /* Easy-to-misspell names, for essays. */
  spellings: [
    "Martin Luther", "Wittenberg", "Diet of Worms", "Zwingli", "Calvin", "Anglican",
    "Counter-Reformation", "Inquisition", "Council of Trent", "Jesuits",
    "St. Ignatius of Loyola", "Gutenberg", "Ptolemy", "Copernicus", "Galileo",
    "heliocentric", "predestination", "indulgences", "Protestantism",
  ],

  /* ---------- Fixes: where the notes were corrected or sharpened ---------- */
  fixes: [
    {
      notes: "Catholic: \"Only priests pray directly to God.\"",
      fixed: "Catholics prayed to God themselves too. The real difference: the Catholic Church taught that priests were needed as go-betweens, for example to forgive sins in confession. Protestants said anyone can go straight to God. On the test, \"only priests pray directly to God\" is still the Catholic side.",
    },
    {
      notes: "Copernicus was the \"1st to describe\" the heliocentric model.",
      fixed: "An ancient Greek named Aristarchus guessed the Sun was at the center about 1,800 years earlier. Copernicus was the first to work out the whole Sun-centered model with math. For the test, Copernicus = the heliocentric model.",
    },
    {
      notes: "Galileo \"confirmed system with experiments.\"",
      fixed: "He mostly confirmed it by looking through his telescope (he saw moons circling Jupiter, for example). It is fine to say telescope and experiments.",
    },
    {
      notes: "Diet of Worms: \"council of powerful church people.\"",
      fixed: "It was a meeting of the Holy Roman Empire, led by Emperor Charles V, with princes and nobles as well as church leaders. It is still where Luther was put on trial.",
    },
    {
      notes: "Gutenberg: \"1st book = Gutenberg Bible.\"",
      fixed: "It was the first big book printed in Europe with movable metal type. People in China and Korea had printed books earlier.",
    },
    {
      notes: "Jesuits: \"spread Catholicism, spies.\"",
      fixed: "Jesuits were missionaries. Protestant rulers, especially in England, accused some of them of being spies because they worked in secret there.",
    },
    {
      notes: "Spellings in the notes: Refirmation, Ignatius of Loyela, Guten Burg, trent, Anceint.",
      fixed: "Reformation, Ignatius of Loyola, Gutenberg, Council of Trent, Ancient. See the spelling list on the Cram sheet.",
    },
  ],

  /* ---------- Cram sheet ---------- */
  cram: [
    { head: "1517", text: "Luther's 95 Theses against indulgences, Wittenberg. The Reformation begins." },
    { head: "1521", text: "Diet of Worms. Luther refuses to recant, is declared an outlaw, hides, and translates the New Testament into German." },
    { head: "Catholic", text: "Pope in charge, Latin Bible, priests forgive sins, indulgences, relics, lavish art and cathedrals." },
    { head: "Protestant", text: "Anyone can pray to God, local-language Bibles, only God forgives, faith alone." },
    { head: "Zwingli", text: "Luther didn't go far enough. They became enemies." },
    { head: "Calvin", text: "Predestination. Against entertainment. Response to \"moral decline.\"" },
    { head: "Anglican", text: "King or queen is head. Mix of Catholic and Protestant. Pretty lavish." },
    { head: "Counter-Reformation", text: "Catholic Church fights back: Inquisition, Council of Trent (18 years), Forbidden Books." },
    { head: "Jesuits", text: "St. Ignatius of Loyola. Organized like an army, missionaries, schools and universities." },
    { head: "Science", text: "Ptolemy: Earth center (Church adopted it). Copernicus: Sun center. Galileo: confirmed it, forced to recant." },
    { head: "Gutenberg", text: "Printing press. First big book: the Gutenberg Bible. It spread Luther's ideas." },
  ],
};
