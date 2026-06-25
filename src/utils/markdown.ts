import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { markedEmoji } from 'marked-emoji';
import markedFootnote from 'marked-footnote';

// Configure marked extensions
marked.use(markedEmoji({
  emojis: {
    // Common emojis - feel free to add more!
    smile: '😄',
    grin: '😁',
    joy: '🤣',
    wink: '😉',
    blush: '😊',
    relieved: '😌',
    yum: '😋',
    smirk: '😏',
    sleepy: '😪',
    mask: '😷',
    sick: '🤒',
    woozy: '🥴',
    dizzy: '😵',
    angry: '😠',
    rage: '😡',
    shocked: '😱',
    astonished: '😲',
    pleading: '🥺',
    sleepyface: '😴',
    hug: '🤗',
    sweat: '😅',
    sweatdrop: '💧',
    sneeze: '🤧',
    cowboy: '🤠',
    party: '🥳',
    nerd: '🤓',
    monocle: '🧐',
    zipper: '🤐',
    halo: '😇',
    devil: '😈',
    skull: '💀',
    ghost: '👻',
    alien: '👽',
    robot: '🤖',
    poop: '💩',
    kiss: '😘',
    kissing: '😗',
    hearts: '💕',
    brokenheart: '💔',
    heartbeat: '💓',
    heartpulse: '💗',
    blueheart: '💙',
    greenheart: '💚',
    yellowheart: '💛',
    purpleheart: '💜',
    blackheart: '🖤',
    whiteheart: '🤍',
    brownheart: '🤎',
    flex: '💪',
    pray: '🙏',
    handshake: '🤝',
    writing: '✍️',
    pointingup: '☝️',
    pointingright: '👉',
    pointingleft: '👈',
    pointingdown: '👇',
    raisedhand: '✋',
    okhand: '👌',
    fingerscrossed: '🤞',
    fist: '✊',
    victory: '✌️',
    callme: '🤙',
    palmsup: '🤲',
    baby: '👶',
    boy: '👦',
    girl: '👧',
    man: '👨',
    woman: '👩',
    oldman: '👴',
    oldwoman: '👵',
    police: '👮',
    detective: '🕵️',
    guard: '💂',
    ninja: '🥷',
    teacher: '🧑‍🏫',
    student: '🧑‍🎓',
    doctor: '🧑‍⚕️',
    engineer: '🧑‍🔧',
    scientist: '🧑‍🔬',
    astronaut: '🧑‍🚀',
    pilot: '🧑‍✈️',
    artist: '🧑‍🎨',
    dog: '🐶',
    cat: '🐱',
    mouse: '🐭',
    hamster: '🐹',
    rabbit: '🐰',
    fox: '🦊',
    bear: '🐻',
    panda: '🐼',
    koala: '🐨',
    tiger: '🐯',
    lion: '🦁',
    cow: '🐮',
    pig: '🐷',
    frog: '🐸',
    monkey: '🐵',
    chicken: '🐔',
    penguin: '🐧',
    bird: '🐦',
    eagle: '🦅',
    duck: '🦆',
    owl: '🦉',
    snake: '🐍',
    dragon: '🐉',
    unicorn: '🦄',
    bee: '🐝',
    butterfly: '🦋',
    snail: '🐌',
    bug: '🐛',
    ant: '🐜',
    ladybug: '🐞',
    fish: '🐟',
    dolphin: '🐬',
    whale: '🐳',
    rose: '🌹',
    tulip: '🌷',
    sunflower: '🌻',
    blossom: '🌼',
    mapleleaf: '🍁',
    clover: '🍀',
    palm: '🌴',
    cactus: '🌵',
    mushroom: '🍄',
    apple: '🍎',
    greenapple: '🍏',
    banana: '🍌',
    watermelon: '🍉',
    grapes: '🍇',
    strawberry: '🍓',
    cherries: '🍒',
    peach: '🍑',
    mango: '🥭',
    pineapple: '🍍',
    lemon: '🍋',
    coconut: '🥥',
    avocado: '🥑',
    bread: '🍞',
    croissant: '🥐',
    burger: '🍔',
    fries: '🍟',
    pizza: '🍕',
    hotdog: '🌭',
    taco: '🌮',
    burrito: '🌯',
    ramen: '🍜',
    spaghetti: '🍝',
    curry: '🍛',
    sushi: '🍣',
    dumpling: '🥟',
    icecream: '🍨',
    donut: '🍩',
    cookie: '🍪',
    cake: '🍰',
    chocolate: '🍫',
    coffee: '☕',
    tea: '🍵',
    beer: '🍺',
    wine: '🍷',
    cocktail: '🍹',
    milk: '🥛',
    water: '💧',
    soccer: '⚽',
    basketball: '🏀',
    football: '🏈',
    baseball: '⚾',
    tennis: '🎾',
    volleyball: '🏐',
    cricket: '🏏',
    hockey: '🏒',
    pingpong: '🏓',
    badminton: '🏸',
    bowling: '🎳',
    boxing: '🥊',
    martialarts: '🥋',
    medal: '🏅',
    trophy: '🏆',
    crown: '👑',
    ring: '💍',
    gem: '💎',
    camera: '📷',
    video: '📹',
    tv: '📺',
    radio: '📻',
    headphones: '🎧',
    microphone: '🎤',
    speaker: '🔊',
    battery: '🔋',
    plug: '🔌',
    lightbulb: '💡',
    magnet: '🧲',
    toolbox: '🧰',
    wrench: '🔧',
    hammer: '🔨',
    gear: '⚙️',
    scissors: '✂️',
    key: '🔑',
    lock: '🔒',
    unlock: '🔓',
    car: '🚗',
    taxi: '🚕',
    bus: '🚌',
    truck: '🚚',
    train: '🚆',
    subway: '🚇',
    airplane: '✈️',
    helicopter: '🚁',
    bicycle: '🚲',
    motorcycle: '🏍️',
    ship: '🚢',
    house: '🏠',
    building: '🏢',
    office: '🏬',
    hospital: '🏥',
    school: '🏫',
    bank: '🏦',
    hotel: '🏨',
    moneybag: '💰',
    dollar: '💵',
    coin: '🪙',
    chartup: '📈',
    chartdown: '📉',
    gift: '🎁',
    balloon: '🎈',
    megaphone: '📣',
    loudspeaker: '📢',
    bell: '🔔',
    hourglass: '⏳',
    stopwatch: '⏱️',
    puzzle: '🧩',
    dice: '🎲',
    joystick: '🕹️',
    cards: '🃏',
    crystalball: '🔮',
    magicwand: '🪄',
    writinghand: '✍️',
    notebook: '📓',
    notepad: '📝',
    clipboard: '📋',
    file: '📄',
    folder: '📁',
    archive: '🗄️',
    trash: '🗑️',
    shield: '🛡️',
    sword: '🗡️',
    bomb: '💣',
    rainbow: '🌈',
    volcano: '🌋',
    mountain: '⛰️',
    waterfall: '🌊',
    desert: '🏜️',
    forest: '🌲',
    ocean: '🌊',
    wind: '💨',
    comet: '☄️',
    star2: '🌟',
    constellation: '✨',
    milkyway: '🌌',
    tornado: '🌪️',
    hurricane: '🌀',
    siren: '🚨',
    policecar: '🚓',
    firetruck: '🚒',
    ambulance: '🚑',
    pill: '💊',
    syringe: '💉',
    bookmark: '🔖',
    label: '🏷️',
    shuffle: '🔀',
    repeat: '🔁',
    play: '▶️',
    pause: '⏸️',
    stop: '⏹️',
    record: '⏺️',
    heart: '❤️',
    thumbsup: '👍',
    thumbsdown: '👎',
    fire: '🔥',
    rocket: '🚀',
    star: '⭐',
    check: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    tada: '🎉',
    thinking: '🤔',
    confused: '😕',
    cry: '😢',
    laugh: '😂',
    cool: '😎',
    wave: '👋',
    clap: '👏',
    brain: '🧠',
    bulb: '💡',
    book: '📚',
    pencil: '✏️',
    computer: '💻',
    phone: '📱',
    email: '📧',
    calendar: '📅',
    clock: '🕐',
    globe: '🌍',
    sun: '☀️',
    moon: '🌙',
    cloud: '☁️',
    rain: '🌧️',
    snow: '❄️',
    salute: '🫡',
    melting: '🫠',
    tearsjoy: '🥲',
    handheart: '🫶',
    palmface: '🤦',
    shrugguy: '🤷',
    salutehand: '🫡',
    shakehead: '🙅',
    nod: '🙆',
    lotus: '🧘',
    breathe: '🫁',
    handshakeheart: '🤝💖',
    fingersnap: '🫰',
    palmslap: '🫳',
    grab: '🫴',
    pinch: '🤏',
    saluteemoji: '🫡',

    superhero: '🦸',
    supervillain: '🦹',
    mage: '🧙',
    fairy: '🧚',
    vampire: '🧛',
    zombie: '🧟',
    mermaid: '🧜',
    elf: '🧝',
    genie: '🧞',
    troll: '🧌',

    smilecat: '😺',
    joycat: '😹',
    smirkcat: '😼',
    screamcat: '🙀',
    kisscat: '😽',
    sadcat: '😿',
    poutingcat: '😾',

    dodo: '🦤',
    bison: '🦬',
    mammoth: '🦣',
    beaver: '🦫',
    otter: '🦦',
    sloth: '🦥',
    orangutan: '🦧',
    flamingo: '🦩',
    swan: '🦢',
    dino: '🦕',
    trex: '🦖',
    bat: '🦇',
    llama: '🦙',
    kangaroo: '🦘',
    hippo: '🦛',
    rhino: '🦏',
    parrot: '🦜',
    peacock: '🦚',
    hedgehog: '🦔',
    crab: '🦀',
    lobster: '🦞',
    squid: '🦑',
    oyster: '🦪',

    lotusflower: '🪷',
    pottedplant: '🪴',
    seedling: '🌱',
    herb: '🌿',
    bouquet: '💐',
    evergreen: '🌲',
    deciduous: '🌳',
    rock: '🪨',
    wood: '🪵',

    fondue: '🫕',
    tamale: '🫔',
    bubbletea: '🧋',
    falafel: '🧆',
    waffle: '🧇',
    butter: '🧈',
    oysterfood: '🦪',
    flatbread: '🫓',
    fonduefood: '🫕',
    currybread: '🫓',
    eggroll: '🥚',
    fortune_cookie: '🥠',
    pretzel: '🥨',
    cheese: '🧀',
    bacon: '🥓',
    steak: '🥩',
    cutfruit: '🍡',
    soup: '🥣',
    salad: '🥗',
    biscuit: '🫓',

    garlic: '🧄',
    onion: '🧅',
    olive: '🫒',
    pepper: '🫑',
    carrot: '🥕',
    corn: '🌽',
    eggplant: '🍆',
    potato: '🥔',
    broccoli: '🥦',
    cucumber: '🥒',

    toolbox2: '🪛',
    sewingneedle: '🪡',
    hook: '🪝',
    ladder: '🪜',
    razor: '🪒',
    mirror: '🪞',
    window: '🪟',
    plunger: '🪠',

    backpack: '🎒',
    fireextinguisher: '🧯',
    compass: '🧭',
    abacus: '🧮',
    testtube: '🧪',
    petri: '🧫',
    dna: '🧬',
    microbe: '🦠',

    boomerang: '🪃',
    kite: '🪁',
    parachute: '🪂',
    ringbuoy: '🛟',
    eightball: '🎱',
    puzzlepiece: '🧩',
    chess: '♟️',
    frisbee: '🥏',
    yo_yo: '🪀',
    pinata: '🪅',
    nestingdoll: '🪆',

    banjo: '🪕',
    accordion: '🪗',
    flute: '🪈',
    drum: '🥁',
    maracas: '🪇',
    xylophone: '🛢️',

    computerold: '🖥️',
    keyboard: '⌨️',
    mousepc: '🖱️',
    trackball: '🖲️',
    printer: '🖨️',
    disc: '💽',
    floppy: '💾',
    minidisc: '💿',

    satellite: '🛰️',
    radar: '📡',
    telescope: '🔭',
    microscope: '🔬',

    chair: '🪑',
    couch: '🛋️',
    bed: '🛏️',
    bellhop: '🛎️',
    coffeemachine: '☕',
    teapot: '🫖',
    bowl: '🥣',

    vote: '🗳️',
    ballot: '🗳️',
    lightblueheart: '🩵',
    greyheart: '🩶',
    pinkheart: '🩷',

    leg: '🦵',
    foot: '🦶',
    brain2: '🧠',
    lungs: '🫁',
    tooth: '🦷',
    bone: '🦴',

    stethoscope: '🩺',
    therapy: '🛏️',
    bandage: '🩹',
    crutch: '🩼',
    wheelchair: '♿',
    cane: '🦯',
    adhesive: '🩹',

    candle: '🕯️',
    diya: '🪔',
    nazar: '🧿',
    knot: '🪢',
    broom: '🧹',
    basket: '🧺',
    thread: '🧵',
    yarn: '🧶',

    firecracker: '🧨',
    sparkler: '✨',
    lantern: '🏮',
    diya2: '🪔',

    pickuptruck: '🛻',
    scooter: '🛴',
    skateboard: '🛹',
    rollerblade: '🛼',
    flyingdisc: '🥏',
    canoe: '🛶',

    passport: '🛂',
    luggage: '🧳',
    globeasia: '🌏',
    globeamericas: '🌎',
    compass2: '🧭',
    map: '🗺️',

    train2: '🚈',
    cablecar: '🚠',
    gondola: '🚡',
    monorail: '🚝',

    fuelpump: '⛽',
    charging: '🔌',
    seat: '💺',
    anchor: '⚓',
    wheel: '🛞',

    brick: '🧱',
    hook2: '🪝',
    hammerpick: '⛏️',
    axe: '🪓',
    saw: '🪚',
    screwdriver: '🪛',
    chainsaw: '🪚⚙️',

    tent: '⛺',
    camping: '🏕️',
    lighthouse: '🗼',
    bench: '🪑',

    volcano2: '🌋',
    island: '🏝️',
    desertisland: '🏝️',
    snowman: '☃️',
    snowglobe: '🪅',

    thermometer: '🌡️',
    droplet: '💦',
    fire2: '🔥',
    spark: '⚡',
    cyclone: '🌀',
    fog: '🌫️',

    moonface: '🌝',
    newmoonface: '🌚',
    shootingstar: '🌠',
    rings: '🪐',

    christmastree: '🎄',
    fireworks: '🎆',
    sparkles: '✨',
    confetti: '🎊',
    streamer: '🪅',

    placard: '🪧',
    poster: '🖼️',
    frame: '🖼️',

    moviecamera: '🎥',
    clapper: '🎬',
    film: '🎞️',

    megaphone2: '📢',
    mute: '🔇',
    vibration: '📳',
    antenna: '📡',

    inbox: '📥',
    outbox: '📤',
    package: '📦',
    mailbox: '📫',

    receipt: '🧾',
    moneywithwings: '💸',
    creditcard: '💳',

    heavycheck: '✔️',
    heavycross: '✖️',
    plus: '➕',
    minus: '➖',

    recycle: '♻️',
    radiation: '☢️',
    biohazard: '☣️',

    abacus2: '🧮',
    ruler: '📏',
    triangle: '📐',
    calculator: '🧮',

    fountainpen: '🖋️',
    pen: '🖊️',
    paintbrush: '🖌️',
    crayon: '🖍️',

    bookopen: '📖',
    books: '📚',
    scroll: '📜',

    hourglassdone: '⌛',
    timer: '⏲️',

    key2: '🗝️',
    lock2: '🔐',

    flagwhite: '🏳️',
    flagblack: '🏴',
    checkeredflag: '🏁',

    diamondblue: '🔷',
    diamondorange: '🔶',
    diamondsmall: '🔹',
    diamondsse: '🔸',

    joystick2: '🕹️',
    cd: '💿',
    tape: '📼',

    maskparty: '🎭',
    ticket: '🎫',
    circus: '🎪',

    bucket: '🪣',
    sponge: '🧽',
    soap: '🧼',
    plunger2: '🪠',

    magnet2: '🧲',
    battery2: '🔋',

    planet: '🪐',
    meteor: '☄️',

    shoppingcart: '🛒',
    bag: '🛍️',

    wrench2: '🔧',
    nutbolt: '🔩',

    knitting: '🧶',
    sewing: '🧵',

    newspaper: '📰',
    fax: '📠',

    oil: '🛢️',
    brick2: '🧱',

    cage: '🪺',
    nest: '🪹',
    nesteggs: '🪺',

    boomerang2: '🪃',
    magicwand2: '🪄',
    scroll2: '📜',

    medal2: '🏅',
    sash: '🎗️',
    ribbon: '🎀',

    laundry: '🧺',
    ironing: '🧼',

    coffin: '⚰️',
    urn: '⚱️',

    shield2: '🛡️',
    crossshield: '🛡️⚔️',

    bank2: '🏦',
    store: '🏪',
    postoffice: '🏣',

    testtube2: '🧪',
    petri2: '🧫',

    shoppingbag: '🛍️',
    trademark: '™️',
    copyright: '©️',
    registered: '®️',

    barbell: '🏋️',
    dumbbell: '🏋️‍♂️',
    gymnast: '🤸',

    boxtime: '📦⌛',
    clipboardcheck: '📋✔️',
    edit: '✏️📝',
    loading: '🔄',
    hourglasssoon: '⏳',

    waterwave: '🌊',
    drop2: '💧',

    pipe: '🚬',
    match: '🧯',

    microscope2: '🔬',
    telescope2: '🔭',

    wand: '🪄',
    potion: '🧪✨',

    smileyplus: '🙂➕',
    dizzy2: '💫',
    exclamation: '❗',
    question: '❓',

  },
}));

