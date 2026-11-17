/* Latin Roots — Vocabulary from Classical Roots, Lessons 1–3 (Allie).
   Plain objects on purpose, so a person can read and edit the facts.
   Words are the 30 from the Lesson 4 sorting box.
   Every practice question below is new; none are copied from the book. */

const STUDY = {
  title: "Latin Roots",
  subtitle: "Lessons 1–3 · See, Hear, Speak",

  /* The six roots, in sorting order (the Lesson 4 boxes 1–6). */
  roots: [
    { id: "vis", label: "VIS", meaning: "see", lesson: 1, from: "Latin videre, visum: to see", hook: "VISion is how you see." },
    { id: "spect", label: "SPECT", meaning: "see; look", lesson: 1, from: "Latin specere, spectum: to look at", hook: "SPECTacles help you see." },
    { id: "audi", label: "AUDI", meaning: "hear", lesson: 2, from: "Latin audire: to hear", hook: "AUDIo is sound you hear." },
    { id: "phon", label: "PHON", meaning: "hear; sound", lesson: 2, from: "Greek phone: sound, voice", hook: "You hear voices on a PHONe." },
    { id: "dict", label: "DICT", meaning: "speak; say", lesson: 3, from: "Latin dicere, dictum: to say, speak", hook: "A DICTionary tells you how to say words." },
    { id: "voc", label: "VOC", meaning: "speak; voice; call", lesson: 3, from: "Latin vocare: to call; vox: voice", hook: "VOCal sounds come from your voice." },
  ],

  /* Prefix and suffix pairs from Exercise A matching. `test: true` = on the matching. */
  parts: [
    { id: "super", label: "super-", meaning: "big; above", test: true, examples: ["supervise", "superhero", "superior"], hook: "Superman flies above everyone." },
    { id: "orium", label: "-orium / -arium", meaning: "place", test: true, examples: ["auditorium", "aquarium", "planetarium"], hook: "An aquarium is a place for water animals." },
    { id: "pre", label: "pre-", meaning: "before", test: true, examples: ["predict", "preview", "prehistoric"], hook: "You preheat the oven before baking." },
    { id: "re", label: "re-", meaning: "again; back", test: false, examples: ["revise", "respect"], hook: "Revise = see it again." },
    { id: "in", label: "in-", meaning: "not", test: false, examples: ["inaudible", "invisible"], hook: "Inaudible = not hearable." },
    { id: "contra", label: "contra-", meaning: "against", test: false, examples: ["contradict"], hook: "Contradict = speak against." },
    { id: "mega", label: "mega-", meaning: "large; great", test: false, examples: ["megaphone"], hook: "A megaphone makes a mega sound." },
    { id: "sym", label: "sym-", meaning: "together", test: false, examples: ["symphony"], hook: "A symphony = sounds together." },
  ],

  /* Exercise A matching: the six things to match and the six meanings (A–F in the book). */
  matching: [
    { left: "vis and spect", right: "see" },
    { left: "audi and phon", right: "hear" },
    { left: "dict and voc", right: "speak" },
    { left: "super-", right: "big; above" },
    { left: "-orium / -arium", right: "place" },
    { left: "pre-", right: "before" },
  ],

  /* `parts` shows how the word is built. `sentence` is a new example, not from the book. */
  words: [
    // Lesson 1 — VIS / SPECT (see)
    { word: "envision", root: "vis", pos: "v.", def: "To picture something in your mind; to imagine it.", parts: "en (in) + vis (see)", sentence: "Close your eyes and envision your dream treehouse." },
    { word: "prospect", root: "spect", pos: "n.", def: "Something that may happen; a chance you look forward to.", parts: "pro (forward) + spect (look)", sentence: "The prospect of a snow day made the whole class cheer." },
    { word: "respect", root: "spect", pos: "v. / n.", def: "To look up to someone; to treat with honor and care.", parts: "re (back) + spect (look)", sentence: "We show respect by listening when others talk." },
    { word: "revise", root: "vis", pos: "v.", def: "To look over again and change or fix.", parts: "re (again) + vis (see)", sentence: "I had to revise my story after my teacher read it." },
    { word: "spectacle", root: "spect", pos: "n.", def: "An amazing sight or public show.", parts: "spect (see) + acle", sentence: "The fireworks over the lake were quite a spectacle." },
    { word: "spectacular", root: "spect", pos: "adj.", def: "Amazing to see; very impressive.", parts: "spect (see) + acular", sentence: "The view from the mountain top was spectacular." },
    { word: "spectator", root: "spect", pos: "n.", def: "A person who watches an event.", parts: "spect (see) + ator (one who)", sentence: "Every spectator in the stands jumped up when she scored." },
    { word: "supervise", root: "vis", pos: "v.", def: "To watch over and be in charge of.", parts: "super (above) + vis (see)", sentence: "A lifeguard supervises the swimmers at the pool." },
    { word: "visible", root: "vis", pos: "adj.", def: "Able to be seen.", parts: "vis (see) + ible (able)", sentence: "On a clear night, thousands of stars are visible." },
    { word: "visor", root: "vis", pos: "n.", def: "The front brim of a cap, or a shield that shades the eyes.", parts: "vis (see) + or", sentence: "She pulled down her visor to block the bright sun." },

    // Lesson 2 — AUDI / PHON (hear)
    { word: "audible", root: "audi", pos: "adj.", def: "Loud enough to be heard.", parts: "audi (hear) + ble (able)", sentence: "His whisper was barely audible from the back row." },
    { word: "audience", root: "audi", pos: "n.", def: "A group of people who listen to or watch a show.", parts: "audi (hear) + ence", sentence: "The audience clapped after the last song." },
    { word: "audition", root: "audi", pos: "n. / v.", def: "A short performance to try out for a part.", parts: "audi (hear) + tion", sentence: "Mia sang at her audition for the school musical." },
    { word: "auditorium", root: "audi", pos: "n.", def: "A large room or building where an audience gathers.", parts: "audi (hear) + orium (place)", sentence: "The whole school met in the auditorium for the play." },
    { word: "inaudible", root: "audi", pos: "adj.", def: "Not able to be heard.", parts: "in (not) + audi (hear) + ble", sentence: "With the fans blowing, his voice was inaudible." },
    { word: "megaphone", root: "phon", pos: "n.", def: "A cone you speak into to make your voice louder.", parts: "mega (large) + phon (sound)", sentence: "The coach used a megaphone to call the runners." },
    { word: "phonics", root: "phon", pos: "n.", def: "A way of learning to read by the sounds letters make.", parts: "phon (sound) + ics", sentence: "My little brother uses phonics to sound out new words." },
    { word: "saxophone", root: "phon", pos: "n.", def: "A curved brass wind instrument played with a reed.", parts: "Sax (inventor's name) + phon (sound)", sentence: "The saxophone played a smooth solo in the jazz song." },
    { word: "stereophonic", root: "phon", pos: "adj.", def: "Sound that comes from two or more speakers so it seems real and full.", parts: "stereo (solid) + phon (sound) + ic", sentence: "The movie theater has stereophonic sound all around you." },
    { word: "symphony", root: "phon", pos: "n.", def: "A long piece of music for a full orchestra; also the orchestra itself.", parts: "sym (together) + phon (sound)", sentence: "The symphony played for two hours without a break." },

    // Lesson 3 — DICT / VOC (speak)
    { word: "addictive", root: "dict", pos: "adj.", def: "Habit-forming; hard to stop, easy to say yes to.", parts: "ad (to) + dict (say)", sentence: "That phone game is so addictive I can't put it down." },
    { word: "avocation", root: "voc", pos: "n.", def: "A hobby; the thing you most enjoy doing (not your job).", parts: "a (away) + voc (call) + ation", sentence: "My aunt is a nurse, but her avocation is painting." },
    { word: "contradict", root: "dict", pos: "v.", def: "To speak against; to say the opposite of.", parts: "contra (against) + dict (say)", sentence: "Please don't contradict me; I know what I saw." },
    { word: "dictation", root: "dict", pos: "n.", def: "Saying words out loud for someone else to write down.", parts: "dict (say) + ation", sentence: "Our teacher read a dictation, and we wrote every word." },
    { word: "dictator", root: "dict", pos: "n.", def: "A ruler with total power over a country.", parts: "dict (say) + ator (one who)", sentence: "The dictator made rules that nobody could question." },
    { word: "predict", root: "dict", pos: "v.", def: "To say what will happen before it happens.", parts: "pre (before) + dict (say)", sentence: "I predict that our team will win on Friday." },
    { word: "verdict", root: "dict", pos: "n.", def: "The decision a jury makes at the end of a trial.", parts: "ver (truly) + dict (said)", sentence: "The jury gave a verdict of not guilty." },
    { word: "vocal", root: "voc", pos: "adj.", def: "1. Having to do with the voice. 2. Speaking out often and strongly.", parts: "voc (voice) + al", sentence: "Grandpa is very vocal about how much he loves pie." },
    { word: "vocalist", root: "voc", pos: "n.", def: "A singer.", parts: "voc (voice) + al + ist (one who)", sentence: "The band's vocalist sang the first verse alone." },
    { word: "vocation", root: "voc", pos: "n.", def: "A job; a calling to a type of work.", parts: "voc (call) + ation", sentence: "Teaching is her vocation; she has done it for 20 years." },
  ],

  /* Exercise B "add another word" — words that are NOT in the box, for each root. */
  extras: {
    vis: ["vision", "invisible", "visit", "visual", "television", "visitor"],
    spect: ["inspect", "spectacles", "suspect", "inspector", "expect", "perspective"],
    audi: ["audio", "auditory", "audiobook", "audit"],
    phon: ["telephone", "microphone", "headphones", "xylophone", "phonetics", "homophone"],
    dict: ["dictionary", "dictate", "diction", "valedictorian", "prediction"],
    voc: ["vocabulary", "advocate", "vocalize", "vociferous", "convocation"],
  },

  /* SYNONYMS: pick the word or phrase closest in meaning to the bold word. */
  synonyms: [
    { phrase: "a loud **spectator** in the bleachers", answer: "watcher", choices: ["watcher", "player", "coach", "singer"] },
    { phrase: "a **visible** scratch on the car", answer: "able to be seen", choices: ["able to be seen", "tiny", "hidden", "painful"] },
    { phrase: "**revise** your book report", answer: "fix and improve", choices: ["fix and improve", "read aloud", "throw away", "print"] },
    { phrase: "the **prospect** of summer camp", answer: "possibility", choices: ["possibility", "cost", "memory", "problem"] },
    { phrase: "**supervise** the little kids", answer: "watch over", choices: ["watch over", "play with", "teach", "feed"] },
    { phrase: "**envision** a better playground", answer: "imagine", choices: ["imagine", "build", "draw", "clean"] },
    { phrase: "a **spectacular** sunset", answer: "amazing", choices: ["amazing", "early", "cloudy", "ordinary"] },
    { phrase: "an **inaudible** reply", answer: "unable to be heard", choices: ["unable to be heard", "rude", "fast", "silly"] },
    { phrase: "the **audience** at the concert", answer: "listeners", choices: ["listeners", "musicians", "tickets", "seats"] },
    { phrase: "an **audition** for the choir", answer: "tryout", choices: ["tryout", "uniform", "song", "practice"] },
    { phrase: "a **symphony** at the music hall", answer: "orchestra", choices: ["orchestra", "dancer", "piano", "speech"] },
    { phrase: "a barely **audible** sound", answer: "able to be heard", choices: ["able to be heard", "scary", "pleasant", "high"] },
    { phrase: "**predict** the weather", answer: "tell beforehand", choices: ["tell beforehand", "complain about", "enjoy", "change"] },
    { phrase: "a **vocalist** in the band", answer: "singer", choices: ["singer", "drummer", "manager", "fan"] },
    { phrase: "**contradict** your sister", answer: "say the opposite of", choices: ["say the opposite of", "agree with", "help", "call"] },
    { phrase: "a fun **avocation**", answer: "hobby", choices: ["hobby", "job", "holiday", "game show"] },
    { phrase: "the jury's **verdict**", answer: "decision", choices: ["decision", "question", "lawyer", "seat"] },
    { phrase: "chose a **vocation** in medicine", answer: "career", choices: ["career", "vacation", "class", "voice"] },
    { phrase: "the strict **dictator**", answer: "ruler", choices: ["ruler", "writer", "speaker", "soldier"] },
    { phrase: "a very **addictive** snack", answer: "habit-forming", choices: ["habit-forming", "healthy", "salty", "expensive"] },
  ],

  /* MEANING IN CONTEXT: pick the word that fits the blank. Wrong choices are other box words. */
  context: [
    { text: "Our class sat in the ___ to watch the spelling bee.", answer: "auditorium", choices: ["auditorium", "audition", "megaphone", "verdict"] },
    { text: "The magician's disappearing elephant trick was a real ___.", answer: "spectacle", choices: ["spectacle", "visor", "dictation", "symphony"] },
    { text: "Dad wore a ___ so the sun wouldn't get in his eyes.", answer: "visor", choices: ["visor", "spectator", "prospect", "phonics"] },
    { text: "Grandma plays the ___ in a jazz band on weekends.", answer: "saxophone", choices: ["saxophone", "megaphone", "auditorium", "verdict"] },
    { text: "Without my glasses, the tiny print is barely ___.", answer: "visible", choices: ["visible", "vocal", "addictive", "inaudible"] },
    { text: "The principal used a ___ so everyone on the field could hear.", answer: "megaphone", choices: ["megaphone", "saxophone", "visor", "dictator"] },
    { text: "Before kindergarten, I learned ___ to sound out the letters c-a-t.", answer: "phonics", choices: ["phonics", "symphony", "dictation", "respect"] },
    { text: "Our new speakers give the music a full, ___ sound.", answer: "stereophonic", choices: ["stereophonic", "visible", "addictive", "spectacular"] },
    { text: "The weather forecaster tried to ___ how much snow would fall.", answer: "predict", choices: ["predict", "revise", "supervise", "contradict"] },
    { text: "Max said the sky was green, so I had to ___ him.", answer: "contradict", choices: ["contradict", "predict", "envision", "respect"] },
    { text: "Mr. Lee read a ___, and we wrote down each sentence he said.", answer: "dictation", choices: ["dictation", "verdict", "vocation", "audience"] },
    { text: "My mom is a dentist, but her ___ is baking fancy cakes.", answer: "avocation", choices: ["avocation", "vocation", "verdict", "prospect"] },
    { text: "Kara was very ___ about wanting a later bedtime; she brought it up every night.", answer: "vocal", choices: ["vocal", "visible", "audible", "addictive"] },
    { text: "The ___ held the microphone and sang the first note.", answer: "vocalist", choices: ["vocalist", "spectator", "dictator", "audience"] },
    { text: "Two adults will ___ the field trip to the zoo.", answer: "supervise", choices: ["supervise", "envision", "contradict", "audition"] },
    { text: "Always show ___ to your elders by being polite.", answer: "respect", choices: ["respect", "prospect", "spectacle", "verdict"] },
  ],

  /* PREFIX & SUFFIX: questions about pre-, super-, -orium/-arium, and the roots inside words. */
  wordParts: [
    { q: "What does pre- mean in preheat?", answer: "before", choices: ["before", "after", "again", "not"] },
    { q: "What does super- mean in supervise?", answer: "above", choices: ["above", "under", "before", "against"] },
    { q: "What does -arium mean in aquarium?", answer: "place", choices: ["place", "person", "water", "full of"] },
    { q: "A place where you watch the stars and planets is a planet___.", answer: "planetarium", choices: ["planetarium", "planetator", "planetophone", "planetvis"] },
    { q: "A test you take before the real test is a ___.", answer: "pretest", choices: ["pretest", "retest", "supertest", "untest"] },
    { q: "A huge store that sells almost everything is a ___.", answer: "superstore", choices: ["superstore", "prestore", "storeium", "restore"] },
    { q: "To look at something before you buy it is to ___ it.", answer: "preview", choices: ["preview", "review", "supervise", "envision"] },
    { q: "Which word means \"to say before\"?", answer: "predict", choices: ["predict", "contradict", "verdict", "addictive"] },
    { q: "Which word means \"a place for hearing\"?", answer: "auditorium", choices: ["auditorium", "audience", "audition", "audible"] },
    { q: "Which word means \"to see from above\" (watch over)?", answer: "supervise", choices: ["supervise", "revise", "envision", "visible"] },
    { q: "Brushing your teeth helps ___ cavities (stop them before they start).", answer: "prevent", choices: ["prevent", "invent", "event", "repent"] },
    { q: "Times before written records were kept are called ___ times.", answer: "prehistoric", choices: ["prehistoric", "historic", "superhistoric", "posthistoric"] },
    { q: "In spectator, which part means \"see\"?", answer: "spect", choices: ["spect", "ator", "spec", "tator"] },
    { q: "In vocation, which part means \"call\" or \"voice\"?", answer: "voc", choices: ["voc", "ation", "cat", "vo"] },
    { q: "In megaphone, which part means \"sound\"?", answer: "phon", choices: ["phon", "mega", "meg", "one"] },
    { q: "In inaudible, the part in- means ___.", answer: "not", choices: ["not", "inside", "before", "again"] },
  ],

  /* WRITE IT: words to use in your own sentence. `check` is what a meaningful sentence shows. */
  sentences: [
    { word: "spectator", check: "Show someone watching an event, not playing in it." },
    { word: "supervise", check: "Show a person watching over and being in charge of others." },
    { word: "visible", check: "Show that something can or can't be seen." },
    { word: "revise", check: "Show someone looking over work again and changing it." },
    { word: "audible", check: "Show how easy or hard something is to hear." },
    { word: "audition", check: "Show someone trying out for a part, team, or group." },
    { word: "symphony", check: "Show an orchestra or a long piece of orchestra music." },
    { word: "megaphone", check: "Show someone making their voice louder to reach a crowd." },
    { word: "predict", check: "Show someone saying what will happen before it happens." },
    { word: "verdict", check: "Show a jury (or judge) giving a final decision." },
    { word: "vocation", check: "Show someone's job or calling." },
    { word: "dictator", check: "Show a ruler with total control who won't be questioned." },
  ],

  /* Quick tips for the cram card. */
  tips: [
    "Three lessons, three senses: Lesson 1 SEE (vis, spect), Lesson 2 HEAR (audi, phon), Lesson 3 SPEAK (dict, voc).",
    "Find the root first, then the meaning: spectATOR has SPECT = see, so a spectator sees.",
    "Watch the traps: vocation is a job, avocation is a hobby.",
    "Audible = can hear. Inaudible = can't hear (in- means not).",
    "Verdict = ver (truly) + dict (said): what the jury truly says.",
    "Saxophone, symphony, megaphone, stereophonic, phonics: all PHON, all sound.",
    "A meaningful sentence shows what the word means. \"I like the word verdict\" doesn't count.",
  ],
};
