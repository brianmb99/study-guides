/* Nouns Quiz #2 — all study data.
   Plain objects on purpose, so a person can read and edit the facts.
   Follows Allie's grammar notes (Foundations Review, Unit 1: Nouns, Nouns of Direct Address,
   Direct Object) and the "Nouns Quiz #2" sheet. Spelling slips in the notes are fixed here.

   Tagged sentences: words split by spaces. Each word is "text|tag" or "text|tag.ROLE".
     tags   a = article (small light-blue triangle)   j = adjective (blue triangle)
            n = noun (big black triangle)              v = verb (red circle)
            x = a word the notes have not covered yet (no symbol)
     roles  S = simple subject   DO = direct object   NDA = noun of direct address
            PN = possessive noun (tagged j, because possessive nouns work like adjectives)
   Punctuation (, . ! ?) is its own word with no tag. */

const STUDY = {
  test: {
    name: "Nouns Quiz #2",
    covers: [
      "Subject",
      "Singular and plural",
      "Possessive nouns (really adjectives)",
      "Count nouns",
      "Noncount nouns",
      "Collective nouns",
      "Nouns of direct address",
      "Direct objects",
    ],
    parts: ["Sentence writing", "True or false", "Chart", "Chart", "More sentence writing"],
  },

  plan: {
    steps: [
      ["First", "Crash Course, start to finish. It is short."],
      ["Then", "Find It and Commas until you get a clean round of each."],
      ["Next", "The Chart (plurals and possessives) and Sort It. The test has two charts."],
      ["After that", "True or False, then Write It. Write real sentences, then check them."],
      ["Test morning", "Cram Sheet, then one more True or False round."],
    ],
    big: [
      "Noun = black triangle. Adjective = blue triangle. Article = little light-blue triangle. Verb = red circle.",
      "Plural possessive: make it plural first, then add ' (cats') or 's (mice's).",
      "Collective nouns are groups, but they act singular: “The team is ready.”",
      "Noun of direct address: the person you talk TO. Commas fence it off.",
      "Direct object: who or what receives the action. Ask “verb what?”",
    ],
  },

  symbols: [
    { tag: "n", name: "Noun", says: "person, place, or thing", shape: "big black triangle" },
    { tag: "j", name: "Adjective", says: "describes a noun", shape: "blue triangle" },
    { tag: "a", name: "Article", says: "the, a, an", shape: "little light-blue triangle" },
    { tag: "v", name: "Verb", says: "an action or a state of being", shape: "red circle" },
  ],

  roles: {
    S: { label: "S", name: "simple subject" },
    DO: { label: "D.O.", name: "direct object" },
    NDA: { label: "N.D.A.", name: "noun of direct address" },
    PN: { label: "P.N.", name: "possessive noun" },
  },

  /* ---------- Crash Course ---------- */
  learn: [
    {
      id: "l1",
      title: "Parts of speech and their symbols",
      paragraphs: [
        "A **part of speech** is the job a word does in a complete sentence.",
        "**Noun** — a person, place, or thing. Symbol: a **big black triangle**.",
        "**Adjective** — describes a noun. Symbol: a **blue triangle**.",
        "**Article** — the, a, and an. Symbol: a **little light-blue triangle**.",
        "**Verb** — an action or a state of being. Symbol: a **red circle**.",
      ],
      examples: [
        "A|a silly|j white|j goose|n.S ate|v the|a lazy|j lion|n.DO .",
        "The|a giant|j curious|j spider|n.S crushed|v my|j red|j rocking|j horse|n.DO .",
      ],
      hook: "Nouns are heavy, so they get the big black triangle. Verbs keep moving, so they get a ball.",
    },
    {
      id: "l2",
      title: "Complete sentences and the subject",
      paragraphs: [
        "A **complete sentence** must have a **subject** (a noun) and a **verb**.",
        "The **simple subject** is the noun that **does or is** the action.",
        "To find it, find the verb first. Then ask **“Who or what did it?”** The answer is the subject.",
        "In “The cat kicked the ball,” the verb is kicked. Who kicked? The **cat**. So cat is the subject. We write **S** under it.",
      ],
      examples: ["The|a cat|n.S kicked|v the|a ball|n.DO ."],
      hook: "Verb first, then ask “Who or what did it?”",
    },
    {
      id: "l3",
      title: "Singular and plural nouns",
      paragraphs: [
        "**Singular** noun: only **one** person, place, or thing. **Plural** noun: **more than one**.",
        "Most words just add **-s**: cat → cats, horse → horses.",
        "Words ending in **-ch, -sh, -s, -x, -z** add **-es**: church → churches, fox → foxes.",
        "Consonant + **y**: change the y to **i** and add **-es**: baby → babies.",
        "Some words ending in **-o** add **-es**: tomato → **tomatoes**.",
        "**Irregular** plurals change the word: mouse → **mice**, goose → **geese**, woman → **women**, man → **men**, child → **children**.",
        "Some stay the **same**: one moose, two **moose**. One deer, two deer.",
        "Cactus has two right answers: **cacti** or **cactuses**.",
      ],
      hook: "Two geese chased three mice past four moose.",
    },
    {
      id: "l4",
      title: "Possessive nouns",
      paragraphs: [
        "A **possessive noun** shows **ownership** using an **apostrophe**: the cat’s toy.",
        "**Step 1:** First make the word **singular or plural**. **Step 2:** Then make it **possessive**.",
        "**Singular:** add **’s** — cat’s, horse’s, mouse’s, man’s.",
        "**Plural that ends in s:** add just **’** — cats’, horses’, babies’.",
        "**Plural that does not end in s:** add **’s** — mice’s, men’s, children’s, geese’s.",
        "Possessive nouns are **really adjectives**. “London’s house” — London’s tells **which** house. So it gets a **blue triangle**, and we write **P.N.** under it.",
      ],
      examples: ["London's|j.PN house|n.S threw|v a|a big|j purple|j mouse|n.DO ."],
      hook: "Plural first, possessive second. Never “mouses’.”",
    },
    {
      id: "l5",
      title: "Count and noncount nouns",
      paragraphs: [
        "A **count noun** makes sense with a **number** in front of it: three ducks, two cookies, one cake.",
        "A **noncount noun** does **not** make sense with a number in front of it: flour, rice, happiness, fear, respect.",
        "Test it: say “three ___.” Three cookies? Yes, count. Three rices? No, noncount.",
        "To count a noncount noun, you count something else: three **cups** of flour, two **bowls** of rice.",
      ],
      hook: "Can you say “three ___”? Yes = count. No = noncount.",
    },
    {
      id: "l6",
      title: "Collective nouns",
      paragraphs: [
        "A **collective noun** means a **group**, but it is treated like a **singular** noun.",
        "Examples: class, team, orchestra, group, herd, flock, school (of fish), murder (of crows).",
        "Because it is singular, it takes a singular verb: “The team **is** ready.” “The flock **flies** south.”",
        "Not “the team are” or “the flock fly.”",
      ],
      hook: "Many members, one group. One group gets “is.”",
    },
    {
      id: "l7",
      title: "Nouns of direct address",
      paragraphs: [
        "A **noun of direct address** (N.D.A.) **clarifies who is being spoken to**. It is the name of the person you are talking **to**.",
        "Hint: it is all about **positioning**. Where the N.D.A. sits tells you where the commas go.",
        "**Rule 1:** At the **beginning** of the sentence, the comma comes **after** it. “**Jojo,** throw the cheese.”",
        "**Rule 2:** In the **middle** of the sentence, a comma comes **before and after** it. “I think**, Allie,** that you are right.”",
        "**Rule 3:** At the **end** of the sentence, the comma comes **before** it. “Can you help me**, Dad**?”",
        "Talked **to** or talked **about**? “Mom, the pie is ready” talks to Mom, so it gets a comma. “Mom baked a pie” talks about Mom, so no comma. There, Mom is the subject.",
      ],
      hook: "Commas build a little fence around the person you are talking to.",
    },
    {
      id: "l8",
      title: "Direct objects",
      paragraphs: [
        "A **direct object** (D.O.) answers the question **“Who or what is receiving the action?”**",
        "Find the verb, then ask **“[verb] what?”** or **“[verb] whom?”** The cat kicked **what**? The **ball**. Ball is the D.O.",
        "The direct object is a noun, and it comes **after** the verb.",
        "Not every sentence has one. “The dog ran.” Ran what? Nothing. No direct object.",
      ],
      examples: [
        "The|a cat|n.S kicked|v the|a ball|n.DO .",
        "A|a horse|n.S ate|v a|a blue|j car|n.DO .",
      ],
      hook: "The subject throws the action. The direct object catches it.",
    },
    {
      id: "l9",
      title: "Putting it all together",
      paragraphs: [
        "Here is the last example from the notes, with every symbol and label.",
        "**Jojo** is the person being spoken to, so Jojo is the **N.D.A.** The comma comes **after** it (Rule 1).",
        "Throw **what**? The **cheese**. So cheese is the **D.O.** Tiny and orange describe the cheese, so they are adjectives.",
        "In the notes, Jojo is also marked **S**, because Jojo is the one who will throw. In a command, many grammar books say the real subject is an unspoken **“you”** (you throw the cheese), and Jojo is only the N.D.A. If the test asks you to label it, **N.D.A.** is always right. Mark S too if that is how your class does it.",
      ],
      examples: ["Jojo|n.NDA , throw|v the|a tiny|j orange|j cheese|n.DO ."],
      hook: "Name, comma, command, catch.",
    },
  ],

  /* ---------- Find It: tap the word(s) ---------- */
  /* ask: S | DO | NDA | PN | v | j | a | n.  An empty answer (no direct object) is allowed. */
  find: [
    { s: "The|a cat|n.S kicked|v the|a ball|n.DO .", asks: ["S", "DO", "v"] },
    { s: "A|a horse|n.S ate|v a|a blue|j car|n.DO .", asks: ["S", "DO", "j"] },
    { s: "London's|j.PN house|n.S threw|v a|a big|j purple|j mouse|n.DO .", asks: ["PN", "S", "DO"] },
    { s: "Jojo|n.NDA , throw|v the|a tiny|j orange|j cheese|n.DO .", asks: ["NDA", "DO", "v"] },
    { s: "A|a silly|j white|j goose|n.S ate|v the|a lazy|j lion|n.DO .", asks: ["S", "DO", "j", "a"] },
    { s: "The|a giant|j curious|j spider|n.S crushed|v my|j red|j rocking|j horse|n.DO .", asks: ["S", "DO", "n"] },
    { s: "Grandma|n.NDA , the|a hungry|j geese|n.S ate|v the|a bread|n.DO !", asks: ["NDA", "S", "DO"] },
    { s: "The|a children|n.S built|v a|a huge|j snowman|n.DO , Dad|n.NDA .", asks: ["NDA", "S", "DO"] },
    { s: "The|a team's|j.PN coach|n.S blew|v a|a loud|j whistle|n.DO .", asks: ["PN", "S", "DO"] },
    { s: "The|a mice|n.S nibbled|v the|a old|j cheese|n.DO , Mom|n.NDA .", asks: ["NDA", "S", "v"] },
    { s: "The|a girls'|j.PN dog|n.S chased|v a|a fat|j squirrel|n.DO .", asks: ["PN", "S", "DO"] },
    { s: "Allie|n.S wrote|v a|a funny|j story|n.DO .", asks: ["S", "DO", "NDA"] },
    { s: "The|a orchestra|n.S played|v a|a beautiful|j song|n.DO .", asks: ["S", "DO", "j"] },
    { s: "Ben|n.NDA , the|a baby|n.S grabbed|v the|a man's|j.PN hat|n.DO !", asks: ["NDA", "S", "PN", "DO"] },
    { s: "The|a babies'|j.PN mothers|n.S packed|v a|a big|j lunch|n.DO .", asks: ["PN", "S", "DO"] },
    { s: "Help|v the|a little|j children|n.DO , Sam|n.NDA .", asks: ["NDA", "DO", "v"] },
    { s: "The|a tired|j geese|n.S slept|v .", asks: ["S", "DO"] },
    { s: "The|a dog|n.S ran|v .", asks: ["DO", "v"] },
    { s: "Kids|n.NDA , the|a cactus|n.S has|v sharp|j spines|n.DO !", asks: ["NDA", "S", "DO"] },
    { s: "The|a woman's|j.PN cat|n.S caught|v two|j mice|n.DO .", asks: ["PN", "S", "DO", "j"] },
    { s: "The|a herd|n.S crossed|v the|a wide|j river|n.DO .", asks: ["S", "DO", "a"] },
    { s: "Mia|n.S thanked|v her|j teacher|n.DO .", asks: ["S", "DO", "NDA"] },
  ],

  askText: {
    S: "Tap the simple subject.",
    DO: "Tap the direct object. If there isn’t one, tap “No direct object.”",
    NDA: "Tap the noun of direct address. If there isn’t one, tap “None.”",
    PN: "Tap the possessive noun.",
    v: "Tap the verb.",
    j: "Tap every adjective.",
    a: "Tap every article.",
    n: "Tap every noun.",
  },

  askHelp: {
    S: "Find the verb, then ask “Who or what did it?”",
    DO: "Find the verb, then ask “[verb] what?” The answer is receiving the action.",
    NDA: "Who is being spoken to? A name fenced off by commas.",
    PN: "Look for the apostrophe. It shows who owns something.",
    v: "The action, or a state of being.",
    j: "Words that describe a noun. Possessive nouns count, because they are really adjectives.",
    a: "Only three: the, a, an.",
    n: "Person, place, or thing. (Possessive nouns don’t count here. They work as adjectives.)",
  },

  /* ---------- Commas: where do the N.D.A. commas go? ---------- */
  /* s is the correct sentence. The game removes the commas and asks where they belong.
     rule: 1 beginning, 2 middle, 3 end, 0 no noun of direct address. */
  commas: [
    { s: "Jojo, throw the tiny orange cheese.", rule: 1, nda: "Jojo" },
    { s: "Students, open your grammar notes.", rule: 1, nda: "Students" },
    { s: "Mom, the bus is here.", rule: 1, nda: "Mom" },
    { s: "Grandma, the geese ate the bread!", rule: 1, nda: "Grandma" },
    { s: "I think, Allie, that you are right.", rule: 2, nda: "Allie" },
    { s: "Thank you, Mr. Lee, for the great lesson.", rule: 2, nda: "Mr. Lee" },
    { s: "Your story was funny, Mia, and very clever.", rule: 2, nda: "Mia" },
    { s: "Please remember, Ben, to feed the cat.", rule: 2, nda: "Ben" },
    { s: "Can you help me, Dad?", rule: 3, nda: "Dad" },
    { s: "Happy Thanksgiving, Grandma!", rule: 3, nda: "Grandma" },
    { s: "Look at the herd of moose, Sam!", rule: 3, nda: "Sam" },
    { s: "The children built a huge snowman, Dad.", rule: 3, nda: "Dad" },
    { s: "Mom baked a pumpkin pie.", rule: 0, nda: "", why: "Mom is being talked about, not talked to. She is the subject." },
    { s: "Allie threw the ball to Jojo.", rule: 0, nda: "", why: "Nobody is being spoken to. Allie is the subject, and Jojo just gets the ball." },
    { s: "Dad told Sam a funny joke.", rule: 0, nda: "", why: "Dad and Sam are both talked about. Nobody is being spoken to." },
    { s: "Grandma and Jojo ate the cheese.", rule: 0, nda: "", why: "Grandma and Jojo are the subjects. No one is being spoken to." },
  ],

  ruleText: {
    1: "Rule 1: N.D.A. at the beginning, so the comma comes after it.",
    2: "Rule 2: N.D.A. in the middle, so a comma comes before and after it.",
    3: "Rule 3: N.D.A. at the end, so the comma comes before it.",
    0: "No noun of direct address, so no commas.",
  },

  /* ---------- The Chart: plurals and possessives ---------- */
  /* Arrays hold every answer we accept; the first one is shown as the answer.
     notes: true = the word is in Allie's notes. */
  chart: [
    { sing: "cat", plural: ["cats"], singPoss: ["cat's"], pluralPoss: ["cats'"], notes: true, tip: "Regular: add -s. Plural ends in s, so add just '." },
    { sing: "horse", plural: ["horses"], singPoss: ["horse's"], pluralPoss: ["horses'"], notes: true, tip: "Regular: add -s. Plural possessive is horses' (the notes have “horsey” — it should be horses')." },
    { sing: "mouse", plural: ["mice"], singPoss: ["mouse's"], pluralPoss: ["mice's"], notes: true, tip: "Irregular. Mice doesn't end in s, so add 's: mice's (not “mices”)." },
    { sing: "goose", plural: ["geese"], singPoss: ["goose's"], pluralPoss: ["geese's"], notes: true, tip: "Irregular. Geese doesn't end in s, so add 's." },
    { sing: "moose", plural: ["moose"], singPoss: ["moose's"], pluralPoss: ["moose's"], notes: true, tip: "Same word for one or many, so both possessives are moose's." },
    { sing: "woman", plural: ["women"], singPoss: ["woman's"], pluralPoss: ["women's"], notes: true, tip: "Irregular. Women doesn't end in s, so add 's." },
    { sing: "child", plural: ["children"], singPoss: ["child's"], pluralPoss: ["children's"], notes: true, tip: "Irregular. Children doesn't end in s, so add 's." },
    { sing: "baby", plural: ["babies"], singPoss: ["baby's"], pluralPoss: ["babies'"], notes: true, tip: "Consonant + y: change y to i, add -es. Babies ends in s, so add just '." },
    { sing: "church", plural: ["churches"], singPoss: ["church's"], pluralPoss: ["churches'"], notes: true, tip: "Ends in -ch, so add -es." },
    { sing: "cactus", plural: ["cacti", "cactuses"], singPoss: ["cactus's", "cactus'"], pluralPoss: ["cacti's", "cactuses'"], notes: true, tip: "Two right plurals: cacti or cactuses. Cacti doesn't end in s, so cacti's." },
    { sing: "tomato", plural: ["tomatoes"], singPoss: ["tomato's"], pluralPoss: ["tomatoes'"], notes: true, tip: "Add -es: tomatoes (the notes have “tomatoe” — there's an s on the end)." },
    { sing: "man", plural: ["men"], singPoss: ["man's"], pluralPoss: ["men's"], notes: true, tip: "Irregular. Men doesn't end in s, so add 's." },
    { sing: "fox", plural: ["foxes"], singPoss: ["fox's"], pluralPoss: ["foxes'"], notes: false, tip: "Ends in -x, so add -es." },
    { sing: "lady", plural: ["ladies"], singPoss: ["lady's"], pluralPoss: ["ladies'"], notes: false, tip: "Consonant + y: ladies. Ends in s, so add just '." },
    { sing: "wolf", plural: ["wolves"], singPoss: ["wolf's"], pluralPoss: ["wolves'"], notes: false, tip: "f changes to v: wolves." },
    { sing: "deer", plural: ["deer"], singPoss: ["deer's"], pluralPoss: ["deer's"], notes: false, tip: "Same word for one or many, like moose." },
    { sing: "person", plural: ["people"], singPoss: ["person's"], pluralPoss: ["people's"], notes: false, tip: "Irregular. People doesn't end in s, so add 's." },
    { sing: "class", plural: ["classes"], singPoss: ["class's"], pluralPoss: ["classes'"], notes: false, tip: "Ends in -s, so add -es." },
  ],

  /* ---------- Sort It: count, noncount, or collective ---------- */
  sortBins: [
    ["count", "Count", "Makes sense with a number: three ducks."],
    ["noncount", "Noncount", "Doesn't make sense with a number: three rices?"],
    ["collective", "Collective", "A group, treated as one: the herd."],
  ],
  sort: [
    { w: "duck", bin: "count", notes: true, why: "Three ducks. Makes sense with a number." },
    { w: "cookie", bin: "count", notes: true, why: "Two cookies. Makes sense with a number." },
    { w: "cake", bin: "count", notes: true, why: "One cake, two cakes." },
    { w: "pencil", bin: "count", why: "Five pencils." },
    { w: "apple", bin: "count", why: "Three apples." },
    { w: "egg", bin: "count", why: "A dozen eggs." },
    { w: "idea", bin: "count", why: "You can have two ideas, even though you can't touch them." },
    { w: "friend", bin: "count", why: "Three friends." },
    { w: "flour", bin: "noncount", notes: true, why: "Three flours? No. Three cups of flour." },
    { w: "rice", bin: "noncount", notes: true, why: "Three rices? No. Two bowls of rice." },
    { w: "happiness", bin: "noncount", notes: true, why: "You can't say four happinesses." },
    { w: "fear", bin: "noncount", notes: true, why: "In the notes as noncount: you can't count fear." },
    { w: "respect", bin: "noncount", notes: true, why: "Two respects? No." },
    { w: "water", bin: "noncount", why: "Three waters? Say three glasses of water." },
    { w: "sand", bin: "noncount", why: "You can't count sand. A bucket of sand." },
    { w: "milk", bin: "noncount", why: "A carton of milk, not two milks." },
    { w: "homework", bin: "noncount", why: "Not three homeworks. Three homework pages." },
    { w: "music", bin: "noncount", why: "Not two musics. Two songs." },
    { w: "class", bin: "collective", notes: true, why: "A group of students, treated as one." },
    { w: "team", bin: "collective", notes: true, why: "A group of players: “The team is winning.”" },
    { w: "orchestra", bin: "collective", notes: true, why: "A group of musicians." },
    { w: "group", bin: "collective", notes: true, why: "The word group itself is a collective noun." },
    { w: "herd", bin: "collective", notes: true, why: "A herd of cows or moose." },
    { w: "flock", bin: "collective", notes: true, why: "A flock of geese or sheep." },
    { w: "murder", bin: "collective", notes: true, why: "A murder of crows. A real group name!" },
    { w: "school", bin: "collective", notes: true, why: "A school of fish." },
    { w: "family", bin: "collective", why: "A group of relatives: “My family is here.”" },
    { w: "crowd", bin: "collective", why: "A group of people." },
    { w: "pack", bin: "collective", why: "A pack of wolves." },
  ],

  /* ---------- True or False ---------- */
  tf: [
    { t: "A noun names a person, place, or thing.", a: true, why: "That is the definition of a noun." },
    { t: "An adjective describes a verb.", a: false, why: "An adjective describes a noun." },
    { t: "The, a, and an are articles.", a: true, why: "Those are the three articles." },
    { t: "A verb can be an action or a state of being.", a: true, why: "Ran is an action. Is is a state of being." },
    { t: "A complete sentence needs a subject and a verb.", a: true, why: "Subject (noun) + verb = complete sentence." },
    { t: "The simple subject is the noun that does or is the action.", a: true, why: "That is how the notes define it." },
    { t: "“Geese” is the plural of “goose.”", a: true, why: "Irregular plural: one goose, two geese." },
    { t: "The plural of “moose” is “mooses.”", a: false, why: "One moose, two moose. It stays the same." },
    { t: "The plural of “baby” is “babys.”", a: false, why: "Consonant + y: change y to i and add -es. Babies." },
    { t: "The plural of “tomato” is “tomatoes.”", a: true, why: "Tomato adds -es." },
    { t: "Possessive nouns show ownership using an apostrophe.", a: true, why: "The cat’s toy. The apostrophe shows the toy belongs to the cat." },
    { t: "Possessive nouns are really adjectives.", a: true, why: "They describe a noun by telling whose it is. London’s house." },
    { t: "To make a plural possessive, first make the word plural, then make it possessive.", a: true, why: "Mouse → mice → mice’s." },
    { t: "The plural possessive of “mouse” is “mouses’.”", a: false, why: "Make it plural first: mice. Then add ’s: mice’s." },
    { t: "“The cats’ toys” means the toys belong to one cat.", a: false, why: "Cats’ is plural possessive: more than one cat. One cat would be cat’s." },
    { t: "“The children’s books” is spelled correctly.", a: true, why: "Children doesn’t end in s, so add ’s." },
    { t: "A count noun makes sense with a number in front of it.", a: true, why: "Three ducks. Two cookies." },
    { t: "“Rice” is a count noun.", a: false, why: "Three rices doesn’t make sense. Rice is noncount." },
    { t: "“Happiness” is a noncount noun.", a: true, why: "You can’t say four happinesses." },
    { t: "A collective noun means a group, but it is treated like a singular noun.", a: true, why: "The herd is grazing." },
    { t: "“The team are ready” is correct.", a: false, why: "Team is a collective noun, so it is singular: The team is ready." },
    { t: "A murder of crows is an example of a collective noun.", a: true, why: "Murder is the group name for crows." },
    { t: "A noun of direct address clarifies who is being spoken to.", a: true, why: "It names the person you are talking to." },
    { t: "When the noun of direct address begins the sentence, the comma comes before it.", a: false, why: "At the beginning, the comma comes after it: Jojo, throw the cheese." },
    { t: "When the noun of direct address is in the middle, commas go before and after it.", a: true, why: "I think, Allie, that you are right." },
    { t: "When the noun of direct address ends the sentence, the comma comes before it.", a: true, why: "Can you help me, Dad?" },
    { t: "In “Allie wrote a story,” Allie is a noun of direct address.", a: false, why: "Allie is talked about, not talked to. She is the subject." },
    { t: "A direct object answers “Who or what is receiving the action?”", a: true, why: "The cat kicked the ball. The ball receives the kick." },
    { t: "In “The cat kicked the ball,” ball is the direct object.", a: true, why: "Kicked what? The ball." },
    { t: "Every sentence has a direct object.", a: false, why: "The dog ran. Ran what? Nothing, so no direct object." },
    { t: "The direct object usually comes before the verb.", a: false, why: "It comes after the verb: the cat kicked the ball." },
  ],

  /* ---------- Write It: sentence writing ---------- */
  write: [
    {
      p: "Write a sentence with a noun of direct address at the beginning.",
      checks: ["The name comes first.", "A comma comes right after the name.", "Capital letter at the start, end mark at the end."],
      models: ["Jojo, please feed the cat.", "Mom, the pie smells amazing!"],
    },
    {
      p: "Write a sentence with a noun of direct address in the middle.",
      checks: ["The name is in the middle.", "There is a comma before AND after the name."],
      models: ["I hope, Grandma, that you like the pie.", "Your drawing, Sam, is really good."],
    },
    {
      p: "Write a sentence with a noun of direct address at the end.",
      checks: ["The name is the last word.", "A comma comes right before the name.", "The end mark comes after the name."],
      models: ["Can we go sledding, Dad?", "Happy Thanksgiving, Grandma!"],
    },
    {
      p: "Write a sentence with a subject, a verb, and a direct object. Label the S and the D.O.",
      checks: ["The subject does the action.", "Ask “[verb] what?” The answer is the D.O.", "The D.O. is a noun that comes after the verb."],
      models: ["The dog (S) chewed my shoe (D.O.).", "Allie (S) baked a pie (D.O.)."],
    },
    {
      p: "Write a sentence with a singular possessive noun.",
      checks: ["One owner.", "The noun ends in ’s.", "The possessive noun tells whose thing it is."],
      models: ["The cat’s tail is fluffy.", "My brother’s room is messy."],
    },
    {
      p: "Write a sentence with a plural possessive noun.",
      checks: ["More than one owner.", "Made the word plural first.", "Plural ends in s → add ’ (horses’). Plural doesn’t end in s → add ’s (children’s)."],
      models: ["The horses’ barn is red.", "The children’s coats are on the floor."],
    },
    {
      p: "Write a sentence with an irregular plural noun (mice, geese, women, men, children, or moose).",
      checks: ["Used the irregular plural, not -s.", "The verb matches a plural subject."],
      models: ["Three geese chased the children.", "The mice ate all the cheese."],
    },
    {
      p: "Write a sentence with a collective noun as the subject.",
      checks: ["The subject names a group (team, class, herd, flock…).", "The verb is singular: is, was, has, runs."],
      models: ["The team is practicing today.", "The flock flies south every fall."],
    },
    {
      p: "Write a sentence with a noncount noun.",
      checks: ["The noun doesn’t make sense with a number (flour, rice, water, happiness…).", "No -s on the noncount noun."],
      models: ["We need more flour for the cookies.", "Her kindness made me smile."],
    },
    {
      p: "Write one sentence with a noun of direct address AND a direct object. Label the N.D.A. and the D.O.",
      checks: ["The N.D.A. is fenced off by commas.", "Ask “[verb] what?” to find the D.O."],
      models: ["Jojo (N.D.A.), throw the ball (D.O.).", "Did you find your shoes (D.O.), Ben (N.D.A.)?"],
    },
    {
      p: "Write a sentence with an article, two adjectives, a subject, a verb, and a direct object. Then draw the symbols above each word.",
      checks: ["Article: little light-blue triangle.", "Adjectives: blue triangles.", "Nouns: big black triangles.", "Verb: red circle."],
      models: ["The fluffy white cat chased a mouse."],
      modelTagged: "The|a fluffy|j white|j cat|n.S chased|v a|a mouse|n.DO .",
    },
  ],

  /* ---------- Cram Sheet ---------- */
  cram: [
    {
      h: "Parts of speech",
      lines: [
        "Noun: person, place, or thing. Big black triangle.",
        "Adjective: describes a noun. Blue triangle.",
        "Article: the, a, an. Little light-blue triangle.",
        "Verb: action or state of being. Red circle.",
        "Complete sentence: subject (noun) + verb.",
      ],
    },
    {
      h: "Subject",
      lines: ["Simple subject: the noun that does or is the action. Ask “Who or what did it?” Label: S."],
    },
    {
      h: "Singular and plural",
      lines: [
        "Singular = one. Plural = more than one.",
        "Add -s: cats, horses. Add -es after ch, sh, s, x, z: churches, foxes. Tomato → tomatoes.",
        "Consonant + y → ies: babies.",
        "Irregular: mice, geese, women, men, children. Same: moose, deer.",
        "Cactus → cacti or cactuses.",
      ],
    },
    {
      h: "Possessive nouns",
      lines: [
        "Show ownership with an apostrophe. They are really adjectives. Label: P.N.",
        "Make it singular or plural first, then possessive.",
        "One owner: ’s (cat’s, man’s). Plural ending in s: ’ (cats’, horses’). Plural not ending in s: ’s (mice’s, men’s).",
      ],
    },
    {
      h: "Count, noncount, collective",
      lines: [
        "Count: works with a number. Duck, cookie, cake.",
        "Noncount: doesn’t work with a number. Flour, rice, happiness, fear, respect.",
        "Collective: a group treated as singular. Class, team, orchestra, group, herd, flock, murder, school. “The team is…”",
      ],
    },
    {
      h: "Nouns of direct address",
      lines: [
        "Clarifies who is being spoken to. Label: N.D.A.",
        "Beginning: comma after. Jojo, throw the cheese.",
        "Middle: comma before and after. I think, Allie, that you are right.",
        "End: comma before. Can you help me, Dad?",
        "Talked about, not to? No commas. Mom baked a pie.",
      ],
    },
    {
      h: "Direct objects",
      lines: [
        "Answers “Who or what is receiving the action?” Label: D.O.",
        "Find the verb, ask “[verb] what?” Comes after the verb.",
        "Not every sentence has one: The dog ran.",
      ],
    },
  ],

  fixes: [
    "Plural of tomato is tomatoes (the notes have “tomatoe”).",
    "Plural possessive of horse is horses' (the notes have “horsey”).",
    "Plural possessive of mouse is mice's (not “mices”).",
    "Words to spell right on the test: address, beginning, sentence, possessive.",
    "Jojo, throw the tiny orange cheese: Jojo is the N.D.A. The notes also mark it S. Many books say the subject of a command is an unspoken “you.” N.D.A. is the safe label.",
  ],
};