marked.use(markedFootnote());

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

// Custom renderer for better control
const renderer = new marked.Renderer();

// Override code rendering to add custom classes
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  return `<pre class="code-block" data-language="${lang || ''}"><code>${text}</code></pre>`;
};

// Override table rendering for custom styling
renderer.table = (token: any) => {
  const header = `<tr>${token.header.map((cell: any) => `<th>${cell.text}</th>`).join('')}</tr>`;
  const rows = token.rows.map((row: any) => 
    `<tr>${row.map((cell: any) => `<td>${cell.text}</td>`).join('')}</tr>`
  ).join('');
  return `<div class="table-wrapper"><table class="markdown-table"><thead>${header}</thead><tbody>${rows}</tbody></table></div>`;
};

// Override image rendering for better styling and error handling
renderer.image = ({ href, title, text }: { href: string; title: string | null; text: string }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : ' alt="Image"';
  return `<div class="markdown-image-wrapper">
    <img src="${href}"${altAttr}${titleAttr} class="markdown-image" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23475569%22 font-family=%22Arial%22 font-size=%2216%22 text-anchor=%22middle%22 x=%22200%22 y=%22150%22%3EImage failed to load%3C/text%3E%3C/svg%3E'; this.classList.add('image-error');" />
    ${text || title ? `<p class="markdown-image-caption">${text || title}</p>` : ''}
  </div>`;
};

