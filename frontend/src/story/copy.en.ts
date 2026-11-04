import type { StoryCopy } from './copy.ts';

export const storyEn: StoryCopy = {
  ui: {
    backToStart: 'Back to the start',
    skipIntro: 'Skip intro',
    repository: 'Repository',
    backToDemo: '← Back to the demo',
    resetToIntro: '↺ Back to the intro',
    slideOf: (n, total) => `${n} of ${total}`,
    keysHint: 'Use the arrow keys or click to navigate',
    previous: 'Previous',
    next: 'Next',
    startJourney: 'Start the journey',
    behindTheScenes: 'Behind the scenes',
    back: 'Back',
    yourTurn: 'Your turn',
    stepDone: 'Done',
    switchToFree: 'Explore freely',
    switchToTour: 'Guided tour',
    exploreFreely: 'Explore freely',
    seeRecap: 'See the recap',
    showMore: 'Show more',
    showLess: 'Show less',
  },

  art: { store: 'Store', customer: 'Customer', midnight: 'Midnight', market: 'Market', agent: 'AI agent' },

  intro: {
    welcome: {
      kicker: 'Welcome to',
      title: 'Aegis',
      body: 'Every purchase says something about you. Today the product is not what you buy: it is **you**. What if the market could know **what sells** without knowing **who bought it**?',
    },
    disclaimer: {
      title: 'Before we start',
      body: 'This is a **demo** on **Preprod**, the Midnight test network. The store and the products are made up and the signals have no real value. What is real: every step is an **actual transaction**, with a zero-knowledge proof anyone can verify.',
    },
    problem: {
      title: 'Your purchases have an owner, and it is not you',
      body: 'Every purchase, every loyalty card, every click: data brokers and big platforms build **profiles about you** and sell them to the highest bidder. The ones buying them are not small shops, which **compete blind**.',
    },
    idea: {
      title: 'One purchase, one anonymous signal',
      body: '*Aegis* turns every purchase into an **anonymous signal**: only what the customer decides is revealed. Added together, signals **draw the market**. On their own, they say nothing about anyone.',
    },
    players: {
      title: 'Who takes part',
      body: 'Five pieces, each with its own role, and none sees more than it needs.',
      items: [
        { title: 'Store', text: 'Charges and seals the receipt. Proves it is a registered store without saying which one.' },
        { title: 'Customer', text: 'Keeps their receipts on their phone and decides when to publish the signal and what it shows.' },
        { title: 'Midnight', text: 'Runs the contract and verifies the proofs. Keeps the store registry and the public counters.' },
        { title: 'Public market', text: 'Anyone can see what is happening in the market, in real time.' },
        { title: 'AI agent', text: 'Reads only the anonymous signals and writes a personalised report for each store.' },
      ],
    },
    flow: {
      title: 'How a purchase travels',
      body: 'From the store to the market in five steps.',
      steps: [
        'The store charges and seals the receipt: it publishes a commitment and proves, anonymously, that it is in the tree.',
        'The customer gets the receipt as a QR and keeps it on their phone. The full receipt never goes on-chain.',
        'Whenever they want, the customer publishes the signal: a ZK proof that their receipt is sealed and unused. They decide what to reveal.',
        'The contract marks the receipt as used and adds the units to the public data.',
        'The agent reads the public data and summarises the market in real time.',
      ],
    },
    publicPrivate: {
      title: 'What is public and what is not',
      body: 'What anyone can see on-chain, and what never leaves your phone.',
      columns: [
        {
          title: 'Public on Midnight',
          items: [
            'That a registered store sealed a receipt, not which one',
            'The receipt commitment',
            'The information from each receipt that the customer decides to publish',
            'The counters for each category',
          ],
        },
        {
          title: 'Only on your phone',
          items: [
            'The full receipt: products, amount, card, etc.',
            'The store where you bought',
            'Your shopping profile',
            'Ownership of your data',
          ],
        },
      ],
    },
    builtWith: {
      title: 'Built on Midnight',
      body: '*Aegis* uses the Midnight infrastructure so privacy is guaranteed by cryptography, not by a promise.',
    },
    mission: {
      title: 'Your mission in this demo',
      body: 'You will make a purchase in the demo store and turn it into an **anonymous signal**. Along the way you will see what happens behind each step.',
    },
    ready: {
      title: 'Ready to begin?',
      body: 'The guided demo starts with your Midnight wallet and moves on by itself as you complete each step.',
    },
  },

  recap: {
    experienced: {
      title: 'What you just did',
      body: 'You turned a purchase into market data without giving away your data. That is how small shops compete with the big ones and you keep ownership of your information:',
      steps: [
        'You connected your wallet, or used the *Aegis* sponsorship',
        'You checked on Midnight that the store is registered',
        'The store sealed your receipt without saying which one it is',
        'You took the receipt to your phone with a QR',
        'You chose what to share and a ZK proof published the signal',
        'Your signal added to the public figures, and the agent only read the whole',
      ],
    },
    beyond: {
      title: 'Beyond commerce',
      body: 'The purchase is just the example. The same idea works wherever you need to **count without watching**: a registered issuer seals a fact and the person decides when to publish it and what to share. Surveys, public transport or event attendance.',
    },
    pieces: {
      title: 'Built on Midnight',
      body: 'What *Aegis* uses from Midnight, and where to read more.',
    },
    start: {
      title: 'Carry on by yourself',
      body: 'The code is open. You can deploy your own contract and try it yourself.',
    },
  },

  stackGroups: ['Midnight', 'Tools'],
  stack: {
    compact: { title: 'Compact', text: 'The contract language: the circuits that prove each step and the public counters.' },
    proofServer: { title: 'Proof server', text: 'Generates the zero-knowledge proofs, at *Aegis* or on your own machine.' },
    disclosure: { title: 'Selective disclosure', text: 'Each customer decides which part of their purchase becomes public. The rest stays on their phone.' },
    indexer: { title: 'Indexer', text: 'Reads the public contract state and follows every transaction live.' },
    dust: { title: 'Sponsored fees', text: 'The resource that pays the fees. Here *Aegis* can pay them for you.' },
    midnightJs: { title: 'Midnight.js', text: 'The SDK used to build, prove and send the transactions.' },
    wallets: { title: 'Lace and 1AM', text: 'Midnight wallets: they sign and pay from the browser with the DApp Connector.' },
  },

  mission: {
    buy: { title: 'Buy', text: 'at the store till' },
    scan: { title: 'Get the receipt', text: 'on your phone, with a QR' },
    choose: { title: 'Choose what to share', text: 'and publish the signal' },
    watch: { title: 'Watch the market', text: 'with your purchase in it' },
  },

  resources: {
    repo: { title: 'Repository', text: 'The *Aegis* code: the contract, the backend and this website.' },
    docs: { title: 'Midnight docs', text: 'Compact, ZK proofs and how to build on Midnight.' },
    contact: { title: 'Get in touch', text: 'alvaro@tricubo.tech' },
  },

  tour: {
    wallet: {
      title: 'Connect your wallet (optional)',
      body: 'You are about to follow a purchase from a store\'s till all the way to the public market, and every step will be a **real transaction** on Midnight.\n\nYou can sign them yourself with **Lace** or **1AM** on a computer, or carry on without connecting anything: *Aegis* pays the fees for you.',
    },
    ribbon: {
      title: 'The market figures',
      body: 'These are the market\'s **public figures**. They live on Midnight and anyone can read and check them.\n\nThere are no names or receipts behind them, only what each customer chose to share. Look at the total: by the end of the journey, your purchase will add one more.',
    },
    registry: {
      title: 'A registry you can trust',
      body: 'If anyone could seal receipts, anyone could make up purchases and fake the market. That is why stores sign up, and their **public key** goes into a **Merkle tree**, a compact list kept in the contract.\n\nThat way, every small shop knows the figures it reads come from real purchases.',
      todo: 'Press "Check registry"',
    },
    addToCart: {
      title: 'Add something to the basket',
      body: 'It all starts as usual: someone buys something. Each product carries a **category** and a **subcategory**, for example Fashion › Shoes.\n\nThat is the minimum that will reach the market, and it is enough to know what sells. When publishing, the customer can add more, such as their age range or how much they spent, in exchange for offers from the stores.',
      todo: 'Add a product to the basket',
    },
    charge: {
      title: 'The store issues the receipt',
      body: 'At checkout, the store does not put the receipt on-chain. It publishes a **commitment**: a sealed envelope that proves the receipt exists without showing what is inside.\n\nAt the same time, with a **ZK proof**, it shows it is in the registry **without saying which store it is**. Midnight checks it and the envelope is sealed.',
      todo: 'Press "Charge & generate QR"',
    },
    receipt: {
      title: 'The receipt travels with you',
      body: 'The full receipt is not in any database. It travels inside this **QR**, and no server ever reads it.\n\nScan it with your phone to live the real flow, or carry on here. Either way the receipt is already yours, and later you will choose which information from it you want to share.',
    },
    ticket: {
      title: 'The receipt, on your phone',
      body: 'The *Aegis* app keeps receipts **only on your device**, with no account or server behind it. At the top is the one you just received. Below, your earlier purchases.\n\nThe store has already sealed the envelope. Now you decide what to do with it.',
      todo: 'Press "Publish signal" on the new receipt',
    },
    share: {
      title: 'Your data, your decision',
      body: 'Today, others decide what is known about your purchases. Here **you** decide, and whatever you do not want to share stays with you.\n\nThis is **selective disclosure**: nobody can build a profile of you behind your back. The more you share, the better the offers you get. Stores will know **what you like**, but never **who you are**.',
      todo: 'Publish the signal',
    },
    publish: {
      title: 'The proof, under way',
      body: 'What reaches Midnight is not your receipt but a **ZK proof**: a registered store sealed it and nobody has used it yet. Midnight verifies it without seeing anything else.\n\nThen it marks that envelope as used, to prevent double use, and adds your purchase to the market figures.',
      todo: 'Wait for the signal to reach the aggregate',
    },
    market: {
      title: 'Your signal now counts',
      body: 'In a few seconds, your signal will be part of the **public figures**, and the market will draw itself with it. Here you can compare periods and watch the latest signals live.\n\nAnyone can see that one more signal has arrived. Nobody knows it was you. And a small shop, somewhere, knows a little better what to sell.',
    },
    report: {
      title: 'A small store, with the vision of a big one',
      body: 'This is what everything before is for. An **AI agent** reads the public figures and tells each store what is rising, what is falling and what to do to sell more.\n\nWhat only the big chains could afford before is now within reach of any store. And without any customer giving up their privacy.',
    },
    explore: {
      title: 'Now, on your own',
      body: 'You have followed the whole journey. Now the demo is yours: make more purchases, change what you share, generate the proof on your own machine or watch the market move.\n\nWhenever you want, the recap goes over everything you saw.',
    },
  },
};