marked.use({ renderer });

// Process math expressions in markdown
function processMathExpressions(text: string): { processed: string; mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }> } {
  const mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }> = [];
  
  let processed = text;
  
  // First, protect code blocks from math processing
  const codeBlocks: string[] = [];
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });
  
  // Also protect inline code
  const inlineCodes: string[] = [];
  processed = processed.replace(/`[^`]+`/g, (match) => {
    inlineCodes.push(match);
    return `__INLINECODE_${inlineCodes.length - 1}__`;
  });
  
  // Handle LaTeX display math with square brackets \[...\] (must come before $$ to avoid conflicts)
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_match, expr) => {
    mathExpressions.push({ type: 'display', expr: expr.trim() });
    return `\n\n<span data-math-id="${mathExpressions.length - 1}" data-math-type="display"></span>\n\n`;
  });
  
  // Handle LaTeX inline math with parentheses \(...\)
  processed = processed.replace(/\\\((.*?)\\\)/g, (_match, expr) => {
    mathExpressions.push({ type: 'inline', expr: expr.trim() });
    return `<span data-math-id="${mathExpressions.length - 1}" data-math-type="inline"></span>`;
  });
  
  // Handle display math ($$...$$)
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr) => {
    mathExpressions.push({ type: 'display', expr: expr.trim() });
    return `\n\n<span data-math-id="${mathExpressions.length - 1}" data-math-type="display"></span>\n\n`;
  });
  
  // Handle inline math ($...$) - not crossing line boundaries
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, expr) => {
    mathExpressions.push({ type: 'inline', expr: expr.trim() });
    return `<span data-math-id="${mathExpressions.length - 1}" data-math-type="inline"></span>`;
  });
  
  // Restore inline code
  processed = processed.replace(/__INLINECODE_(\d+)__/g, (_match, index) => {
    return inlineCodes[parseInt(index)];
  });
  
  // Restore code blocks
  processed = processed.replace(/__CODEBLOCK_(\d+)__/g, (_match, index) => {
    return codeBlocks[parseInt(index)];
  });

  return { processed, mathExpressions };
}

function restoreMathExpressions(html: string, mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }>): string {
  // Replace the placeholder spans with rendered KaTeX
  let result = html.replace(/<span data-math-id="(\d+)" data-math-type="(inline|display)"><\/span>/g, (_match, index, type) => {
    const mathIndex = parseInt(index);
    if (mathIndex >= mathExpressions.length) return _match;
    
    const expr = mathExpressions[mathIndex].expr;
    try {
      const rendered = katex.renderToString(expr, {
        displayMode: type === 'display',
        throwOnError: false,
        output: 'html',
        strict: false,
        trust: false,
      });
      
      if (type === 'display') {
        return `<div class="math-display">${rendered}</div>`;
      } else {
        return `<span class="math-inline">${rendered}</span>`;
      }
    } catch (e) {
      console.error('KaTeX rendering error:', e, 'Expression:', expr);
      // Return original expression if rendering fails
      return type === 'display' ? `<div class="math-error">$$${expr}$$</div>` : `<span class="math-error">$${expr}$</span>`;
    }
  });
  
  // Post-process: Convert common mathematical notation in plain text to proper formatting
  // This handles cases where the AI writes things like "m_1" or "10^{-11}" in descriptions
  result = result.replace(/\b([a-zA-Z])_\{?(\d+|[a-zA-Z]+)\}?/g, (match, base, subscript) => {
    // Skip if inside code blocks or already in math
    if (match.includes('<') || match.includes('data-math')) return match;
    try {
      const rendered = katex.renderToString(`${base}_{${subscript}}`, {
        displayMode: false,
        throwOnError: false,
      });
      return `<span class="math-inline">${rendered}</span>`;
    } catch {
      return match;
    }
  });
  
  // Handle superscripts like 10^{-11} or x^2
  result = result.replace(/(\d+|\([^)]+\))\^\{?(-?\d+)\}?/g, (match, base, exponent) => {
    if (match.includes('<') || match.includes('data-math')) return match;
    try {
      const rendered = katex.renderToString(`${base}^{${exponent}}`, {
        displayMode: false,
        throwOnError: false,
      });
      return `<span class="math-inline">${rendered}</span>`;
    } catch {
      return match;
    }
  });
  
  return result;
}

// Main function to render markdown with math support
export function renderMarkdownToHTML(content: string): string {
  try {
    // Pre-process: Fix image markdown that might be on separate lines or with extra formatting
    // Convert patterns like "![alt]\nurl" to proper markdown
    let preprocessed = content.replace(/!\[([^\]]*)\]\s*\n?\s*(https?:\/\/[^\s]+)/g, '![$1]($2)');
    
    // Also handle cases where the URL might be in italic or plain text after the image declaration
    preprocessed = preprocessed.replace(/!\[([^\]]*)\]\s*\n?\s*([^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi, '![$1]($2)');
    
    // Process math expressions first
    const { processed, mathExpressions } = processMathExpressions(preprocessed);
    
    // Parse markdown
    let html = marked.parse(processed) as string;
    
    // Restore math expressions
    html = restoreMathExpressions(html, mathExpressions);
    
    // Post-process: Convert plain text image URLs that weren't caught by markdown parser
    // Look for lines that have image descriptions followed by URLs
    html = html.replace(/<p>!\[([^\]]*)\]<\/p>\s*<p><em>(https?:\/\/[^<]+)<\/em><\/p>/gi, 
      '<div class="markdown-image-wrapper"><img src="$2" alt="$1" class="markdown-image" loading="lazy" /><p class="markdown-image-caption">$1</p></div>');
    
    html = html.replace(/<p>!\[([^\]]*)\]<\/p>\s*<p>(https?:\/\/[^<]+)<\/p>/gi, 
      '<div class="markdown-image-wrapper"><img src="$2" alt="$1" class="markdown-image" loading="lazy" /><p class="markdown-image-caption">$1</p></div>');
    
    // Also handle inline image syntax that got split across elements
    html = html.replace(/!\[([^\]]*)\]\s*<em>(https?:\/\/[^<]+)<\/em>/gi, 
      '<div class="markdown-image-wrapper"><img src="$2" alt="$1" class="markdown-image" loading="lazy" /><p class="markdown-image-caption">$1</p></div>');
    
    // Sanitize HTML
    const clean = DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'annotation', 'mtext', 'mtable', 'mtr', 'mtd'],
      ADD_ATTR: ['class', 'style', 'data-language', 'data-math-id', 'data-math-type', 'xmlns', 'encoding', 'aria-hidden', 'loading'],
      ALLOWED_TAGS: [
        'a', 'b', 'strong', 'i', 'em', 'u', 'strike', 'del', 's', 'code', 'pre',
        'p', 'br', 'span', 'div', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'img', 'sup', 'sub', 'figure', 'figcaption',
        // KaTeX elements
        'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'annotation', 'mtext', 'mtable', 'mtr', 'mtd'
      ],
      ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title', 'data-language', 'colspan', 'rowspan', 'data-math-id', 'data-math-type', 'xmlns', 'encoding', 'aria-hidden', 'loading', 'width', 'height'],
    });
    
    return clean;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return `<p>${content}</p>`;
  }
}


